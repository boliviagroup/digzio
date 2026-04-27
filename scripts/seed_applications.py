#!/usr/bin/env python3.11
"""
Seed applications from all 5 Siwedi demo students to 2 Siwedi properties.

Properties chosen (best-named, already owned by demo.provider):
  1. Hatfield Gardens         - 5553b680-25d2-4e92-87a5-005ff7a253b1  (shared_house, R5200)
  2. UCT Rondebosch Flats     - fa9fa471-fe1a-4d0a-83b9-14abebb86eac  (apartment, R4800)

Students (from POSA seed):
  Lehlohonolo Mathaba  - 3ff2613a-2647-4019-bbcb-78b1e7eed3c6
  Nothando Nkosi       - bc2ed5c8-e47e-4cd3-a617-8d62cfdaf26f
  Thandeka Dlamini     - c2dab814-4e8f-48ed-9930-948a05392dad
  Mpho Sithole         - b6f91d14-7bb7-4a26-bdc0-b8a0ed1ae487
  Zanele Mokoena       - 41ce6fe0-b5f5-4c24-95b1-2252d9dda285
"""
import requests, json, time

BASE = "https://www.digzio.co.za/api/v1"
ALB  = "http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com/api/v1"

PROPERTIES = [
    {"property_id": "5553b680-25d2-4e92-87a5-005ff7a253b1", "title": "Hatfield Gardens"},
    {"property_id": "fa9fa471-fe1a-4d0a-83b9-14abebb86eac", "title": "UCT Rondebosch Flats"},
]

STUDENTS = [
    {"student_id": "3ff2613a-2647-4019-bbcb-78b1e7eed3c6", "email": "lehlohonolo.mathaba@student.uj.ac.za",  "name": "Lehlohonolo Mathaba",  "password": "Demo1234!"},
    {"student_id": "bc2ed5c8-e47e-4cd3-a617-8d62cfdaf26f", "email": "nothando.nkosi@student.uj.ac.za",       "name": "Nothando Nkosi",        "password": "Demo1234!"},
    {"student_id": "c2dab814-4e8f-48ed-9930-948a05392dad", "email": "thandeka.dlamini@student.uj.ac.za",     "name": "Thandeka Dlamini",      "password": "Demo1234!"},
    {"student_id": "b6f91d14-7bb7-4a26-bdc0-b8a0ed1ae487", "email": "mpho.sithole@student.uj.ac.za",         "name": "Mpho Sithole",          "password": "Demo1234!"},
    {"student_id": "41ce6fe0-b5f5-4c24-95b1-2252d9dda285", "email": "zanele.mokoena@student.uj.ac.za",       "name": "Zanele Mokoena",        "password": "Demo1234!"},
]

def login(email, password):
    r = requests.post(f"{BASE}/auth/login",
                      json={"email": email, "password": password},
                      timeout=30)
    if r.status_code == 200:
        return r.json().get("token")
    return None

print("=" * 60)
print("Seeding applications: 5 students × 2 properties = 10 applications")
print("=" * 60)

results = []
for student in STUDENTS:
    print(f"\nStudent: {student['name']}")
    token = login(student["email"], student["password"])
    if not token:
        print(f"  ✗ Login failed for {student['email']}")
        continue
    print(f"  ✓ Logged in")

    for prop in PROPERTIES:
        r = requests.post(
            f"{ALB}/applications",
            json={"property_id": prop["property_id"]},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=30
        )
        if r.status_code == 201:
            d = r.json()
            print(f"  ✓ Applied to '{prop['title']}' → application_id: {d.get('application_id')}")
            results.append({"student": student["name"], "property": prop["title"],
                             "application_id": d.get("application_id"), "status": d.get("status")})
        elif r.status_code == 400 and "already applied" in r.text.lower():
            print(f"  ~ Already applied to '{prop['title']}'")
        else:
            print(f"  ✗ Failed to apply to '{prop['title']}': {r.status_code} {r.text[:150]}")

print("\n" + "=" * 60)
print(f"Done. {len(results)} new applications created.")
print("=" * 60)

# Verify from provider side
print("\nVerifying from provider dashboard...")
prov_token = login("demo.provider@digzio.co.za", "Demo1234!")
if prov_token:
    for prop in PROPERTIES:
        r = requests.get(
            f"{ALB}/applications/provider?property_id={prop['property_id']}",
            headers={"Authorization": f"Bearer {prov_token}"},
            timeout=30
        )
        if r.status_code == 200:
            d = r.json()
            apps = d.get("applications", d) if isinstance(d, dict) else d
            print(f"\n  {prop['title']}: {len(apps)} applications")
            for a in apps:
                print(f"    - {a.get('first_name','')} {a.get('last_name','')} | {a.get('status','?')}")
        else:
            print(f"  {prop['title']}: {r.status_code} {r.text[:100]}")
