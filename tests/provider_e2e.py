#!/usr/bin/env python3
"""
Digzio Provider Module — End-to-End Test Suite
Tests the complete provider journey against the live platform at https://www.digzio.co.za
"""

import requests
import json
import random
import string

BASE_URL = "https://www.digzio.co.za/api/v1"
rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
PROVIDER_EMAIL = f"test.provider.{rand}@digzio.co.za"
PROVIDER_PASS = "Provider1234!"
STUDENT_EMAIL = f"test.student.{rand}@digzio.co.za"
STUDENT_PASS = "Student1234!"

results = []
provider_token = None
student_token = None
provider_id = None
property_id = None
application_id = None

def check(name, ok, detail=""):
    status = "✅ PASS" if ok else "❌ FAIL"
    results.append((name, ok, detail))
    print(f"  {status}  {name}")
    if detail and not ok:
        print(f"           → {detail}")
    return ok

def post(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.post(f"{BASE_URL}{path}", json=data, headers=headers, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

def get(path, token=None, params=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.get(f"{BASE_URL}{path}", headers=headers, params=params, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

def patch(path, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.patch(f"{BASE_URL}{path}", json=data, headers=headers, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

print("=" * 60)
print("  DIGZIO PROVIDER MODULE — E2E TEST SUITE")
print(f"  Target: {BASE_URL}")
print(f"  Provider: {PROVIDER_EMAIL}")
print("=" * 60)

# ─── TEST 1: Provider Registration ──────────────────────────
print("\n[1] Provider Registration")
code, body = post("/auth/register", {
    "first_name": "Test",
    "last_name": "Provider",
    "email": PROVIDER_EMAIL,
    "password": PROVIDER_PASS,
    "phone_number": f"+2782{random.randint(1000000,9999999)}",
    "role": "provider"
})
ok = code == 201 and "token" in body
provider_token = body.get("token")
provider_id = body.get("user", {}).get("user_id")
check("Register new provider account", ok, body.get("error", ""))

# ─── TEST 2: Provider Login ──────────────────────────────────
print("\n[2] Provider Login")
code, body = post("/auth/login", {
    "email": PROVIDER_EMAIL,
    "password": PROVIDER_PASS
})
ok = code == 200 and "token" in body
if ok:
    provider_token = body.get("token")
check("Login with provider credentials", ok, body.get("error", ""))

# ─── TEST 3: Provider Profile ────────────────────────────────
print("\n[3] Provider Profile")
code, body = get("/auth/me", token=provider_token)
ok = code == 200 and body.get("email") == PROVIDER_EMAIL
check("Fetch authenticated provider profile", ok, body.get("error", str(body)[:100]))
role = body.get("role", "")
check("Profile has PROVIDER role", role.upper() == "PROVIDER", f"Got role: {role}")

# ─── TEST 4: Create Property Listing ────────────────────────
print("\n[4] Property Listing")
code, body = post("/properties", {
    "title": f"Test Studio Apartment {rand}",
    "description": "A well-maintained studio apartment close to UCT campus with secure parking and fibre internet.",
    "property_type": "apartment",
    "address_line_1": "15 De Waal Drive",
    "city": "Cape Town",
    "province": "Western Cape",
    "postal_code": "7700",
    "latitude": -33.9400,
    "longitude": 18.4600,
    "total_beds": 4,
    "available_beds": 2,
    "base_price_monthly": 6500,
    "deposit_amount": 6500,
    "is_nsfas_accredited": True,
    "available_from": "2026-06-01"
}, token=provider_token)
ok = code in [200, 201] and ("property_id" in body or "id" in body or "title" in body)
prop = body.get("property", body)
property_id = prop.get("property_id") or prop.get("id") or body.get("property_id") or body.get("id")
check("Create new property listing", ok, body.get("error", str(body)[:100]))
check("Property listing returns an ID", bool(property_id), f"Body keys: {list(body.keys())[:6]}")

# ─── TEST 5: Get My Properties ───────────────────────────────
print("\n[5] Provider Property Portfolio")
code, body = get("/properties/my", token=provider_token)
ok = code == 200 and ("properties" in body or isinstance(body, list))
props = body.get("properties", body) if isinstance(body, dict) else body
check("Fetch provider's own property listings", ok, body.get("error", ""))
check("Portfolio contains at least one property", isinstance(props, list) and len(props) > 0,
      f"Got {len(props) if isinstance(props, list) else 0} properties")

# ─── TEST 6: Update Property ─────────────────────────────────
print("\n[6] Property Management")
if property_id:
    code, body = patch(f"/properties/{property_id}", {
        "base_price_monthly": 6800,
        "description": "Updated: A well-maintained studio apartment close to UCT campus with secure parking, fibre internet and DSTV."
    }, token=provider_token)
    ok = code in [200, 201] and ("property_id" in body or "id" in body or "title" in body or "message" in body)
    check("Update property listing details", ok, body.get("error", str(body)[:100]))
else:
    check("Update property listing details", False, "No property_id available")

# ─── TEST 7: Student Creates Application ─────────────────────
print("\n[7] Incoming Applications")
# Activate the property first so students can apply
if property_id:
    patch(f"/properties/{property_id}", {"status": "ACTIVE"}, token=provider_token)

# Register a student
code, body = post("/auth/register", {
    "first_name": "Applicant",
    "last_name": "Student",
    "email": STUDENT_EMAIL,
    "password": STUDENT_PASS,
    "phone_number": f"+2761{random.randint(1000000,9999999)}",
    "role": "student"
})
student_token = body.get("token")

if student_token and property_id:
    code, body = post("/applications", {
        "property_id": property_id
    }, token=student_token)
    ok = code in [200, 201]
    application_id = body.get("application_id") or body.get("id")
    check("Student submits application to provider property", ok, body.get("error", str(body)[:100]))
else:
    check("Student submits application to provider property", False, "Missing student token or property_id")

# Provider views all incoming applications via /provider route
code, body = get("/applications/provider", token=provider_token)
ok = code == 200 and ("applications" in body or isinstance(body, list))
apps = body.get("applications", body) if isinstance(body, dict) else body
check("Provider views incoming applications for property", ok, body.get("error", ""))
# Grab application_id from provider view if not already set
if not application_id and isinstance(apps, list) and len(apps) > 0:
    application_id = apps[0].get("application_id") or apps[0].get("id")

# ─── TEST 8: Approve Application ─────────────────────────────
print("\n[8] Application Approval")
if application_id:
    code, body = patch(f"/applications/{application_id}/status", {
        "status": "APPROVED"
    }, token=provider_token)
    ok = code in [200, 201] and ("application_id" in body or "status" in body or "message" in body or "id" in body)
    check("Provider approves tenant application", ok, body.get("error", str(body)[:100]))
else:
    check("Provider approves tenant application", False, "No application_id available")

# ─── TEST 9: View All Provider Applications ──────────────────
print("\n[9] Application Dashboard")
code, body = get("/applications/provider", token=provider_token)
ok = code == 200 and ("applications" in body or isinstance(body, list))
apps = body.get("applications", body) if isinstance(body, dict) else body
check("Fetch all applications across provider portfolio", ok, body.get("error", ""))

# ─── TEST 10: Access Control — Student Cannot Create Property ─
print("\n[10] Security & Access Control")
code, body = post("/properties", {
    "title": "Unauthorized Property",
    "description": "Test unauthorized property creation attempt.",
    "property_type": "apartment",
    "address_line_1": "1 Test Street",
    "city": "Cape Town",
    "province": "Western Cape",
    "postal_code": "7700",
    "latitude": -33.9400,
    "longitude": 18.4600,
    "total_beds": 1,
    "available_beds": 1,
    "base_price_monthly": 5000,
    "is_nsfas_accredited": False
}, token=student_token)
ok = code in [401, 403]
check("Student cannot create a property listing", ok, f"Got HTTP {code}: {body.get('error','')}")

# ─── SUMMARY ─────────────────────────────────────────────────
print("\n" + "=" * 60)
passed = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f"  RESULTS: {passed}/{total} tests passed")
print("=" * 60)
for name, ok, detail in results:
    status = "✅" if ok else "❌"
    print(f"  {status}  {name}")
    if detail and not ok:
        print(f"       → {detail}")
print("=" * 60)
print(f"\n  Provider Email:    {PROVIDER_EMAIL}")
print(f"  Provider Password: {PROVIDER_PASS}")
if property_id:
    print(f"  Test Property ID:  {property_id}")
if application_id:
    print(f"  Test Application ID: {application_id}")
print()
