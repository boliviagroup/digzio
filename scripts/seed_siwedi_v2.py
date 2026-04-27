#!/usr/bin/env python3.11
"""
Seed the demo.provider@digzio.co.za account with Siwedi & Associates Pinmill data.
Uses correct API endpoints discovered from source code inspection.
"""
import requests, json, sys

BASE = "https://www.digzio.co.za/api/v1"
UJ_INSTITUTION_ID = "94e26b79-28a6-4cf6-8210-b058944bba16"

# ── 1. Login as demo provider ──────────────────────────────────────────────────
print("1. Logging in as demo.provider...")
r = requests.post(f"{BASE}/auth/login", json={"email": "demo.provider@digzio.co.za", "password": "Demo1234!"})
r.raise_for_status()
data = r.json()
PROVIDER_TOKEN = data["token"]
PROVIDER_ID = data["user"]["user_id"]
PROV_HEADERS = {"Authorization": f"Bearer {PROVIDER_TOKEN}", "Content-Type": "application/json"}
print(f"   Provider ID: {PROVIDER_ID}")

# ── 2. Get or create the Siwedi property ──────────────────────────────────────
print("2. Checking for existing Siwedi property...")
r = requests.get(f"{BASE}/properties/my", headers=PROV_HEADERS)
props = r.json().get("properties", [])
PROPERTY_ID = None
for p in props:
    if "Siwedi" in p.get("title", ""):
        PROPERTY_ID = p["property_id"]
        print(f"   Found existing: {PROPERTY_ID}")
        break

if not PROPERTY_ID:
    print("   Creating Siwedi & Associates Pinmill property...")
    prop_payload = {
        "title": "Siwedi & Associates Pinmill",
        "description": "Student accommodation at Siwedi & Associates Pinmill, close to UJ SWC campus. Fully furnished single rooms with WiFi, laundry, and 24-hour security.",
        "address_line_1": "12 Pinmill Farm Road",
        "address_line_2": "Sandton",
        "city": "Johannesburg",
        "province": "Gauteng",
        "postal_code": "2196",
        "lat": -26.1052,
        "lng": 28.0522,
        "property_type": "student_residence",
        "total_beds": 20,
        "available_beds": 15,
        "base_price_monthly": 5200,
        "is_nsfas_accredited": True,
    }
    r = requests.post(f"{BASE}/properties", json=prop_payload, headers=PROV_HEADERS)
    print(f"   Create response: {r.status_code} {r.text[:200]}")
    if r.status_code in (200, 201):
        resp = r.json()
        PROPERTY_ID = resp.get("property", {}).get("property_id") or resp.get("property_id")
    if not PROPERTY_ID:
        # Re-fetch
        r2 = requests.get(f"{BASE}/properties/my", headers=PROV_HEADERS)
        props = r2.json().get("properties", [])
        if props:
            PROPERTY_ID = props[0]["property_id"]
    print(f"   Property ID: {PROPERTY_ID}")

# ── 3. Set POSA code on the property ─────────────────────────────────────────
print("3. Setting POSA code 1233 on property...")
r = requests.patch(
    f"{BASE}/institutions/posa/property/{PROPERTY_ID}",
    json={"posa_code": "1233", "posa_institution": "Siwedi & Associates Pinmill"},
    headers=PROV_HEADERS
)
print(f"   POSA patch: {r.status_code} {r.text[:150]}")

# ── 4. Register 5 student accounts + create profiles ─────────────────────────
students = [
    {
        "first_name": "Lehlohonolo", "last_name": "Mathaba",
        "email": "lehlohonolo.mathaba@student.uj.ac.za",
        "id_number": "0210240457080", "student_number": "221134615",
        "campus": "SWC", "gender": "Female", "year_of_study": "Third Year",
        "qualification": "Bachelor of Commerce (Accounting)",
        "type_of_funding": "NSFAS", "nsfas_status": "NSFAS_VERIFIED", "room": "002A",
    },
    {
        "first_name": "Nothando", "last_name": "Nkosi",
        "email": "nothando.nkosi@student.uj.ac.za",
        "id_number": "0610171183086", "student_number": "226013681",
        "campus": "SWC", "gender": "Female", "year_of_study": "First Year",
        "qualification": "Bachelor of Arts in Public Management",
        "type_of_funding": "NSFAS", "nsfas_status": "NSFAS_VERIFIED", "room": "003B",
    },
    {
        "first_name": "Thandeka", "last_name": "Dlamini",
        "email": "thandeka.dlamini@student.uj.ac.za",
        "id_number": "0408156789012", "student_number": "224087654",
        "campus": "SWC", "gender": "Female", "year_of_study": "Second Year",
        "qualification": "Diploma in Business Information Technology",
        "type_of_funding": "NSFAS", "nsfas_status": "PENDING_CHECK", "room": "004A",
    },
    {
        "first_name": "Mpho", "last_name": "Sithole",
        "email": "mpho.sithole@student.uj.ac.za",
        "id_number": "0312034567890", "student_number": "225034521",
        "campus": "SWC", "gender": "Male", "year_of_study": "Second Year",
        "qualification": "Bachelor of Human Resource Management",
        "type_of_funding": "Bursary", "nsfas_status": "NOT_ON_LIST", "room": "005A",
    },
    {
        "first_name": "Zanele", "last_name": "Mokoena",
        "email": "zanele.mokoena@student.uj.ac.za",
        "id_number": "0507128901234", "student_number": "226098765",
        "campus": "SWC", "gender": "Female", "year_of_study": "First Year",
        "qualification": "Bachelor of Commerce (Finance)",
        "type_of_funding": "NSFAS", "nsfas_status": "NSFAS_VERIFIED", "room": "006B",
    },
]

student_entries = []
print("4. Registering/logging in 5 students and creating profiles...")
for s in students:
    # Register or login
    r = requests.post(f"{BASE}/auth/register", json={
        "first_name": s["first_name"], "last_name": s["last_name"],
        "email": s["email"], "password": "Demo1234!", "role": "STUDENT",
    })
    if r.status_code in (200, 201):
        ud = r.json()
        student_token = ud.get("token", "")
        student_id = ud.get("user", {}).get("user_id") or ud.get("user_id")
        print(f"   Registered {s['first_name']}: {student_id}")
    else:
        r2 = requests.post(f"{BASE}/auth/login", json={"email": s["email"], "password": "Demo1234!"})
        if r2.status_code == 200:
            ud = r2.json()
            student_token = ud.get("token", "")
            student_id = ud.get("user", {}).get("user_id") or ud.get("user_id")
            print(f"   Existing {s['first_name']}: {student_id}")
        else:
            print(f"   SKIP {s['first_name']}: {r.status_code} / {r2.status_code}")
            continue

    # Create student profile via institutions/students/link
    st_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
    profile_r = requests.post(f"{BASE}/institutions/students/link", json={
        "institution_id": UJ_INSTITUTION_ID,
        "student_number": s["student_number"],
        "id_number": s["id_number"],
        "year_of_study": s["year_of_study"],
        "qualification": s["qualification"],
        "campus": s["campus"],
        "gender": s["gender"],
        "type_of_funding": s["type_of_funding"],
    }, headers=st_headers)
    print(f"   Profile: {profile_r.status_code} {profile_r.text[:100]}")

    student_entries.append({
        "student_id": student_id,
        "token": student_token,
        "room": s["room"],
        "nsfas_status": s["nsfas_status"],
        "data": s,
    })

# ── 5. Create leases via the lease service ────────────────────────────────────
# The lease service uses mockAuth and needs application_id which doesn't exist.
# Instead, we'll use a direct DB insert via an ECS one-off task.
# For now, write the student IDs and property ID to a file for the ECS task.
print("\n5. Writing seed data for ECS DB task...")
seed_data = {
    "property_id": PROPERTY_ID,
    "provider_id": PROVIDER_ID,
    "uj_institution_id": UJ_INSTITUTION_ID,
    "students": [
        {
            "student_id": e["student_id"],
            "room": e["room"],
            "nsfas_status": e["nsfas_status"],
            "first_name": e["data"]["first_name"],
            "last_name": e["data"]["last_name"],
        }
        for e in student_entries
    ]
}
with open("/tmp/siwedi_seed_data.json", "w") as f:
    json.dump(seed_data, f, indent=2)
print(f"   Seed data written to /tmp/siwedi_seed_data.json")
print(f"   Property ID: {PROPERTY_ID}")
print(f"   Students: {len(student_entries)}")
for e in student_entries:
    print(f"     - {e['data']['first_name']} {e['data']['last_name']}: {e['student_id']} room={e['room']}")
