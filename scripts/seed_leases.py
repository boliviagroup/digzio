#!/usr/bin/env python3.11
"""
Seed leases for the 5 Siwedi demo students.
Uses the lease-service API at /api/v1/leases.
"""
import requests, json, time

BASE = "https://www.digzio.co.za/api/v1"

PROPERTY_ID = "d9081297-8683-4480-9f72-c208aab3abf4"
PROVIDER_ID = "f8bddfa7-69aa-4777-8db2-b18868b438a5"

STUDENTS = [
    {"student_id": "3ff2613a-2647-4019-bbcb-78b1e7eed3c6", "room": "002A", "first_name": "Lehlohonolo", "last_name": "Mathaba"},
    {"student_id": "bc2ed5c8-e47e-4cd3-a617-8d62cfdaf26f", "room": "003B", "first_name": "Nothando",    "last_name": "Nkosi"},
    {"student_id": "c2dab814-4e8f-48ed-9930-948a05392dad", "room": "004A", "first_name": "Thandeka",    "last_name": "Dlamini"},
    {"student_id": "b6f91d14-7bb7-4a26-bdc0-b8a0ed1ae487", "room": "005A", "first_name": "Mpho",        "last_name": "Sithole"},
    {"student_id": "41ce6fe0-b5f5-4c24-95b1-2252d9dda285", "room": "006B", "first_name": "Zanele",      "last_name": "Mokoena"},
]

# Login as provider
print("1. Logging in as demo.provider...")
for attempt in range(3):
    try:
        r = requests.post(f"{BASE}/auth/login",
                          json={"email": "demo.provider@digzio.co.za", "password": "Demo1234!"},
                          timeout=30)
        r.raise_for_status()
        break
    except Exception as e:
        print(f"   Attempt {attempt+1} failed: {e}")
        time.sleep(5)
else:
    print("   FAILED to login after 3 attempts")
    exit(1)

data = r.json()
PROVIDER_TOKEN = data["token"]
PROV_HEADERS = {"Authorization": f"Bearer {PROVIDER_TOKEN}", "Content-Type": "application/json"}
print(f"   Provider ID: {PROVIDER_ID}")

# First, set the POSA code via the new property-api endpoint
print("2. Setting POSA code via property-api...")
for attempt in range(3):
    try:
        r = requests.patch(
            f"{BASE}/properties/posa/{PROPERTY_ID}",
            json={"posa_code": "1233", "posa_institution": "Siwedi & Associates Pinmill"},
            headers=PROV_HEADERS,
            timeout=30
        )
        print(f"   POSA patch: {r.status_code} {r.text[:150]}")
        break
    except Exception as e:
        print(f"   Attempt {attempt+1} failed: {e}")
        time.sleep(5)

# Check existing leases for this property
print("3. Checking existing leases for property...")
for attempt in range(3):
    try:
        r = requests.get(f"{BASE}/leases?property_id={PROPERTY_ID}", headers=PROV_HEADERS, timeout=30)
        print(f"   Leases check: {r.status_code} {r.text[:200]}")
        break
    except Exception as e:
        print(f"   Attempt {attempt+1} failed: {e}")
        time.sleep(5)

# Create leases for each student
print("4. Creating leases for 5 students...")
for s in STUDENTS:
    lease_payload = {
        "property_id": PROPERTY_ID,
        "tenant_id": s["student_id"],
        "start_date": "2026-02-01",
        "end_date": "2026-11-30",
        "monthly_rent": 5200,
        "status": "ACTIVE",
        "room_number": s["room"],
    }
    for attempt in range(3):
        try:
            r = requests.post(f"{BASE}/leases", json=lease_payload, headers=PROV_HEADERS, timeout=30)
            print(f"   {s['first_name']} {s['last_name']}: {r.status_code} {r.text[:150]}")
            break
        except Exception as e:
            print(f"   Attempt {attempt+1} failed for {s['first_name']}: {e}")
            time.sleep(5)

print("\nDone! Verifying POSA students endpoint...")
for attempt in range(3):
    try:
        r = requests.get(
            f"{BASE}/properties/posa/students?property_id={PROPERTY_ID}",
            headers=PROV_HEADERS,
            timeout=30
        )
        print(f"   POSA students: {r.status_code}")
        if r.status_code == 200:
            d = r.json()
            print(f"   Students in POSA: {len(d.get('students', []))}")
            for st in d.get('students', []):
                print(f"     - {st.get('first_name')} {st.get('last_name')}")
        else:
            print(f"   Response: {r.text[:200]}")
        break
    except Exception as e:
        print(f"   Attempt {attempt+1} failed: {e}")
        time.sleep(5)
