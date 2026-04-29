"""
Deep audit: find all users, providers, properties, and applications.
Verify every property has a valid provider and every application links correctly.
"""
import requests, json

ALB = "http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com"
BASE = "https://www.digzio.co.za"

results = {
    "providers": [],
    "properties": [],
    "orphaned_properties": [],
    "applications": [],
    "students": [],
    "issues": []
}

# ── Login as demo provider ────────────────────────────────────────────────
r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "demo.provider@digzio.co.za",
    "password": "Demo1234!"
}, timeout=10)
provider_token = r.json().get("token") or r.json().get("access_token")
provider_id = r.json().get("user", {}).get("user_id")

# ── Try all known student emails ──────────────────────────────────────────
student_emails = [
    ("thandeka.dlamini@student.digzio.co.za", "Student1234!"),
    ("thandeka.dlamini@digzio.co.za", "Student1234!"),
    ("thandeka@digzio.co.za", "Student1234!"),
    ("student1@digzio.co.za", "Student1234!"),
    ("lehlohonolo.mathaba@student.digzio.co.za", "Student1234!"),
    ("zanele.mokoena@student.digzio.co.za", "Student1234!"),
    ("nothando.nkosi@student.digzio.co.za", "Student1234!"),
    ("mpho.sithole@student.digzio.co.za", "Student1234!"),
]

print("=" * 60)
print("FINDING STUDENT CREDENTIALS")
print("=" * 60)
student_token = None
for email, pwd in student_emails:
    r = requests.post(f"{BASE}/api/v1/auth/login", json={"email": email, "password": pwd}, timeout=10)
    status = "✓ OK" if r.ok else f"✗ {r.status_code}"
    print(f"  {status} | {email}")
    if r.ok and not student_token:
        student_token = r.json().get("token") or r.json().get("access_token")
        student_user = r.json().get("user", {})
        print(f"    -> Student ID: {student_user.get('user_id')}")
        print(f"    -> Name: {student_user.get('first_name')} {student_user.get('last_name')}")

# ── Get all properties with individual detail ─────────────────────────────
print()
print("=" * 60)
print("FULL PROPERTY AUDIT WITH PROVIDER LINKAGE")
print("=" * 60)

r = requests.get(f"{ALB}/api/v1/properties?limit=100", timeout=10)
all_props = r.json().get("properties", [])
print(f"Total properties in system: {len(all_props)}")
print()

provider_map = {}  # provider_id -> list of properties
orphaned = []

for p in all_props:
    pid = p.get("property_id")
    r2 = requests.get(f"{ALB}/api/v1/properties/{pid}", timeout=10)
    if r2.ok:
        detail = r2.json().get("property", r2.json())
        prov_id = detail.get("provider_id") or detail.get("user_id")
        prov_info = detail.get("provider", {})
        prov_name = prov_info.get("business_name") or prov_info.get("first_name", "") + " " + prov_info.get("last_name", "")
        title = detail.get("title", "?")
        status = detail.get("status", "?")
        nsfas = detail.get("nsfas_accredited", False)
        price = detail.get("price_per_month") or detail.get("monthly_rent", 0)
        beds = detail.get("total_beds") or detail.get("bedrooms", 0)

        if prov_id:
            if prov_id not in provider_map:
                provider_map[prov_id] = {"name": prov_name.strip(), "properties": []}
            provider_map[prov_id]["properties"].append({
                "id": pid[:8],
                "title": title,
                "status": status,
                "nsfas": nsfas,
                "price": price,
                "beds": beds
            })
        else:
            orphaned.append({"id": pid[:8], "title": title, "status": status})

print(f"Providers with properties: {len(provider_map)}")
print(f"Orphaned properties (no provider): {len(orphaned)}")
print()

for prov_id, info in provider_map.items():
    print(f"Provider {prov_id[:8]}... ({info['name'] or 'unnamed'}):")
    for prop in info["properties"]:
        nsfas_tag = "[NSFAS]" if prop["nsfas"] else ""
        print(f"  [{prop['status']}] {prop['id']}... | R{prop['price']}/mo | {prop['beds']} beds {nsfas_tag} | {prop['title'][:45]}")
    print()

if orphaned:
    print("⚠ ORPHANED PROPERTIES (no provider_id):")
    for p in orphaned:
        print(f"  [{p['status']}] {p['id']}... | {p['title']}")
    print()

# ── Check applications linkage ────────────────────────────────────────────
print("=" * 60)
print("APPLICATION LINKAGE AUDIT")
print("=" * 60)

r = requests.get(f"{ALB}/api/v1/applications/provider",
                 headers={"Authorization": f"Bearer {provider_token}"}, timeout=10)
if r.ok:
    apps = r.json().get("applications", [])
    print(f"Provider {provider_id[:8]}... has {len(apps)} applications:")
    for a in apps:
        app_id = a.get("application_id", "?")[:8]
        prop_id = a.get("property_id", "?")[:8]
        status = a.get("status", "?")
        student = f"{a.get('first_name','')} {a.get('last_name','')}".strip()
        prop_title = a.get("property_title") or "?"
        # Verify property belongs to this provider
        prop_prov = provider_map.get(provider_id, {}).get("properties", [])
        prop_ids_owned = [p["id"] for p in prop_prov]
        linkage = "✓" if prop_id in prop_ids_owned else "⚠ WRONG PROVIDER"
        print(f"  {linkage} [{status}] {student} -> {prop_title[:35]} | app={app_id}... prop={prop_id}...")
else:
    print(f"  ERROR: {r.text[:200]}")

# ── Student applications ──────────────────────────────────────────────────
if student_token:
    print()
    print("=" * 60)
    print("STUDENT APPLICATION CHECK")
    print("=" * 60)
    r = requests.get(f"{ALB}/api/v1/applications/my",
                     headers={"Authorization": f"Bearer {student_token}"}, timeout=10)
    print(f"  GET /api/v1/applications/my -> {r.status_code}")
    if r.ok:
        apps = r.json().get("applications", r.json().get("data", []))
        print(f"  Student has {len(apps)} applications:")
        for a in apps:
            status = a.get("status", "?")
            prop_title = a.get("property_title") or a.get("property", {}).get("title", "?")
            prop_id = a.get("property_id", "?")[:8]
            print(f"    [{status}] -> {prop_title[:40]} | prop={prop_id}...")
    else:
        print(f"  ERROR: {r.text[:200]}")

# ── Student profile check ─────────────────────────────────────────────────
if student_token:
    print()
    print("=" * 60)
    print("STUDENT PROFILE CHECK")
    print("=" * 60)
    r = requests.get(f"{ALB}/api/v1/auth/me",
                     headers={"Authorization": f"Bearer {student_token}"}, timeout=10)
    print(f"  GET /api/v1/auth/me -> {r.status_code}")
    if r.ok:
        user = r.json().get("user", r.json())
        print(f"  Name: {user.get('first_name')} {user.get('last_name')}")
        print(f"  Email: {user.get('email')}")
        print(f"  Role: {user.get('role')}")
        print(f"  KYC: {user.get('kyc_status')}")
    else:
        print(f"  ERROR: {r.text[:200]}")

print()
print("=" * 60)
print("DEEP AUDIT COMPLETE")
print("=" * 60)
