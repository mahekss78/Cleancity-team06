import pymongo
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/cleancity")
client = pymongo.MongoClient(mongo_uri)
db = client.get_database()

# 1. Seed Hotspots (State > City > Neighborhood)
hotspots = [
    {
        "location": {"type": "Point", "coordinates": [79.0882, 21.1458]}, # Nagpur IT Park
        "area": {"state": "Maharashtra", "city": "Nagpur", "neighborhood": "Gayatri Nagar"},
        "metadata": {"type": "Market", "baseWeight": 1.8, "radius": 600}
    },
    {
        "location": {"type": "Point", "coordinates": [79.0822, 21.1258]}, # Nagpur Market
        "area": {"state": "Maharashtra", "city": "Nagpur", "neighborhood": "Sitabuldi"},
        "metadata": {"type": "Market", "baseWeight": 2.5, "radius": 1000}
    },
    {
        "location": {"type": "Point", "coordinates": [73.0297, 19.2183]}, # Thane Station Area
        "area": {"state": "Maharashtra", "city": "Thane", "neighborhood": "Station Road"},
        "metadata": {"type": "Transit", "baseWeight": 2.1, "radius": 800}
    }
]

# 2. Seed Festivals (Event Trigger)
upcoming_festivals = [
    {
        "name": "Local Cleanliness Drive",
        "date": datetime.datetime.now() + datetime.timedelta(days=1), # Tomorrow
        "city": "Nagpur",
        "impactMultiplier": 2.5,
        "description": "Simulation for predictive heatmap trigger"
    },
    {
        "name": "Diwali Preview",
        "date": datetime.datetime.now() + datetime.timedelta(days=2),
        "city": "Thane",
        "impactMultiplier": 3.0,
        "description": "High waste generation expected"
    }
]

def seed_data():
    try:
        # Clear existing
        db.hotspots.delete_many({})
        db.events.delete_many({})
        
        # Insert Hotspots
        if hotspots:
            db.hotspots.insert_many(hotspots)
            print(f"Successfully seeded {len(hotspots)} hotspots.")
            
        # Insert Events
        if upcoming_festivals:
            db.events.insert_many(upcoming_festivals)
            print(f"Successfully seeded {len(upcoming_festivals)} festivals.")
            
    except Exception as e:
        print(f"Error seeding data: {e}")

if __name__ == "__main__":
    seed_data()
