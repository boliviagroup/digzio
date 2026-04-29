"""
Full property-provider linkage audit for Digzio.
Checks every property in the DB and verifies it has a valid provider.
"""
import requests, json, sys

ALB = "http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com"
BASE = "https://www.digzio.co.za"

# ── 1. Login as admin to get a token with full access ──────────────────────
print("=" * 60)
print("STEP 1: Login as demo provider to get auth token")
print("=" * 60)

# Login as demo provider
r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "demo.provider@digzio.co.za",
    "password": "Demo1234!"
}, timeout=10)
print(f"  Provider login -> {r.status_code}")
if not r.ok:
    print(f"  ERROR: {r.text[:200]}")
    sys.exit(1)
provider_token = r.json().get("token") or r.json().get("access_token")
provider_user = r.json().get("user", {})
provider_id = provider_user.get("user_id") or provider_user.get("id")
print(f"  Provider ID: {provider_id}")
print(f"  Provider name: {provider_user.get('first_name')} {provider_user.get('last_name')}")

# ── 2. Get all properties via the public search endpoint ───────────────────
print()
print("=" * 60)
print("STEP 2: Fetch all properties (public search)")
print("=" * 60)

r = requests.get(f"{ALB}/api/v1/properties?limit=100", timeout=10)
print(f"  GET /api/v1/properties -> {r.status_code}")
all_props = []
if r.ok:
    data = r.json()
    all_props = data.get("properties", data.get("data", []))
    print(f"  Total properties: {len(all_props)}")

# ── 3. Get provider's own properties ──────────────────────────────────────
print()
print("=" * 60)
print("STEP 3: Provider's own properties")
print("=" * 60)

r = requests.get(f"{ALB}/api/v1/properties/my", headers={"Authorization": f"Bearer {provider_token}"}, timeout=10)
print(f"  GET /api/v1/properties/my -> {r.status_code}")
my_props = []
if r.ok:
    data = r.json()
    my_props = data.get("properties", data.get("data", []))
    print(f"  Provider owns {len(my_props)} properties:")
    for p in my_props:
        pid = p.get("property_id", "?")
        title = p.get("title", "?")
        status = p.get("status", "?")
        posa = p.get("posa_code", "")
        print(f"    [{status}] {pid[:8]}... | {title[:45]} | POSA: {posa or 'none'}")
else:
    print(f"  ERROR: {r.text[:200]}")

# ── 4. Check each public property for provider_id ─────────────────────────
print()
print("=" * 60)
print("STEP 4: Property-Provider linkage audit (all public properties)")
print("=" * 60)

orphaned = []
linked = []
for p in all_props:
    pid = p.get("property_id", "?")
    provider = p.get("provider_id") or p.get("user_id")
    title = p.get("title", "?")
    status = p.get("status", "?")
    if not provider:
        orphaned.append(p)
        print(f"  ⚠ ORPHANED: {pid[:8]}... | {title[:45]} | status={status}")
    else:
        linked.append(p)

print(f"\n  Summary: {len(linked)} linked, {len(orphaned)} orphaned")

# ── 5. Get individual property details to check provider_id ───────────────
print()
print("=" * 60)
print("STEP 5: Fetch individual property details for first 10")
print("=" * 60)

for p in all_props[:10]:
    pid = p.get("property_id", "?")
    r2 = requests.get(f"{ALB}/api/v1/properties/{pid}", timeout=10)
    if r2.ok:
        detail = r2.json().get("property", r2.json())
        prov = detail.get("provider_id") or detail.get("user_id") or detail.get("provider", {}).get("user_id")
        title = detail.get("title", "?")
        status = detail.get("status", "?")
        nsfas = detail.get("nsfas_accredited", False)
        print(f"  {pid[:8]}... | provider={str(prov)[:8] if prov else 'MISSING'} | [{status}] | nsfas={nsfas} | {title[:40]}")
    else:
        print(f"  {pid[:8]}... -> {r2.status_code}")

# ── 6. Login as demo student ───────────────────────────────────────────────
print()
print("=" * 60)
print("STEP 6: Student login and profile check")
print("=" * 60)

r = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "thandeka.dlamini@student.digzio.co.za",
    "password": "Student1234!"
}, timeout=10)
print(f"  Student login -> {r.status_code}")
student_token = None
student_id = None
if r.ok:
    student_token = r.json().get("token") or r.json().get("access_token")
    student_user = r.json().get("user", {})
    student_id = student_user.get("user_id") or student_user.get("id")
    print(f"  Student ID: {student_id}")
    print(f"  Student name: {student_user.get('first_name')} {student_user.get('last_name')}")
    print(f"  Role: {student_user.get('role')}")
else:
    print(f"  ERROR: {r.text[:200]}")

# ── 7. Check student's applications ───────────────────────────────────────
if student_token:
    print()
    print("=" * 60)
    print("STEP 7: Student applications")
    print("=" * 60)

    r = requests.get(f"{ALB}/api/v1/applications/my",
                     headers={"Authorization": f"Bearer {student_token}"}, timeout=10)
    print(f"  GET /api/v1/applications/my -> {r.status_code}")
    if r.ok:
        apps = r.json().get("applications", r.json().get("data", []))
        print(f"  Student has {len(apps)} applications:")
        for a in apps:
            app_id = a.get("application_id", "?")
            prop_id = a.get("property_id", "?")
            status = a.get("status", "?")
            prop_title = a.get("property_title") or a.get("property", {}).get("title", "?")
            print(f"    [{status}] app={app_id[:8]}... | prop={prop_id[:8]}... | {prop_title[:40]}")
    else:
        print(f"  ERROR: {r.text[:200]}")

# ── 8. Check provider's applications ──────────────────────────────────────
print()
print("=" * 60)
print("STEP 8: Provider applications (all incoming)")
print("=" * 60)

r = requests.get(f"{ALB}/api/v1/applications/provider",
                 headers={"Authorization": f"Bearer {provider_token}"}, timeout=10)
print(f"  GET /api/v1/applications/provider -> {r.status_code}")
if r.ok:
    apps = r.json().get("applications", r.json().get("data", []))
    print(f"  Provider has {len(apps)} incoming applications:")
    for a in apps[:10]:
        app_id = a.get("application_id", "?")
        prop_id = a.get("property_id", "?")
        status = a.get("status", "?")
        student_name = f"{a.get('first_name','')} {a.get('last_name','')}".strip() or "?"
        prop_title = a.get("property_title") or a.get("property", {}).get("title", "?")
        print(f"    [{status}] {student_name} -> {prop_title[:35]} | app={app_id[:8]}...")
else:
    print(f"  ERROR: {r.text[:200]}")

print()
print("=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)
