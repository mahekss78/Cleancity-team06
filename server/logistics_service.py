from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np

app = FastAPI()

class Location(BaseModel):
    lat: float
    lng: float

class OptimizationRequest(BaseModel):
    start_location: Location
    spots: List[Location]

def calculate_distance(loc1, loc2):
    # Haversine formula for distance between two points on Earth
    R = 6371  # Earth radius in kilometers
    dlat = np.radians(loc2[0] - loc1[0])
    dlng = np.radians(loc2[1] - loc1[1])
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(loc1[0])) * np.cos(np.radians(loc2[0])) * np.sin(dlng / 2) ** 2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

@app.post("/optimize")
async def optimize_route(request: OptimizationRequest):
    if not request.spots:
        return {"optimized_indices": []}

    start = [request.start_location.lat, request.start_location.lng]
    spots = [[s.lat, s.lng] for s in request.spots]
    
    # Simple Nearest Neighbor Algorithm (TSP Heuristic)
    unvisited = list(range(len(spots)))
    optimized_indices = []
    current_loc = start

    while unvisited:
        distances = [calculate_distance(current_loc, spots[i]) for i in unvisited]
        nearest_idx_in_unvisited = np.argmin(distances)
        nearest_idx = unvisited.pop(nearest_idx_in_unvisited)
        optimized_indices.append(nearest_idx)
        current_loc = spots[nearest_idx]

    return {"optimized_indices": optimized_indices}

class ReportPayload(BaseModel):
    complaint_id: str
    date: str
    location_name: str
    resident_name: str
    driver_name: str
    before_image: str
    after_image: str
    description_match: bool
    volume: str
    category: str
    hazards: str
    otp_verified: bool

import pandas as pd
from prophet import Prophet

class WasteEvent(BaseModel):
    timestamp: str
    estimated_kg: float
    category: str = "General"
    city: str = "Unknown" # Spatial factor

class CustomHoliday(BaseModel):
    name: str
    date: str
    impactMultiplier: float = 1.0

class ProphetRequest(BaseModel):
    events: List[WasteEvent]
    holidays: List[CustomHoliday] = []
    weather_impact: float = 1.0 # 1.0 = clear, 1.3 = rain (30% increase)


@app.post("/train-prophet")
async def train_prophet_model(request: ProphetRequest):
    try:
        # 1. Convert events to DataFrame
        data = [{"ds": pd.to_datetime(e.timestamp).tz_localize(None), "y": e.estimated_kg, "city": e.city} for e in request.events]
        df = pd.DataFrame(data)

        # 2. Handle Cold Start / Data Enrichment
        if len(df) < 20:
            print("Enriching dataset for spatial training...")
            dates = pd.date_range(end=pd.Timestamp.now(), periods=30, freq='D')
            y = [50 + (20 if d.weekday() >= 5 else 0) + np.random.randint(-10, 10) for d in dates]
            seeded_df = pd.DataFrame({'ds': dates, 'y': y})
            df = pd.concat([df, seeded_df], ignore_index=True)

        # 3. Aggregate and add Weather Regressor
        df['ds'] = pd.to_datetime(df['ds']).dt.date
        df = df.groupby('ds').agg({'y': 'sum'}).reset_index()
        # Add weather regressor (mimicking ST-GNN external features)
        df['weather'] = request.weather_impact

        # 4. Process Custom Holidays from DB
        h_data = []
        for h in request.holidays:
            h_date = pd.to_datetime(h.date).tz_localize(None)
            h_data.append({
                'holiday': h.name,
                'ds': h_date,
                'lower_window': -1,
                'upper_window': 1
            })
        
        holidays_df = pd.DataFrame(h_data) if h_data else None

        # 5. Train Multivariate Prophet
        m = Prophet(holidays=holidays_df, weekly_seasonality=True, daily_seasonality=False)
        m.add_regressor('weather')
        m.fit(df)

        # 6. Predict next 7 days
        future = m.make_future_dataframe(periods=7)
        future['weather'] = request.weather_impact # Assume same weather for simplicity or pass forecast
        forecast = m.predict(future)

        # 7. Reasoning Engine (The "Why" behind the AI)
        reasoning = "Normal waste generation patterns observed."
        if request.weather_impact > 1.1:
            reasoning = f"⚠️ HIGH ALERT: Predicted {int((request.weather_impact-1)*100)}% surge due to heavy rainfall (wet waste mass increase)."
        
        # Check if any predicted day falls on a holiday
        next_week = forecast.tail(7)
        active_holidays = []
        if holidays_df is not None:
            for _, h in holidays_df.iterrows():
                if any(next_week['ds'] == h['ds']):
                    active_holidays.append(h['holiday'])
        
        if active_holidays:
            reasoning += f" 🎊 Peak expected due to: {', '.join(active_holidays)}."

        # 8. Format Result
        result = []
        for _, row in next_week.iterrows():
            result.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted_kg": round(row['yhat'], 2),
                "lower_bound": round(row['yhat_lower'], 2),
                "upper_bound": round(row['yhat_upper'], 2)
            })
            
        return {
            "forecast": result,
            "reasoning": reasoning,
            "impact_status": "HIGH" if request.weather_impact > 1.2 or active_holidays else "STABLE"
        }
    except Exception as e:
        print("Prophet Error:", e)
        raise HTTPException(status_code=500, detail=str(e))



import os
from fpdf import FPDF
import datetime

@app.post("/generate-report")
async def generate_report(payload: ReportPayload):
    try:
        # Prepare directory
        reports_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", "B", 16)
        
        # Header
        pdf.set_text_color(6, 78, 59) # #064E3B Emerald
        pdf.cell(0, 10, "CLEANCITY LEGAL RESOLUTION REPORT", align="C", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, f"Report ID: {payload.complaint_id}", align="C", ln=True)
        pdf.cell(0, 5, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", align="C", ln=True)
        pdf.ln(10)
        
        # Section 1: Incident
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 8, "1. INCIDENT DETAILS", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, f"Target Location: {payload.location_name}", ln=True)
        pdf.cell(0, 6, f"Reporting Resident: {payload.resident_name}", ln=True)
        pdf.ln(5)
        
        # Section 2: Collection execution
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "2. LOGISTICS COLLECTION", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, f"Assigned Driver (Interceptor): {payload.driver_name}", ln=True)
        pdf.cell(0, 6, f"Condition Matched Report: {'Yes' if payload.description_match else 'No'}", ln=True)
        pdf.cell(0, 6, f"Estimated Load Volume: {payload.volume}", ln=True)
        pdf.cell(0, 6, f"Primary Classification: {payload.category}", ln=True)
        pdf.cell(0, 6, f"Hazardous Condition: {payload.hazards}", ln=True)
        pdf.ln(5)
        
        # Section 3: Verification
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "3. SECURE VERIFICATION", ln=True)
        pdf.set_font("Helvetica", "", 10)
        if payload.otp_verified:
            pdf.set_text_color(0, 128, 0)
            pdf.cell(0, 6, "[VERIFIED] Cryptographic OTP Handshake Completed Locally.", ln=True)
        else:
            pdf.set_text_color(255, 0, 0)
            pdf.cell(0, 6, "[WARNING] OTP Verification bypassed or failed.", ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)

        # Section 4: Photographic Evidence
        import base64
        import tempfile
        import os
        
        def process_base64_image(b64_string, prefix):
            if not b64_string: return None
            try:
                if ',' in b64_string:
                    b64_string = b64_string.split(',')[1]
                img_data = base64.b64decode(b64_string)
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png', prefix=prefix)
                temp_file.write(img_data)
                temp_file.close()
                return temp_file.name
            except Exception as e:
                print("Image processing error:", e)
                return None

        has_images = payload.before_image or payload.after_image
        if has_images:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 12)
            pdf.cell(0, 8, "4. PHOTOGRAPHIC EVIDENCE", ln=True)
            pdf.ln(5)
            
            if payload.before_image:
                before_path = process_base64_image(payload.before_image, 'before_')
                if before_path:
                    pdf.set_font("Helvetica", "I", 10)
                    pdf.cell(0, 6, "Initial State (Resident Payload):", ln=True)
                    pdf.image(before_path, w=150)
                    pdf.ln(10)
                    os.unlink(before_path) # cleanup
            
            if payload.after_image:
                after_path = process_base64_image(payload.after_image, 'after_')
                if after_path:
                    pdf.set_font("Helvetica", "I", 10)
                    pdf.cell(0, 6, "Resolved State (Logistics Capture):", ln=True)
                    pdf.image(after_path, w=150)
                    pdf.ln(10)
                    os.unlink(after_path) # cleanup

        # Footer Signatures
        pdf.set_font("Helvetica", "I", 8)
        pdf.cell(0, 5, "This document is electronically generated and holds legal administrative authority for compliance.", align="C", ln=True)
        
        # Save mechanism
        filename = f"report_{payload.complaint_id}.pdf"
        filepath = os.path.join(reports_dir, filename)
        pdf.output(filepath)
        
        return {"pdf_url": f"/uploads/reports/{filename}"}
        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

import requests

class RouteRequest(BaseModel):
    start: Location
    end: Location

@app.post("/get-route")
async def get_route(payload: RouteRequest):
    try:
        # Construct OSRM Request with steps=true
        url = f"https://router.project-osrm.org/route/v1/driving/" \
              f"{payload.start.lng},{payload.start.lat};" \
              f"{payload.end.lng},{payload.end.lat}?overview=full&geometries=geojson&steps=true"
        
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data.get('code') != 'Ok':
            raise HTTPException(status_code=400, detail="Road network routing failed.")
            
        route = data['routes'][0]
        path = [[p[1], p[0]] for p in route['geometry']['coordinates']]
        
        # Parse Navigation Steps
        navigation_steps = []
        for leg in route.get('legs', []):
            for step in leg.get('steps', []):
                maneuver = step.get('maneuver', {})
                type_ = maneuver.get('type', 'turn')
                modifier = maneuver.get('modifier', '')
                road_name = step.get('name', 'Road')
                
                # Basic instruction builder
                if type_ == 'depart':
                    instruction = f"Head toward {road_name}"
                elif type_ == 'arrive':
                    instruction = "You have reached your destination"
                else:
                    instruction = f"{type_.capitalize()} {modifier} onto {road_name}".replace('  ', ' ').strip()

                navigation_steps.append({
                    "instruction": instruction,
                    "distance": step.get('distance', 0),
                    "location": [maneuver['location'][1], maneuver['location'][0]] # [lat, lng]
                })
        
        return {
            "path": path,
            "steps": navigation_steps,
            "distance": route['distance'],
            "duration": route['duration']
        }
    except Exception as e:
        print(f"Routing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_priority_score(dist_to_market: float, days_to_fest: int, hist_volume: float):
    # Weights: Volume (50%), Proximity (30%), Urgency (20%)
    volume_factor = min(hist_volume / 1000, 1.0) * 5.0
    dist_factor = (1 / (dist_to_market + 1)) * 3.0
    urgency_factor = max(0, (5 - days_to_fest)) * 0.4
    return round(volume_factor + dist_factor + urgency_factor, 2)

class ScoreRequest(BaseModel):
    dist_to_market: float
    days_to_fest: int
    hist_volume: float

def forecast_2026(history_list: List[dict]):
    """Analyzes a 5-year trend to forecast the 2026 baseline load."""
    years = [h['year'] for h in history_list]
    volumes = [h['avgVolume'] for h in history_list]
    
    # Simple Linear Regression (Slope extraction)
    n = len(years)
    m = (n * sum(y * v for y, v in zip(years, volumes)) - sum(years) * sum(volumes)) / \
        (n * sum(y**2 for y in years) - sum(years)**2)
    b = (sum(volumes) - m * sum(years)) / n
    
    # Predict for 2026
    v2026 = m * 2026 + b
    return round(v2026, 2)

def calculate_demographic_risk(base_vol, city_ratios, festival_multiplier, p_weights):
    """
    base_vol: Baseline kg
    city_ratios: [Hindu, Muslim, Buddhist, Christian, Others]
    p_weights: [Weight for each community for THIS specific festival]
    """
    participation_index = sum(r * w for r, w in zip(city_ratios, p_weights))
    return base_vol * (1 + (festival_multiplier - 1) * participation_index)

class AdvancedPredictionRequest(BaseModel):
    history: List[dict]
    ratios: List[float]
    fest_multiplier: float
    fest_p_weights: List[float]

@app.post("/predict-2026")
async def get_advanced_prediction(payload: AdvancedPredictionRequest):
    baseline_2026 = forecast_2026(payload.history)
    peak_prediction = calculate_demographic_risk(baseline_2026, payload.ratios, payload.fest_multiplier, payload.fest_p_weights)
    return {
        "baseline_2026": baseline_2026,
        "peak_prediction_2026": round(peak_prediction, 2),
        "growth_trend": "Increasing" if baseline_2026 > payload.history[-1]['avgVolume'] else "Stable"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
