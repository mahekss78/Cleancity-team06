"""
Festival-Based Waste Prediction Dataset Generator
===================================================
Generates 3 interconnected JSON files:
  1. festival_calendar.json  — 20+ festivals, 2024-2030 with accurate dates
  2. locations.json          — 500+ hotspot locations across 28 Indian states
  3. waste_patterns.json     — 100+ waste behavior patterns (festival × area_type)

All dates are realistic (lunar festivals use actual Hindu/Islamic calendar projections).
"""

import json
import random
import os
from datetime import datetime

random.seed(42)  # Reproducible output

print("-" * 60)
print("  CleanCity - National Festival Waste Dataset Generator")
print("-" * 60)

# ============================================================================
# 1. FESTIVAL CALENDAR (20 Major Indian Festivals, 2024–2030)
# ============================================================================
# Dates verified against Hindu Panchang, Islamic Hijri, and fixed calendars.

FESTIVALS = [
    # --- HINDU MAJOR ---
    {
        "festival_id": "fest_001",
        "festival_name": "Ganesh Chaturthi",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["Maharashtra", "Karnataka", "Telangana", "Andhra Pradesh", "Goa", "Gujarat", "Madhya Pradesh", "Chhattisgarh", "Tamil Nadu"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "09-07", 2025: "08-27", 2026: "09-15", 2027: "09-04", 2028: "08-23", 2029: "09-12", 2030: "09-01"}
    },
    {
        "festival_id": "fest_002",
        "festival_name": "Diwali",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "11-01", 2025: "10-20", 2026: "11-08", 2027: "10-29", 2028: "10-17", 2029: "11-05", 2030: "10-26"}
    },
    {
        "festival_id": "fest_003",
        "festival_name": "Holi",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "03-25", 2025: "03-14", 2026: "03-04", 2027: "03-22", 2028: "03-11", 2029: "03-01", 2030: "03-20"}
    },
    {
        "festival_id": "fest_004",
        "festival_name": "Durga Puja",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["West Bengal", "Odisha", "Assam", "Bihar", "Tripura", "Jharkhand", "Meghalaya"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "10-09", 2025: "09-28", 2026: "10-17", 2027: "10-07", 2028: "09-25", 2029: "10-14", 2030: "10-04"}
    },
    {
        "festival_id": "fest_005",
        "festival_name": "Navratri",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["Gujarat", "Maharashtra", "Rajasthan", "Delhi", "Uttar Pradesh", "Madhya Pradesh", "Karnataka", "Himachal Pradesh", "Uttarakhand", "Haryana", "Punjab"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "10-03", 2025: "09-22", 2026: "10-11", 2027: "09-30", 2028: "09-19", 2029: "10-08", 2030: "09-28"}
    },
    {
        "festival_id": "fest_006",
        "festival_name": "Chhath Puja",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["Bihar", "Jharkhand", "Uttar Pradesh", "Delhi", "West Bengal"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "11-07", 2025: "10-26", 2026: "11-14", 2027: "11-04", 2028: "10-23", 2029: "11-11", 2030: "11-01"}
    },
    {
        "festival_id": "fest_007",
        "festival_name": "Makar Sankranti",
        "religion": "Hindu",
        "festival_type": "cultural",
        "states_applicable": ["All India"],
        "calendar_type": "solar",
        "dates_raw": {2024: "01-15", 2025: "01-14", 2026: "01-14", 2027: "01-14", 2028: "01-15", 2029: "01-14", 2030: "01-14"}
    },
    {
        "festival_id": "fest_008",
        "festival_name": "Raksha Bandhan",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "08-19", 2025: "08-09", 2026: "08-28", 2027: "08-17", 2028: "08-06", 2029: "08-25", 2030: "08-14"}
    },
    {
        "festival_id": "fest_009",
        "festival_name": "Janmashtami",
        "religion": "Hindu",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "08-26", 2025: "08-16", 2026: "09-04", 2027: "08-25", 2028: "08-13", 2029: "09-01", 2030: "08-21"}
    },

    # --- REGIONAL HINDU ---
    {
        "festival_id": "fest_010",
        "festival_name": "Pongal",
        "religion": "Hindu",
        "festival_type": "cultural",
        "states_applicable": ["Tamil Nadu", "Puducherry", "Andhra Pradesh"],
        "calendar_type": "solar",
        "dates_raw": {2024: "01-15", 2025: "01-14", 2026: "01-14", 2027: "01-15", 2028: "01-15", 2029: "01-14", 2030: "01-14"}
    },
    {
        "festival_id": "fest_011",
        "festival_name": "Onam",
        "religion": "Hindu",
        "festival_type": "cultural",
        "states_applicable": ["Kerala"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "09-15", 2025: "09-05", 2026: "08-26", 2027: "09-14", 2028: "09-02", 2029: "08-22", 2030: "09-11"}
    },
    {
        "festival_id": "fest_012",
        "festival_name": "Bihu",
        "religion": "Hindu",
        "festival_type": "cultural",
        "states_applicable": ["Assam"],
        "calendar_type": "solar",
        "dates_raw": {2024: "04-14", 2025: "04-14", 2026: "04-14", 2027: "04-14", 2028: "04-14", 2029: "04-14", 2030: "04-14"}
    },
    {
        "festival_id": "fest_013",
        "festival_name": "Ugadi",
        "religion": "Hindu",
        "festival_type": "cultural",
        "states_applicable": ["Karnataka", "Andhra Pradesh", "Telangana"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "04-09", 2025: "03-30", 2026: "03-19", 2027: "04-07", 2028: "03-27", 2029: "03-16", 2030: "04-05"}
    },

    # --- MUSLIM ---
    {
        "festival_id": "fest_014",
        "festival_name": "Eid al-Fitr",
        "religion": "Muslim",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "04-11", 2025: "03-31", 2026: "03-20", 2027: "03-10", 2028: "02-27", 2029: "02-15", 2030: "02-05"}
    },
    {
        "festival_id": "fest_015",
        "festival_name": "Eid al-Adha",
        "religion": "Muslim",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "06-17", 2025: "06-07", 2026: "05-27", 2027: "05-17", 2028: "05-05", 2029: "04-24", 2030: "04-14"}
    },
    {
        "festival_id": "fest_016",
        "festival_name": "Muharram",
        "religion": "Muslim",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "07-17", 2025: "07-06", 2026: "06-26", 2027: "06-15", 2028: "06-04", 2029: "05-24", 2030: "05-14"}
    },

    # --- SIKH ---
    {
        "festival_id": "fest_017",
        "festival_name": "Guru Nanak Jayanti",
        "religion": "Sikh",
        "festival_type": "religious",
        "states_applicable": ["Punjab", "Haryana", "Delhi", "Rajasthan", "Uttar Pradesh", "All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "11-15", 2025: "11-05", 2026: "11-24", 2027: "11-14", 2028: "11-02", 2029: "11-21", 2030: "11-11"}
    },

    # --- CHRISTIAN ---
    {
        "festival_id": "fest_018",
        "festival_name": "Christmas",
        "religion": "Christian",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "fixed",
        "dates_raw": {y: "12-25" for y in range(2024, 2031)}
    },

    # --- BUDDHIST ---
    {
        "festival_id": "fest_019",
        "festival_name": "Buddha Purnima",
        "religion": "Buddhist",
        "festival_type": "religious",
        "states_applicable": ["All India"],
        "calendar_type": "lunar",
        "dates_raw": {2024: "05-23", 2025: "05-12", 2026: "05-01", 2027: "05-20", 2028: "05-09", 2029: "05-28", 2030: "05-17"}
    },

    # --- NATIONAL ---
    {
        "festival_id": "fest_020",
        "festival_name": "Republic Day",
        "religion": "Secular",
        "festival_type": "national",
        "states_applicable": ["All India"],
        "calendar_type": "fixed",
        "dates_raw": {y: "01-26" for y in range(2024, 2031)}
    },
    {
        "festival_id": "fest_021",
        "festival_name": "Independence Day",
        "religion": "Secular",
        "festival_type": "national",
        "states_applicable": ["All India"],
        "calendar_type": "fixed",
        "dates_raw": {y: "08-15" for y in range(2024, 2031)}
    },
    {
        "festival_id": "fest_022",
        "festival_name": "Gandhi Jayanti",
        "religion": "Secular",
        "festival_type": "national",
        "states_applicable": ["All India"],
        "calendar_type": "fixed",
        "dates_raw": {y: "10-02" for y in range(2024, 2031)}
    },
]


# --- Build festival_calendar.json ---
festival_calendar = []
for f in FESTIVALS:
    dates_arr = []
    for y, md in f["dates_raw"].items():
        dt_str = f"{y}-{md}"
        dt_obj = datetime.strptime(dt_str, "%Y-%m-%d")
        dates_arr.append({
            "year": y,
            "date": dt_str,
            "day_of_week": dt_obj.strftime("%A")
        })
    entry = {k: v for k, v in f.items() if k != "dates_raw"}
    entry["dates"] = dates_arr
    festival_calendar.append(entry)

print(f"\n[OK] Festivals: {len(festival_calendar)} festivals x 7 years = {len(festival_calendar) * 7} date entries")


# ============================================================================
# 2. LOCATIONS (Ingesting Real Indian Cities Data from CSV)
# ============================================================================

import csv

STATES_CITIES = {}
# Try to load real data from Kaggle CSV
csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "indian_cities.csv")

if os.path.exists(csv_path):
    print(f"[DATA] Loading real city data from: {csv_path}")
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            state = row['State'].strip()
            city = row['City'].strip()
            try:
                lat = float(row['Lat'])
                lng = float(row['Long'])
                if state not in STATES_CITIES:
                    STATES_CITIES[state] = []
                STATES_CITIES[state].append((city, lat, lng))
            except (ValueError, TypeError):
                continue
    print(f"[OK] Loaded {sum(len(c) for c in STATES_CITIES.values())} real cities across {len(STATES_CITIES)} states/UTs")
else:
    print("[WARN] Kaggle CSV not found. Falling back to synthetic Metropolitan base.")
    STATES_CITIES = {
        "Maharashtra": [("Mumbai", 18.987, 72.836), ("Pune", 18.513, 73.849), ("Nagpur", 21.145, 79.088)],
        "Delhi": [("New Delhi", 28.600, 77.200)],
        "Karnataka": [("Bengaluru", 12.977, 77.587)],
        "West Bengal": [("Kolkata", 22.562, 88.363)],
        "Gujarat": [("Ahmedabad", 23.025, 72.587), ("Surat", 21.195, 72.830)],
        "Tamil Nadu": [("Chennai", 13.084, 80.248)],
        "Telangana": [("Hyderabad", 17.384, 78.456)],
    }

# Coastal states get beach-type areas
COASTAL_STATES = {
    "Maharashtra", "Goa", "Karnataka", "Kerala", "Tamil Nadu",
    "Andhra Pradesh", "Odisha", "West Bengal", "Gujarat"
}

# Area type definitions with realistic naming
AREA_TEMPLATES = {
    "temple": {
        "density_options": ["medium", "high"],
        "name_templates": [
            "{deity} Temple Complex", "{city} Mandir Area", "Sri {deity} Devasthanam",
            "{prefix} Temple Zone", "{city} Dham Area"
        ],
        "deities": ["Ganesh", "Shiva", "Vishnu", "Lakshmi", "Durga", "Hanuman", "Ram", "Krishna", "Balaji", "Jagannath"]
    },
    "public_ground": {
        "density_options": ["high", "very_high"],
        "name_templates": [
            "{city} Maidan", "{prefix} Grounds", "{city} Chowk", "{prefix} Park",
            "Jubilee Ground", "{prefix} Public Plaza", "{city} Central Grounds"
        ]
    },
    "market": {
        "density_options": ["high", "very_high"],
        "name_templates": [
            "{prefix} Bazaar", "{city} Central Market", "{prefix} Commercial Street",
            "{prefix} Haat", "{city} Market Complex", "{prefix} Mandi"
        ]
    },
    "beach": {
        "density_options": ["medium", "high"],
        "name_templates": [
            "{city} Beach Road", "{prefix} Shore", "{city} Marina",
            "{prefix} Waterfront", "{city} Seaside Promenade"
        ]
    },
    "residential": {
        "density_options": ["low", "medium", "high"],
        "name_templates": [
            "{prefix} Colony", "{prefix} Nagar", "{prefix} Enclave",
            "{city} Residency", "{prefix} Apartments Sector", "{prefix} Township"
        ]
    }
}

PREFIXES = [
    "Central", "North", "South", "East", "West", "Old", "New",
    "Sadar", "Gandhi", "Nehru", "Rajendra", "Subash", "Guru", "Maha",
    "Shanti", "Patel", "Ambedkar", "Tagore", "Lal", "Rani"
]

# Build regional festival mapping for each state
def get_applicable_festival_ids(state):
    """Returns festival IDs applicable to a given state."""
    applicable = []
    for fest in festival_calendar:
        if "All India" in fest["states_applicable"] or state in fest["states_applicable"]:
            applicable.append(fest["festival_id"])
    return applicable


# Generate location records
locations = []
loc_id_counter = 1
used_area_names = set()  # Prevent duplicate names

for state, cities in STATES_CITIES.items():
    state_festivals = get_applicable_festival_ids(state)
    is_coastal = state in COASTAL_STATES

    for city_name, base_lat, base_lng in cities:
        # Larger cities → more hotspots
        is_metro = city_name in [
            "Mumbai", "New Delhi", "Old Delhi", "South Delhi", "Bengaluru", "Kolkata",
            "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
            "Patna", "Kochi", "Varanasi", "Surat"
        ]
        num_areas = random.randint(7, 9) if is_metro else random.randint(5, 7)

        # Determine area type distribution
        area_types_for_city = []
        # Every city gets at least: 1 temple, 1 market, 1 public_ground, 1 residential
        mandatory = ["temple", "market", "public_ground", "residential"]
        if is_coastal:
            mandatory.append("beach")

        area_types_for_city.extend(mandatory)

        # Fill remaining with weighted random
        remaining = num_areas - len(area_types_for_city)
        weight_pool = ["temple", "market", "public_ground", "residential", "market", "residential"]
        if is_coastal:
            weight_pool.append("beach")
        for _ in range(remaining):
            area_types_for_city.append(random.choice(weight_pool))

        random.shuffle(area_types_for_city)

        for area_type in area_types_for_city:
            template_info = AREA_TEMPLATES[area_type]

            # Generate unique area name
            for _ in range(20):  # Try up to 20 times for uniqueness
                template = random.choice(template_info["name_templates"])
                prefix = random.choice(PREFIXES)
                name_vars = {"city": city_name, "prefix": prefix}
                if "deity" in template:
                    name_vars["deity"] = random.choice(template_info.get("deities", ["Shri"]))
                area_name = template.format(**name_vars)

                unique_key = f"{state}_{city_name}_{area_name}"
                if unique_key not in used_area_names:
                    used_area_names.add(unique_key)
                    break

            # Realistic lat/lng offset (0.01–0.06 deg ≈ 1–6 km)
            lat_offset = random.uniform(-0.04, 0.04)
            lng_offset = random.uniform(-0.04, 0.04)

            # Select 2–5 common festivals from applicable ones
            if state_festivals:
                sample_size = min(len(state_festivals), random.randint(2, 5))
                common_fests = random.sample(state_festivals, sample_size)
            else:
                common_fests = []

            density = random.choice(template_info["density_options"])

            locations.append({
                "location_id": f"loc_{str(loc_id_counter).zfill(4)}",
                "state": state,
                "city": city_name,
                "area_name": area_name,
                "lat": round(base_lat + lat_offset, 5),
                "lng": round(base_lng + lng_offset, 5),
                "area_type": area_type,
                "population_density": density,
                "common_festivals": common_fests
            })
            loc_id_counter += 1

print(f"[OK] Locations: {len(locations)} hotspots across {len(STATES_CITIES)} states, {sum(len(c) for c in STATES_CITIES.values())} cities")


# ============================================================================
# 3. WASTE PATTERNS (Festival × Area Type cross-product with realistic modeling)
# ============================================================================

WASTE_TYPE_RULES = {
    # (festival_type, area_type) → primary waste types
    ("religious", "temple"):        ["organic", "organic", "mixed"],
    ("religious", "public_ground"): ["mixed", "plastic", "food"],
    ("religious", "market"):        ["plastic", "mixed", "food"],
    ("religious", "beach"):         ["idol", "mixed", "plastic"],
    ("religious", "residential"):   ["mixed", "food", "organic"],
    ("cultural", "temple"):         ["organic", "mixed"],
    ("cultural", "public_ground"):  ["food", "mixed", "plastic"],
    ("cultural", "market"):         ["plastic", "food", "mixed"],
    ("cultural", "beach"):          ["mixed", "plastic", "food"],
    ("cultural", "residential"):    ["food", "mixed"],
    ("national", "temple"):         ["mixed", "plastic"],
    ("national", "public_ground"):  ["plastic", "food", "mixed"],
    ("national", "market"):         ["plastic", "plastic", "food"],
    ("national", "beach"):          ["plastic", "mixed"],
    ("national", "residential"):    ["mixed", "food"],
}

# Special override: idol waste for immersion festivals at water bodies
IDOL_FESTIVALS = {"fest_001", "fest_004"}  # Ganesh Chaturthi, Durga Puja
IDOL_AREAS = {"beach", "public_ground"}

# High-impact festivals (crowd multipliers)
HIGH_IMPACT = {"fest_001", "fest_002", "fest_004", "fest_005"}  # Ganesh, Diwali, Durga Puja, Navratri
MEDIUM_IMPACT = {"fest_003", "fest_006", "fest_014", "fest_015", "fest_018", "fest_011"}  # Holi, Chhath, Eid, Christmas, Onam

waste_patterns = []
pattern_id_counter = 1

for fest in festival_calendar:
    fest_id = fest["festival_id"]
    fest_type = fest["festival_type"]

    for area_type in ["temple", "public_ground", "market", "beach", "residential"]:
        rule_key = (fest_type, area_type)
        waste_options = WASTE_TYPE_RULES.get(rule_key, ["mixed"])
        waste_type = random.choice(waste_options)

        # Override for idol immersion festivals
        if fest_id in IDOL_FESTIVALS and area_type in IDOL_AREAS:
            waste_type = "idol"

        # --- Base intensity scoring ---
        base_intensity = 4  # Baseline

        # Festival importance
        if fest_id in HIGH_IMPACT:
            base_intensity += 4
        elif fest_id in MEDIUM_IMPACT:
            base_intensity += 2
        else:
            base_intensity += 1

        # Area type modifier
        area_modifiers = {
            "market": 2, "public_ground": 2, "beach": 1,
            "temple": 1, "residential": 0
        }
        base_intensity += area_modifiers.get(area_type, 0)

        # Cap at 10
        base_intensity = min(10, max(1, base_intensity))

        # --- Crowd level ---
        if fest_id in HIGH_IMPACT:
            if area_type in ["market", "public_ground", "beach"]:
                crowd_level = "very_high"
            else:
                crowd_level = "high"
        elif fest_id in MEDIUM_IMPACT:
            if area_type in ["market", "public_ground"]:
                crowd_level = "high"
            else:
                crowd_level = "medium"
        else:
            crowd_level = random.choice(["low", "medium"])

        # --- Seasonal factor (monsoon = harder cleanup, more wet waste weight) ---
        seasonal_factor = 1.0
        # Use average month from festival dates
        if fest["dates"]:
            avg_month = int(fest["dates"][0]["date"].split("-")[1])
            if avg_month in [6, 7, 8, 9]:  # Monsoon
                seasonal_factor = 1.25
            elif avg_month in [11, 12, 1, 2]:  # Winter (less decay, easier cleanup)
                seasonal_factor = 0.9

        # --- Day factor (final-day peak for multi-day festivals) ---
        day_factor = 1.0
        if fest["festival_name"] in ["Ganesh Chaturthi", "Durga Puja"]:
            day_factor = 2.5  # Immersion day → extreme peak
        elif fest["festival_name"] in ["Holi", "Navratri", "Onam"]:
            day_factor = 1.8  # Final celebration day
        elif fest["festival_name"] in ["Diwali", "Chhath Puja"]:
            day_factor = 1.5  # Peak night
        elif fest["festival_name"] in ["Eid al-Fitr", "Eid al-Adha"]:
            day_factor = 1.4  # Feast day
        else:
            day_factor = 1.1

        # --- Estimated waste kg per day ---
        # Base: intensity × (150–350 depending on area type)
        area_base_kg = {
            "market": random.randint(250, 400),
            "public_ground": random.randint(200, 350),
            "beach": random.randint(180, 300),
            "temple": random.randint(150, 280),
            "residential": random.randint(100, 200)
        }
        base_kg = base_intensity * area_base_kg.get(area_type, 200)

        # Crowd multiplier
        crowd_multipliers = {"very_high": 2.8, "high": 1.9, "medium": 1.3, "low": 1.0}
        base_kg *= crowd_multipliers.get(crowd_level, 1.0)

        # Add some realistic variation (+/- 10%)
        variation = random.uniform(0.9, 1.1)
        base_kg *= variation

        waste_patterns.append({
            "pattern_id": f"pat_{str(pattern_id_counter).zfill(3)}",
            "festival_id": fest_id,
            "area_type": area_type,
            "crowd_level": crowd_level,
            "waste_type": waste_type,
            "base_waste_intensity_score": base_intensity,
            "estimated_waste_kg_per_day": round(base_kg, 1),
            "seasonal_factor": round(seasonal_factor, 2),
            "day_factor": round(day_factor, 1)
        })
        pattern_id_counter += 1

print(f"[OK] Waste Patterns: {len(waste_patterns)} records ({len(festival_calendar)} festivals x 5 area types)")


# ============================================================================
# 4. VALIDATION & STATISTICS
# ============================================================================

# Validate referential integrity
all_fest_ids = {f["festival_id"] for f in festival_calendar}
loc_fest_refs = set()
for loc in locations:
    for fid in loc["common_festivals"]:
        loc_fest_refs.add(fid)

pattern_fest_refs = {p["festival_id"] for p in waste_patterns}

orphan_loc_refs = loc_fest_refs - all_fest_ids
orphan_pat_refs = pattern_fest_refs - all_fest_ids

if orphan_loc_refs:
    print(f"[WARN] Orphaned festival refs in locations: {orphan_loc_refs}")
if orphan_pat_refs:
    print(f"[WARN] Orphaned festival refs in patterns: {orphan_pat_refs}")

total_records = len(festival_calendar) + len(locations) + len(waste_patterns)
print("\n" + "-" * 60)
print("  DATASET SUMMARY")
print("-" * 60)
print(f"  Festivals:      {len(festival_calendar):>6} records")
print(f"  Locations:       {len(locations):>6} records")
print(f"  Waste Patterns:  {len(waste_patterns):>6} records")
print("  " + "-" * 40)
print(f"  TOTAL:           {total_records:>6} records")
print("-" * 60)

if total_records < 500:
    print("[WARN] Total records below 500 -- dataset may be insufficient for ML.")
elif total_records >= 1500:
    print("[OK] Dataset exceeds 1500 records -- excellent for ML training.")
else:
    print("[OK] Dataset in optimal range (500-1500) for ML applications.")


# ============================================================================
# 5. SAVE OUTPUT FILES
# ============================================================================

# Resolve output path relative to project root
script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "..", "data")
os.makedirs(data_dir, exist_ok=True)

def save_json(data, filename):
    filepath = os.path.join(data_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    size_kb = os.path.getsize(filepath) / 1024
    print(f"  [SAVED] {filename:<30} -> {size_kb:.1f} KB")

print(f"\nSaving to: {os.path.abspath(data_dir)}")
save_json(festival_calendar, "festival_calendar.json")
save_json(locations, "locations.json")
save_json(waste_patterns, "waste_patterns.json")

print("\n[FINISH] Dataset generation complete!")
