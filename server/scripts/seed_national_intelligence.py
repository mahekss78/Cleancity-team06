import pymongo
import datetime
import os
import random
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cleancity")
client = pymongo.MongoClient(mongo_uri)
db = client.get_database()

# 1. National Knowledge Base: Major Cities, Neighborhoods, and Demographics
# Ratios: [Hindu, Muslim, Buddhist, Christian, Others]
INDIA_KNOWLEDGE = {
    "Maharashtra": {
        "Mumbai": {
            "demographics": [0.66, 0.20, 0.05, 0.03, 0.06],
            "neighborhoods": [
                {"name": "Dadar", "pincode": "400014", "coords": [72.8422, 19.0178]},
                {"name": "Bandra West", "pincode": "400050", "coords": [72.8258, 19.0596]},
                {"name": "Dharavi", "pincode": "400017", "coords": [72.8550, 19.0380]},
                {"name": "Juhu", "pincode": "400049", "coords": [72.8270, 19.1075]},
                {"name": "Colaba", "pincode": "400001", "coords": [72.8282, 18.9067]}
            ]
        },
        "Nagpur": {
            "demographics": [0.69, 0.11, 0.15, 0.01, 0.04],
            "neighborhoods": [
                {"name": "Sitabuldi", "pincode": "440012", "coords": [79.0822, 21.1458]},
                {"name": "Pratap Nagar", "pincode": "440022", "coords": [79.0622, 21.1158]},
                {"name": "Ramdaspeth", "pincode": "440010", "coords": [79.0760, 21.1370]},
                {"name": "Sakkardara", "pincode": "440009", "coords": [79.1150, 21.1180]}
            ]
        }
    },
    "Karnataka": {
        "Bengaluru": {
            "demographics": [0.78, 0.13, 0.01, 0.05, 0.03],
            "neighborhoods": [
                {"name": "Koramangala", "pincode": "560034", "coords": [77.6245, 12.9352]},
                {"name": "Indiranagar", "pincode": "560038", "coords": [77.6412, 12.9784]},
                {"name": "Whitefield", "pincode": "560066", "coords": [77.7499, 12.9698]},
                {"name": "HSR Layout", "pincode": "560102", "coords": [77.6411, 12.9102]}
            ]
        }
    },
    "West Bengal": {
        "Kolkata": {
            "demographics": [0.76, 0.20, 0.00, 0.01, 0.03],
            "neighborhoods": [
                {"name": "Park Street", "pincode": "700016", "coords": [88.3520, 22.5480]},
                {"name": "Gariahat", "pincode": "700019", "coords": [88.3650, 22.5200]},
                {"name": "Salt Lake", "pincode": "700091", "coords": [88.4200, 22.5800]}
            ]
        }
    },
    "Delhi": {
        "New Delhi": {
            "demographics": [0.81, 0.12, 0.01, 0.01, 0.05],
            "neighborhoods": [
                {"name": "Connaught Place", "pincode": "110001", "coords": [77.2167, 28.6315]},
                {"name": "Chandni Chowk", "pincode": "110006", "coords": [77.2315, 28.6600]},
                {"name": "Saket", "pincode": "110017", "coords": [77.2089, 28.5244]}
            ]
        }
    }
}

# 2. National Festivals & Participation Logic
# Impact Multiplier & Community Participation Weights
FESTIVALS = [
    {"name": "Diwali", "scope": "National", "multiplier": 3.0, "p_weights": [1.0, 0.8, 0.9, 0.8, 1.0], "description": "Lamps, Crackers, Sweets (Pan-India)"},
    {"name": "Eid-ul-Fitr", "scope": "National", "multiplier": 2.5, "p_weights": [0.1, 1.0, 0.2, 0.3, 0.1], "description": "Feasts and gatherings"},
    {"name": "Ambedkar Jayanti", "scope": "National", "multiplier": 2.0, "p_weights": [0.3, 0.1, 1.0, 0.1, 0.5], "description": "14th April - Processions and community meals"},
    {"name": "Ganesh Chaturthi", "scope": "State", "state": "Maharashtra", "multiplier": 4.0, "p_weights": [1.0, 0.3, 0.5, 0.2, 0.4], "description": "Idol immersion and street pandals"},
    {"name": "Durga Puja", "scope": "State", "state": "West Bengal", "multiplier": 4.5, "p_weights": [1.0, 0.4, 0.3, 0.2, 0.3], "description": "The largest waste event in the East"},
    {"name": "Onam", "scope": "State", "state": "Kerala", "multiplier": 2.2, "p_weights": [1.0, 0.6, 0.6, 0.8, 0.9], "description": "Floral rangolis and traditional feasts"}
]

def calculate_historical_volume(base_vol, city_ratios, festival_multiplier, p_weights):
    # Participation = Sum(Community_Ratio * Community_Participation_Weight)
    participation_index = sum(r * w for r, w in zip(city_ratios, p_weights))
    return base_vol * (1 + (festival_multiplier - 1) * participation_index)

def seed():
    try:
        db.hotspots.delete_many({})
        db.events.delete_many({})
        
        hotspot_docs = []
        for state, cities in INDIA_KNOWLEDGE.items():
            for city, data in cities.items():
                ratios = data["demographics"]
                for nh in data["neighborhoods"]:
                    # Generate 5 years of history (2021-2025)
                    history = []
                    base_volume = random.randint(500, 1500)
                    for year in range(2021, 2026):
                        # Apply 5% YoY urban growth
                        yearly_base = base_volume * (1.05 ** (year - 2021))
                        history.append({
                            "year": year,
                            "avgVolume": round(yearly_base, 2),
                            "peakIntensity": round(random.uniform(1.0, 1.4), 2)
                        })
                    
                    # 2026 Prediction logic (Proactive Score)
                    growth_avg = 1.05
                    score_2026 = history[-1]["avgVolume"] * growth_avg
                    
                    hotspot_docs.append({
                        "location": {"type": "Point", "coordinates": nh["coords"]},
                        "hierarchy": {
                            "state": state,
                            "city": city,
                            "neighborhood": nh["name"],
                            "pincode": nh["pincode"]
                        },
                        "demographics": {
                            "hindu": ratios[0],
                            "muslim": ratios[1],
                            "buddhist": ratios[2],
                            "christian": ratios[3],
                            "others": ratios[4]
                        },
                        "history": history,
                        "prediction2026": {
                            "score": round(score_2026, 2),
                            "reason": f"Projected {int((growth_avg-1)*100)}% growth based on 5-year trend."
                        },
                        "metadata": {
                            "type": random.choice(["Market", "Residential", "Transit"]),
                            "baseWeight": round(random.uniform(1.0, 2.5), 2),
                            "radius": random.choice([500, 800, 1000])
                        }
                    })
        
        if hotspot_docs:
            db.hotspots.insert_many(hotspot_docs)
            print(f"Seeded {len(hotspot_docs)} Demographic-Weighted Hotspots across India.")

        # Seed Events for the next 30 days for testing
        event_docs = []
        today = datetime.datetime.now()
        for i, fest in enumerate(FESTIVALS):
            # Stagger them for better UI visualization
            event_docs.append({
                "name": fest["name"],
                "date": today + datetime.timedelta(days=(i * 5) + 1),
                "scope": fest["scope"],
                "state": fest.get("state"),
                "city": fest.get("city"),
                "impactMultiplier": fest["multiplier"],
                "participationWeight": sum(r*w for r,w in zip([0.8, 0.14, 0.01, 0.02, 0.03], fest["p_weights"])), # Default avg weights
                "description": fest["description"]
            })
        
        if event_docs:
            db.events.insert_many(event_docs)
            print(f"Seeded {len(event_docs)} National & Regional Events.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed()
