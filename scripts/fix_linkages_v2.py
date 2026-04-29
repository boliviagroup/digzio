"""
Fix all provider-student-property linkages (v2):
- Seed leases for Hatfield and Braamfontein using correct request format
"""
import requests, json

BASE = "https://www.digzio.co.za"
ALB = "http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com"

# ── Login ─────────────────────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "demo.provider@digzio.co.za", "password": "Demo1234!"
}, timeout=10)
token = r.json().get("token") or r.json().get("access_token")
print(f"Provider logged in")

# ── Get property IDs ──────────────────────────────────────────────────────
r2 = requests.get(f"{ALB}/api/v1/properties/my",
                  headers={"Authorization": f"Bearer {token}"}, timeout=10)
props = r2.json().get("properties", [])
prop_map = {p["title"]: p["property_id"] for p in props}

hatfield_id = prop_map.get("Siwedi Hatfield Residences")
braamfontein_id = prop_map.get("Siwedi Braamfontein Studios")

# ── Get student IDs ───────────────────────────────────────────────────────
student_data = [
    {"email": "thandeka.dlamini@student.uj.ac.za", "name": "Thandeka Dlamini"},
    {"email": "lehlohonolo.mathaba@student.uj.ac.za", "name": "Lehlohonolo Mathaba"},
    {"email": "zanele.mokoena@student.uj.ac.za", "name": "Zanele Mokoena"},
    {"email": "nothando.nkosi@student.uj.ac.za", "name": "Nothando Nkosi"},
    {"email": "mpho.sithole@student.uj.ac.za", "name": "Mpho Sithole"},
]

students = []
for s in student_data:
    r4 = requests.post(f"{BASE}/api/v1/auth/login",
                       json={"email": s["email"], "password": "Demo1234!"}, timeout=10)
    if r4.ok:
        uid = r4.json().get("user", {}).get("user_id")
        students.append({"user_id": uid, "name": s["name"]})
        print(f"  ✓ {s['name']}: {uid[:8]}...")

# ── Seed leases for Hatfield and Braamfontein ─────────────────────────────
# The endpoint expects: { property_id, leases: [{ tenant_id, start_date, end_date, monthly_rent }] }
for prop_id, name, rent in [
    (hatfield_id, "Siwedi Hatfield Residences", 3900),
    (braamfontein_id, "Siwedi Braamfontein Studios", 4800),
]:
    leases = [
        {
            "tenant_id": s["user_id"],
            "start_date": "2026-02-01",
            "end_date": "2026-11-30",
            "monthly_rent": rent,
            "deposit": rent,
            "room": f"Room {i+1:02d}"
        }
        for i, s in enumerate(students) if s.get("user_id")
    ]
    r5 = requests.post(
        f"{ALB}/api/v1/properties/posa/seed-leases",
        json={"property_id": prop_id, "leases": leases},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15
    )
    print(f"\nSeed leases for {name} -> {r5.status_code}")
    if r5.ok:
        results = r5.json().get("results", [])
        for res in results:
            print(f"  {res.get('status')}: {str(res.get('student_id',''))[:8]}...")
    else:
        print(f"  ERROR: {r5.text[:300]}")

# ── Verify POSA students for all 3 properties ─────────────────────────────
print("\n── Final verification ──────────────────────────────────────────────")
for prop_id, name in [
    (hatfield_id, "Siwedi Hatfield Residences"),
    (braamfontein_id, "Siwedi Braamfontein Studios"),
    (prop_map.get("Siwedi & Associates Pinmill"), "Siwedi & Associates Pinmill"),
]:
    r6 = requests.get(
        f"{ALB}/api/v1/properties/posa/students?property_id={prop_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10
    )
    if r6.ok:
        data = r6.json()
        count = len(data.get("students", []))
        posa = data.get("property", {}).get("posa_code")
        print(f"  {name}: {count} students | POSA: {posa or 'not set'}")
        for st in data.get("students", []):
            print(f"    - {st.get('first_name')} {st.get('last_name')} | #{st.get('student_number')} | {st.get('funding_type')}")
    else:
        print(f"  {name}: ERROR {r6.status_code}")

print("\n── DONE ────────────────────────────────────────────────────────────")
