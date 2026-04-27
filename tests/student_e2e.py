#!/usr/bin/env python3
"""
Digzio Student Module — End-to-End Test Suite
Tests the complete student journey against the live platform at https://www.digzio.co.za
"""

import requests
import json
import random
import string
import time

BASE_URL = "https://www.digzio.co.za/api/v1"
rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
STUDENT_EMAIL = f"test.student.{rand}@digzio.co.za"
STUDENT_PASS = "Student1234!"

results = []
token = None
student_id = None
property_id = None
application_id = None

def check(name, ok, detail=""):
    status = "✅ PASS" if ok else "❌ FAIL"
    results.append((name, ok, detail))
    print(f"  {status}  {name}")
    if detail and not ok:
        print(f"           → {detail}")
    return ok

def post(path, data, auth=False):
    headers = {"Content-Type": "application/json"}
    if auth and token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.post(f"{BASE_URL}{path}", json=data, headers=headers, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

def get(path, auth=False, params=None):
    headers = {}
    if auth and token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.get(f"{BASE_URL}{path}", headers=headers, params=params, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

def patch(path, data, auth=False):
    headers = {"Content-Type": "application/json"}
    if auth and token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.patch(f"{BASE_URL}{path}", json=data, headers=headers, timeout=15)
        return r.status_code, r.json() if r.content else {}
    except Exception as e:
        return 0, {"error": str(e)}

print("=" * 60)
print("  DIGZIO STUDENT MODULE — E2E TEST SUITE")
print(f"  Target: {BASE_URL}")
print(f"  Student: {STUDENT_EMAIL}")
print("=" * 60)

# ─── TEST 1: Student Registration ───────────────────────────
print("\n[1] Student Registration")
code, body = post("/auth/register", {
    "first_name": "Test",
    "last_name": "Student",
    "email": STUDENT_EMAIL,
    "password": STUDENT_PASS,
    "phone_number": f"+2761{random.randint(1000000,9999999)}",
    "role": "student"
})
ok = code == 201 and "token" in body
token = body.get("token")
student_id = body.get("user", {}).get("user_id")
check("Register new student account", ok, body.get("error", ""))

# ─── TEST 2: Student Login ───────────────────────────────────
print("\n[2] Student Login")
code, body = post("/auth/login", {
    "email": STUDENT_EMAIL,
    "password": STUDENT_PASS
})
ok = code == 200 and "token" in body
if ok:
    token = body.get("token")
check("Login with student credentials", ok, body.get("error", ""))

# ─── TEST 3: Get Student Profile ─────────────────────────────
print("\n[3] Student Profile")
code, body = get("/auth/me", auth=True)
ok = code == 200 and body.get("email") == STUDENT_EMAIL
check("Fetch authenticated student profile", ok, body.get("error", str(body)[:100]))
role = body.get("role", "")
check("Profile has STUDENT role", role.upper() == "STUDENT", f"Got role: {role}")

# ─── TEST 4: KYC Submission ──────────────────────────────────
print("\n[4] KYC Verification")
code, body = post("/kyc/submit", {
    "id_number": f"990{random.randint(1000000,9999999)}",
    "id_type": "south_african_id",
    "first_name": "Test",
    "last_name": "Student",
    "date_of_birth": "1999-01-15",
    "nsfas_status": "funded"
}, auth=True)
ok = code in [200, 201] and ("kyc" in body or "status" in body or "message" in body)
check("Submit KYC identity verification", ok, body.get("error", str(body)[:100]))

# ─── TEST 5: Search Properties ───────────────────────────────
print("\n[5] Property Search")
code, body = get("/properties", params={
    "lat": -33.9576,
    "lng": 18.4615,
    "radius": 10,
    "limit": 5
})
ok = code == 200 and ("properties" in body or isinstance(body, list))
props = body.get("properties", body) if isinstance(body, dict) else body
check("Search properties near UCT campus", ok, body.get("error", ""))
has_results = isinstance(props, list) and len(props) > 0
check("Search returns at least one property", has_results, f"Got {len(props) if isinstance(props, list) else 0} results")
if has_results:
    property_id = props[0].get("id") or props[0].get("property_id")

# ─── TEST 6: Get Property Details ────────────────────────────
print("\n[6] Property Details")
if property_id:
    code, body = get(f"/properties/{property_id}")
    ok = code == 200 and ("id" in body or "property_id" in body or "title" in body)
    check("Fetch individual property details", ok, body.get("error", ""))
    check("Property has rent amount", "base_price_monthly" in body or "rent_amount" in body or "price" in body, str(list(body.keys()))[:80])
else:
    check("Fetch individual property details", False, "No property_id available from search")
    check("Property has rent amount", False, "Skipped")

# ─── TEST 7: Submit Application ──────────────────────────────
print("\n[7] Rental Application")
if property_id:
    code, body = post("/applications", {
        "property_id": property_id,
        "desired_move_in_date": "2026-06-01",
        "lease_term_months": 12,
        "message": "I am a verified student looking for accommodation near campus."
    }, auth=True)
    ok = code in [200, 201] and ("id" in body or "application_id" in body or "application" in body)
    app = body.get("application", body)
    application_id = app.get("id") or app.get("application_id")
    check("Submit rental application for property", ok, body.get("error", str(body)[:100]))
else:
    check("Submit rental application for property", False, "No property_id available")

# ─── TEST 8: View My Applications ────────────────────────────
print("\n[8] Application History")
code, body = get("/applications/my", auth=True)
ok = code == 200 and ("applications" in body or isinstance(body, list))
apps = body.get("applications", body) if isinstance(body, dict) else body
check("Fetch student's application history", ok, body.get("error", ""))
check("Application history is not empty", isinstance(apps, list) and len(apps) > 0, f"Got {len(apps) if isinstance(apps, list) else 0} applications")

# ─── TEST 9: Token Refresh ───────────────────────────────────
print("\n[9] Token Management")
# Get the refresh token from a fresh login
code2, body2 = post("/auth/login", {"email": STUDENT_EMAIL, "password": STUDENT_PASS})
refresh_token = body2.get("refresh_token", "")
if refresh_token:
    headers_r = {"Content-Type": "application/json"}
    try:
        import requests as _req
        r = _req.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token}, headers=headers_r, timeout=15)
        code, body = r.status_code, r.json() if r.content else {}
    except Exception as e:
        code, body = 0, {"error": str(e)}
else:
    code, body = 0, {"error": "No refresh token returned from login"}
ok = code in [200, 201] and "token" in body
check("Refresh authentication token", ok, body.get("error", str(body)[:80]))

# ─── TEST 10: Invalid Access Control ─────────────────────────
print("\n[10] Security & Access Control")
code, body = get("/applications/my", auth=False)
ok = code in [401, 403]
check("Unauthenticated request correctly rejected", ok, f"Got HTTP {code}")

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
print(f"\n  Student Email: {STUDENT_EMAIL}")
print(f"  Student Password: {STUDENT_PASS}")
if property_id:
    print(f"  Test Property ID: {property_id}")
if application_id:
    print(f"  Test Application ID: {application_id}")
print()
