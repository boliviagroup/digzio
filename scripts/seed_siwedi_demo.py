#!/usr/bin/env python3.11
"""
Seed the demo.provider@digzio.co.za account with Siwedi & Associates Pinmill data:
- 1 property: Siwedi & Associates Pinmill (POSA Code: 1233)
- 5 students with NSFAS statuses matching the Roomza screenshots
- 5 active leases linking students to the property
"""
import requests
import json

BASE = "https://www.digzio.co.za/api/v1"

# ── 1. Login as demo provider ──────────────────────────────────────────────────
print("1. Logging in as demo.provider...")
r = requests.post(f"{BASE}/auth/login", json={"email": "demo.provider@digzio.co.za", "password": "Demo1234!"})
r.raise_for_status()
data = r.json()
PROVIDER_TOKEN = data["token"]
PROVIDER_ID = data["user"]["user_id"]
print(f"   Provider ID: {PROVIDER_ID}")

HEADERS = {"Authorization": f"Bearer {PROVIDER_TOKEN}", "Content-Type": "application/json"}

# ── 2. Create the Siwedi property ─────────────────────────────────────────────
print("2. Creating Siwedi & Associates Pinmill property...")
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
r = requests.post(f"{BASE}/properties", json=prop_payload, headers=HEADERS)
if r.status_code in (200, 201):
    PROPERTY_ID = r.json().get("property", {}).get("property_id") or r.json().get("property_id")
    print(f"   Property created: {PROPERTY_ID}")
else:
    # Maybe already exists — get existing
    print(f"   Create failed ({r.status_code}): {r.text[:200]}")
    r2 = requests.get(f"{BASE}/properties/my", headers=HEADERS)
    props = r2.json().get("properties", [])
    if props:
        PROPERTY_ID = props[0]["property_id"]
        print(f"   Using existing property: {PROPERTY_ID}")
    else:
        print("   ERROR: No property found or created. Exiting.")
        exit(1)

# ── 3. Set POSA code on the property ─────────────────────────────────────────
print("3. Setting POSA code 1233...")
r = requests.patch(f"{BASE}/institutions/posa/property/{PROPERTY_ID}",
    json={"posa_code": "1233", "posa_institution": "Siwedi & Associates Pinmill"},
    headers=HEADERS)
print(f"   POSA patch: {r.status_code} {r.text[:100]}")

# ── 4. Register 5 student accounts ───────────────────────────────────────────
students = [
    {
        "first_name": "Lehlohonolo", "last_name": "Mathaba",
        "email": "lehlohonolo.mathaba@student.uj.ac.za", "password": "Demo1234!",
        "role": "STUDENT",
        "id_number": "0210240457080",
        "student_number": "221134615",
        "campus": "SWC",
        "gender": "Female",
        "year_of_study": "Third Year",
        "qualification": "Bachelor of Commerce (Accounting)",
        "type_of_funding": "NSFAS",
        "nsfas_status": "NSFAS_VERIFIED",
        "room": "002A",
    },
    {
        "first_name": "Nothando", "last_name": "Nkosi",
        "email": "nothando.nkosi@student.uj.ac.za", "password": "Demo1234!",
        "role": "STUDENT",
        "id_number": "0610171183086",
        "student_number": "226013681",
        "campus": "SWC",
        "gender": "Female",
        "year_of_study": "First Year",
        "qualification": "Bachelor of Arts in Public Management",
        "type_of_funding": "NSFAS",
        "nsfas_status": "NSFAS_VERIFIED",
        "room": "003B",
    },
    {
        "first_name": "Thandeka", "last_name": "Dlamini",
        "email": "thandeka.dlamini@student.uj.ac.za", "password": "Demo1234!",
        "role": "STUDENT",
        "id_number": "0408156789012",
        "student_number": "224087654",
        "campus": "SWC",
        "gender": "Female",
        "year_of_study": "Second Year",
        "qualification": "Diploma in Business Information Technology",
        "type_of_funding": "NSFAS",
        "nsfas_status": "PENDING_CHECK",
        "room": "004A",
    },
    {
        "first_name": "Mpho", "last_name": "Sithole",
        "email": "mpho.sithole@student.uj.ac.za", "password": "Demo1234!",
        "role": "STUDENT",
        "id_number": "0312034567890",
        "student_number": "225034521",
        "campus": "SWC",
        "gender": "Male",
        "year_of_study": "Second Year",
        "qualification": "Bachelor of Human Resource Management",
        "type_of_funding": "Bursary",
        "nsfas_status": "NOT_ON_LIST",
        "room": "005A",
    },
    {
        "first_name": "Zanele", "last_name": "Mokoena",
        "email": "zanele.mokoena@student.uj.ac.za", "password": "Demo1234!",
        "role": "STUDENT",
        "id_number": "0507128901234",
        "student_number": "226098765",
        "campus": "SWC",
        "gender": "Female",
        "year_of_study": "First Year",
        "qualification": "Bachelor of Commerce (Finance)",
        "type_of_funding": "NSFAS",
        "nsfas_status": "NSFAS_VERIFIED",
        "room": "006B",
    },
]

student_ids = []
print("4. Registering 5 students...")
for s in students:
    reg_payload = {
        "first_name": s["first_name"],
        "last_name": s["last_name"],
        "email": s["email"],
        "password": s["password"],
        "role": "STUDENT",
    }
    r = requests.post(f"{BASE}/auth/register", json=reg_payload)
    if r.status_code in (200, 201):
        user_data = r.json()
        student_token = user_data.get("token", "")
        student_id = user_data.get("user", {}).get("user_id") or user_data.get("user_id")
        print(f"   Registered {s['first_name']} {s['last_name']}: {student_id}")
    else:
        # Already exists — login
        r2 = requests.post(f"{BASE}/auth/login", json={"email": s["email"], "password": "Demo1234!"})
        if r2.status_code == 200:
            user_data = r2.json()
            student_token = user_data.get("token", "")
            student_id = user_data.get("user", {}).get("user_id") or user_data.get("user_id")
            print(f"   Already exists {s['first_name']} {s['last_name']}: {student_id}")
        else:
            print(f"   SKIP {s['first_name']}: register={r.status_code}, login={r2.status_code}")
            student_ids.append(None)
            continue

    # Update student profile with POSA fields
    student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
    profile_payload = {
        "student_number": s["student_number"],
        "id_number": s["id_number"],
        "campus": s["campus"],
        "gender": s["gender"],
        "year_of_study": s["year_of_study"],
        "qualification": s["qualification"],
        "type_of_funding": s["type_of_funding"],
        "nsfas_status": s["nsfas_status"],
    }
    r3 = requests.patch(f"{BASE}/auth/profile", json=profile_payload, headers=student_headers)
    print(f"   Profile update: {r3.status_code} {r3.text[:80]}")

    student_ids.append({"student_id": student_id, "token": student_token, "room": s["room"], "data": s})

# ── 5. Create leases for each student ────────────────────────────────────────
print("5. Creating leases...")
for entry in student_ids:
    if not entry:
        continue
    lease_payload = {
        "property_id": PROPERTY_ID,
        "student_id": entry["student_id"],
        "room_number": entry["room"],
        "monthly_rate": 5200,
        "start_date": "2026-02-01",
        "end_date": "2026-11-30",
        "file_ref": f"2026-{entry['room']}",
        "status": "ACTIVE",
    }
    # Use provider token to create lease
    r = requests.post(f"{BASE}/leases/generate", json=lease_payload, headers=HEADERS)
    if r.status_code in (200, 201):
        lease_id = r.json().get("lease", {}).get("lease_id") or r.json().get("lease_id", "?")
        print(f"   Lease created for {entry['data']['first_name']}: {lease_id}")
        # Auto-sign the lease as the student
        if lease_id and lease_id != "?":
            student_headers = {"Authorization": f"Bearer {entry['token']}", "Content-Type": "application/json"}
            r2 = requests.patch(f"{BASE}/leases/{lease_id}/sign", headers=student_headers)
            print(f"   Lease signed: {r2.status_code}")
    else:
        print(f"   Lease failed for {entry['data']['first_name']}: {r.status_code} {r.text[:150]}")

print("\n✅ Seeding complete! Log in at https://www.digzio.co.za with demo.provider@digzio.co.za / Demo1234!")
