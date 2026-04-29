"""
Fix all provider-student-property linkages:
1. Set POSA codes on Hatfield and Braamfontein properties
2. Seed leases for all 5 students on both properties
3. Verify the Students tab shows all students for each property
"""
import requests, json

BASE = "https://www.digzio.co.za"
ALB = "http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com"

# ── Login ─────────────────────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "demo.provider@digzio.co.za", "password": "Demo1234!"
}, timeout=10)
token = r.json().get("token") or r.json().get("access_token")
provider_id = r.json().get("user", {}).get("user_id")
print(f"Provider logged in: {provider_id[:8]}...")

# ── Get property IDs ──────────────────────────────────────────────────────
r2 = requests.get(f"{ALB}/api/v1/properties/my",
                  headers={"Authorization": f"Bearer {token}"}, timeout=10)
props = r2.json().get("properties", [])
prop_map = {p["title"]: p["property_id"] for p in props}
print(f"Properties: {list(prop_map.keys())}")

hatfield_id = prop_map.get("Siwedi Hatfield Residences")
braamfontein_id = prop_map.get("Siwedi Braamfontein Studios")
pinmill_id = prop_map.get("Siwedi & Associates Pinmill")

print(f"  Hatfield:      {hatfield_id}")
print(f"  Braamfontein:  {braamfontein_id}")
print(f"  Pinmill:       {pinmill_id}")

# ── Step 1: Set POSA codes on Hatfield and Braamfontein ───────────────────
print("\n── Setting POSA codes ──────────────────────────────────────────────")
for prop_id, name, posa_code in [
    (hatfield_id, "Siwedi Hatfield Residences", "1234"),
    (braamfontein_id, "Siwedi Braamfontein Studios", "1235"),
]:
    r3 = requests.patch(
        f"{ALB}/api/v1/properties/posa/{prop_id}",
        json={"posa_code": posa_code, "posa_institution": "University of Pretoria"},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )
    print(f"  PATCH POSA {name} -> {r3.status_code}: {r3.text[:100]}")

# ── Step 2: Get student IDs ───────────────────────────────────────────────
print("\n── Getting student IDs ─────────────────────────────────────────────")
students = [
    {"email": "thandeka.dlamini@student.uj.ac.za", "name": "Thandeka Dlamini"},
    {"email": "lehlohonolo.mathaba@student.uj.ac.za", "name": "Lehlohonolo Mathaba"},
    {"email": "zanele.mokoena@student.uj.ac.za", "name": "Zanele Mokoena"},
    {"email": "nothando.nkosi@student.uj.ac.za", "name": "Nothando Nkosi"},
    {"email": "mpho.sithole@student.uj.ac.za", "name": "Mpho Sithole"},
]

for s in students:
    r4 = requests.post(f"{BASE}/api/v1/auth/login",
                       json={"email": s["email"], "password": "Demo1234!"}, timeout=10)
    if r4.ok:
        s["user_id"] = r4.json().get("user", {}).get("user_id")
        print(f"  ✓ {s['name']}: {s['user_id'][:8]}...")
    else:
        print(f"  ✗ {s['name']}: {r4.status_code}")
        s["user_id"] = None

# ── Step 3: Seed leases for Hatfield and Braamfontein ────────────────────
print("\n── Seeding leases for Hatfield and Braamfontein ────────────────────")
for prop_id, name in [
    (hatfield_id, "Siwedi Hatfield Residences"),
    (braamfontein_id, "Siwedi Braamfontein Studios"),
]:
    student_ids = [s["user_id"] for s in students if s.get("user_id")]
    r5 = requests.post(
        f"{ALB}/api/v1/properties/posa/seed-leases",
        json={
            "property_id": prop_id,
            "student_ids": student_ids,
            "start_date": "2026-02-01",
            "end_date": "2026-11-30",
            "rent_amount_monthly": 4500
        },
        headers={"Authorization": f"Bearer {token}"},
        timeout=15
    )
    print(f"  Seed leases for {name} -> {r5.status_code}: {r5.text[:200]}")

# ── Step 4: Verify POSA students for all 3 properties ────────────────────
print("\n── Verifying POSA students ─────────────────────────────────────────")
for prop_id, name in [
    (hatfield_id, "Siwedi Hatfield Residences"),
    (braamfontein_id, "Siwedi Braamfontein Studios"),
    (pinmill_id, "Siwedi & Associates Pinmill"),
]:
    r6 = requests.get(
        f"{ALB}/api/v1/properties/posa/students?property_id={prop_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )
    if r6.ok:
        data = r6.json()
        student_count = len(data.get("students", []))
        posa_code = data.get("property", {}).get("posa_code")
        print(f"  {name}: {student_count} students | POSA code: {posa_code}")
        for st in data.get("students", [])[:3]:
            print(f"    - {st.get('first_name')} {st.get('last_name')} | {st.get('student_number')}")
    else:
        print(f"  {name}: {r6.status_code} {r6.text[:100]}")

# ── Step 5: Verify applications ───────────────────────────────────────────
print("\n── Verifying applications ──────────────────────────────────────────")
r7 = requests.get(f"{ALB}/api/v1/applications/provider",
                  headers={"Authorization": f"Bearer {token}"}, timeout=10)
if r7.ok:
    apps = r7.json().get("applications", [])
    print(f"  Total applications: {len(apps)}")
    by_prop = {}
    for a in apps:
        pt = a.get("property_title", "?")
        by_prop[pt] = by_prop.get(pt, 0) + 1
    for pt, count in by_prop.items():
        print(f"    {pt}: {count} applications")

print("\n── DONE ────────────────────────────────────────────────────────────")
