"""
National Festival Waste Data Ingestion Script
==============================================
Reads the 3 generated JSON files and ingests them into MongoDB
as 'hotspots' and 'events' collections for the Neural Radar system.

Improvements over previous version:
  - Proper per-state demographic ratios
  - Realistic 5-year growth trends with per-city variance
  - Participation-weighted impact scores for events
  - State-scoped event filtering
"""

import json
import pymongo
import os
import datetime
import random
from dotenv import load_dotenv

load_dotenv()

random.seed(42)

# MongoDB Connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cleancity")
client = pymongo.MongoClient(mongo_uri)
db = client.get_database()

# Resolve data path relative to script location
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "..", "data")

def load_json(filename):
    filepath = os.path.join(data_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

# State-level demographic distributions [Hindu, Muslim, Buddhist, Christian, Others]
# Based on Census 2011 proportions (approximate)
STATE_DEMOGRAPHICS = {
    "Andhra Pradesh":     [0.83, 0.10, 0.00, 0.01, 0.06],
    "Arunachal Pradesh":  [0.29, 0.02, 0.12, 0.30, 0.27],
    "Assam":              [0.61, 0.34, 0.00, 0.04, 0.01],
    "Bihar":              [0.83, 0.17, 0.00, 0.00, 0.00],
    "Chhattisgarh":       [0.94, 0.02, 0.00, 0.02, 0.02],
    "Delhi":              [0.81, 0.12, 0.01, 0.01, 0.05],
    "Goa":                [0.66, 0.08, 0.00, 0.25, 0.01],
    "Gujarat":            [0.89, 0.10, 0.00, 0.00, 0.01],
    "Haryana":            [0.87, 0.07, 0.00, 0.00, 0.06],
    "Himachal Pradesh":   [0.95, 0.02, 0.01, 0.00, 0.02],
    "Jharkhand":          [0.67, 0.15, 0.00, 0.04, 0.14],
    "Karnataka":          [0.84, 0.13, 0.01, 0.02, 0.00],
    "Kerala":             [0.55, 0.27, 0.00, 0.18, 0.00],
    "Madhya Pradesh":     [0.90, 0.07, 0.00, 0.00, 0.03],
    "Maharashtra":        [0.80, 0.11, 0.06, 0.01, 0.02],
    "Manipur":            [0.41, 0.08, 0.00, 0.41, 0.10],
    "Meghalaya":          [0.11, 0.04, 0.00, 0.75, 0.10],
    "Mizoram":            [0.03, 0.02, 0.08, 0.87, 0.00],
    "Nagaland":           [0.08, 0.02, 0.00, 0.88, 0.02],
    "Odisha":             [0.94, 0.02, 0.00, 0.03, 0.01],
    "Punjab":             [0.38, 0.02, 0.00, 0.01, 0.59],  # 59% Sikh
    "Rajasthan":          [0.89, 0.09, 0.00, 0.00, 0.02],
    "Sikkim":             [0.58, 0.01, 0.28, 0.10, 0.03],
    "Tamil Nadu":         [0.87, 0.06, 0.00, 0.06, 0.01],
    "Telangana":          [0.85, 0.13, 0.00, 0.01, 0.01],
    "Tripura":            [0.83, 0.09, 0.04, 0.04, 0.00],
    "Uttar Pradesh":      [0.80, 0.19, 0.00, 0.00, 0.01],
    "Uttarakhand":        [0.83, 0.14, 0.00, 0.00, 0.03],
    "West Bengal":        [0.71, 0.27, 0.00, 0.01, 0.01],
}

# Festival participation weights by community type [Hindu, Muslim, Buddhist, Christian, Others]
FESTIVAL_PARTICIPATION = {
    "Ganesh Chaturthi":  [1.0, 0.2, 0.3, 0.1, 0.3],
    "Diwali":           [1.0, 0.7, 0.8, 0.7, 0.9],
    "Holi":             [1.0, 0.5, 0.3, 0.3, 0.6],
    "Durga Puja":       [1.0, 0.5, 0.3, 0.2, 0.4],
    "Navratri":         [1.0, 0.3, 0.2, 0.2, 0.5],
    "Chhath Puja":      [1.0, 0.2, 0.1, 0.1, 0.2],
    "Makar Sankranti":  [0.9, 0.3, 0.2, 0.3, 0.5],
    "Raksha Bandhan":   [1.0, 0.4, 0.3, 0.2, 0.5],
    "Janmashtami":      [1.0, 0.3, 0.2, 0.1, 0.3],
    "Pongal":           [1.0, 0.4, 0.3, 0.5, 0.6],
    "Onam":             [1.0, 0.7, 0.5, 0.8, 0.9],
    "Bihu":             [0.9, 0.6, 0.3, 0.4, 0.5],
    "Ugadi":            [1.0, 0.3, 0.2, 0.2, 0.4],
    "Eid al-Fitr":      [0.3, 1.0, 0.2, 0.3, 0.2],
    "Eid al-Adha":      [0.2, 1.0, 0.1, 0.2, 0.1],
    "Muharram":         [0.3, 1.0, 0.1, 0.2, 0.2],
    "Guru Nanak Jayanti": [0.5, 0.2, 0.2, 0.2, 1.0],
    "Christmas":        [0.5, 0.3, 0.3, 1.0, 0.5],
    "Buddha Purnima":   [0.5, 0.2, 1.0, 0.2, 0.3],
    "Republic Day":     [0.8, 0.8, 0.8, 0.8, 0.8],
    "Independence Day": [0.9, 0.9, 0.9, 0.9, 0.9],
    "Gandhi Jayanti":   [0.7, 0.7, 0.7, 0.7, 0.7],
}

# Impact multipliers per festival
IMPACT_MULTIPLIERS = {
    "Ganesh Chaturthi": 4.0, "Diwali": 3.5, "Durga Puja": 4.5,
    "Holi": 3.0, "Navratri": 3.2, "Chhath Puja": 2.5,
    "Eid al-Fitr": 2.5, "Eid al-Adha": 2.3, "Muharram": 1.8,
    "Onam": 2.5, "Pongal": 2.2, "Bihu": 2.0,
    "Christmas": 2.0, "Guru Nanak Jayanti": 2.2,
    "Makar Sankranti": 2.0, "Raksha Bandhan": 1.5, "Janmashtami": 2.3,
    "Ugadi": 1.8, "Buddha Purnima": 1.5,
    "Republic Day": 1.8, "Independence Day": 2.0, "Gandhi Jayanti": 1.3,
}

DESCRIPTIONS = {
    "Ganesh Chaturthi": "Massive pandals, idol processions, and immersion generate organic + idol waste across Maharashtra & South India.",
    "Diwali": "Pan-India festival of lights — crackers, packaging, sweets, and decorations create high plastic + mixed waste.",
    "Holi": "Colors, water, food stalls — generates chemical dye runoff, plastic waste, and organic food waste.",
    "Durga Puja": "10-day pandal culture in East India — idol immersion, floral offerings, and food waste at massive scale.",
    "Navratri": "9 nights of Garba in Gujarat; pandals and markets surge waste output across North & West India.",
    "Chhath Puja": "River/lake-based rituals in Bihar/UP — organic offerings, packaging waste at ghats.",
    "Makar Sankranti": "Kite festivals, bonfires, and street food generate mixed waste including string and paper.",
    "Raksha Bandhan": "Markets see surge in gift packaging, plastic wrappers, and food waste.",
    "Janmashtami": "Temple crowds, Dahi Handi events — organic + food waste concentrated near mandirs.",
    "Pongal": "Harvest festival in Tamil Nadu — biomass, food waste, and market activity.",
    "Onam": "Floral rangolis, feasts — organic waste spikes in Kerala neighborhoods.",
    "Bihu": "Community feasts in Assam — food and organic waste in open grounds.",
    "Ugadi": "New Year celebrations in Deccan — market activity spikes, food + packaging waste.",
    "Eid al-Fitr": "Post-Ramadan feasts — food waste, packaging, and market activity surge.",
    "Eid al-Adha": "Sacrifice and feasts — animal waste, food waste, market packaging.",
    "Muharram": "Processions and community gatherings — mixed waste in public areas.",
    "Guru Nanak Jayanti": "Langar distribution and processions — food and organic waste at gurdwaras.",
    "Christmas": "Commercial activity, parties — packaging, decor waste, and food waste.",
    "Buddha Purnima": "Temple visits and offerings — organic waste near stupas and monasteries.",
    "Republic Day": "Parades, public gatherings, food stalls — plastic + mixed waste at grounds.",
    "Independence Day": "Flag distribution, public events — plastic and paper waste nationwide.",
    "Gandhi Jayanti": "Cleanliness drives paradoxically generate collected waste at central locations.",
}


def ingest():
    try:
        # Load JSON datasets
        calendar = load_json("festival_calendar.json")
        locations_data = load_json("locations.json")
        patterns = load_json("waste_patterns.json")

        print(f"Loaded: {len(calendar)} festivals, {len(locations_data)} locations, {len(patterns)} patterns")

        # 1. Clear existing collections
        db.hotspots.delete_many({})
        db.events.delete_many({})
        print("✅ Cleared existing predictive data.")

        # 2. Ingest Festival Events (unroll years into 'events' collection)
        event_docs = []
        for fest in calendar:
            fest_name = fest["festival_name"]
            p_weights = FESTIVAL_PARTICIPATION.get(fest_name, [0.5, 0.5, 0.5, 0.5, 0.5])
            multiplier = IMPACT_MULTIPLIERS.get(fest_name, 2.0)
            description = DESCRIPTIONS.get(fest_name, f"Festival waste event for {fest_name}")

            # Determine scope
            is_national = "All India" in fest["states_applicable"]
            scope = "National" if is_national else "State"

            # For state-scoped festivals, create one event per applicable state
            for d in fest["dates"]:
                if is_national:
                    # Use average demographics for participation weight
                    avg_ratios = [0.80, 0.14, 0.01, 0.02, 0.03]
                    pw = sum(r * w for r, w in zip(avg_ratios, p_weights))

                    event_docs.append({
                        "name": fest_name,
                        "date": datetime.datetime.fromisoformat(d["date"]),
                        "scope": "National",
                        "state": None,
                        "city": None,
                        "impactMultiplier": multiplier,
                        "participationWeight": round(pw, 3),
                        "description": description
                    })
                else:
                    for state_name in fest["states_applicable"]:
                        demos = STATE_DEMOGRAPHICS.get(state_name, [0.80, 0.14, 0.01, 0.02, 0.03])
                        pw = sum(r * w for r, w in zip(demos, p_weights))

                        event_docs.append({
                            "name": fest_name,
                            "date": datetime.datetime.fromisoformat(d["date"]),
                            "scope": "State",
                            "state": state_name,
                            "city": None,
                            "impactMultiplier": multiplier,
                            "participationWeight": round(pw, 3),
                            "description": description
                        })

        if event_docs:
            db.events.insert_many(event_docs)
            print(f"✅ Ingested {len(event_docs)} festival events (2024–2030).")

        # 3. Ingest Hotspots (locations + waste patterns → MongoDB hotspots)
        hotspot_docs = []
        for loc in locations_data:
            state = loc["state"]
            demos = STATE_DEMOGRAPHICS.get(state, [0.80, 0.14, 0.01, 0.02, 0.03])

            # Add slight per-neighborhood variation to demographics
            varied_demos = [max(0, min(1, d + random.uniform(-0.03, 0.03))) for d in demos]
            total = sum(varied_demos)
            varied_demos = [round(d / total, 3) for d in varied_demos]

            # Generate 5 years of history (2021–2025) with realistic growth
            base_volume = random.randint(400, 2000)
            yoy_growth = random.uniform(1.02, 1.08)  # 2-8% YoY urban waste growth

            history = []
            for year in range(2021, 2026):
                yearly_vol = base_volume * (yoy_growth ** (year - 2021))
                history.append({
                    "year": year,
                    "avgVolume": round(yearly_vol, 1),
                    "peakIntensity": round(random.uniform(1.0, 1.5), 2)
                })

            # 2026 Prediction: use pattern data if available
            primary_fest_id = loc["common_festivals"][0] if loc["common_festivals"] else None
            pattern = next(
                (p for p in patterns if p["festival_id"] == primary_fest_id and p["area_type"] == loc["area_type"]),
                None
            )

            if pattern:
                score_2026 = pattern["estimated_waste_kg_per_day"] * pattern["seasonal_factor"] * yoy_growth
            else:
                score_2026 = history[-1]["avgVolume"] * yoy_growth

            # Build reason string
            area_label = loc["area_type"].replace("_", " ").title()
            if pattern:
                reason = f"Historical {area_label} hotspot during {primary_fest_id} celebrations. Intensity score: {pattern['base_waste_intensity_score']}/10, crowd: {pattern['crowd_level']}."
            else:
                reason = f"Projected {int((yoy_growth - 1) * 100)}% growth based on 5-year trend for {area_label} zone."

            # Map area_type to Mongoose enum value
            type_mapping = {
                "temple": "Temple",
                "market": "Market",
                "public_ground": "Public_ground",
                "beach": "Beach",
                "residential": "Residential"
            }

            hotspot_docs.append({
                "location": {
                    "type": "Point",
                    "coordinates": [loc["lng"], loc["lat"]]
                },
                "hierarchy": {
                    "state": loc["state"],
                    "city": loc["city"],
                    "neighborhood": loc["area_name"],
                    "pincode": str(random.randint(100000, 900000))
                },
                "demographics": {
                    "hindu": varied_demos[0],
                    "muslim": varied_demos[1],
                    "buddhist": varied_demos[2],
                    "christian": varied_demos[3],
                    "others": varied_demos[4]
                },
                "history": history,
                "prediction2026": {
                    "score": round(score_2026, 1),
                    "reason": reason
                },
                "metadata": {
                    "type": type_mapping.get(loc["area_type"], "Market"),
                    "baseWeight": pattern["base_waste_intensity_score"] if pattern else round(random.uniform(1.0, 3.0), 1),
                    "radius": random.choice([500, 750, 1000, 1200, 1500])
                }
            })

        if hotspot_docs:
            db.hotspots.insert_many(hotspot_docs)
            print(f"✅ Ingested {len(hotspot_docs)} real-world hotspots across {len(STATE_DEMOGRAPHICS)} states.")

        # Summary
        total = len(event_docs) + len(hotspot_docs)
        print(f"\n{'=' * 50}")
        print(f"  Total MongoDB Documents: {total}")
        print(f"  Events: {len(event_docs)} | Hotspots: {len(hotspot_docs)}")
        print(f"{'=' * 50}")

    except Exception as e:
        import traceback
        print(f"❌ Ingestion Error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    ingest()
