#!/usr/bin/env python3
"""
Digzio Institution Module — End-to-End Test Suite
Tests the complete institution journey against the live platform at https://www.digzio.co.za
"""

import requests
import json
import random
import string

BASE_URL = "https://www.digzio.co.za/api/v1"
rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
INSTITUTION_EMAIL = f"test.institution.{rand}@digzio.co.za"
INSTITUTION_PASS = "Institution1234!"
STUDENT_EMAIL = f"test.student.inst.{rand}@digzio.co.za"
STUDENT_PASS = "Student1234!"
PROVIDER_EMAIL = f"test.provider.inst.{rand}@digzio.co.za"
PROVIDER_PASS = "Provider1234!"

results = []
institution_token = None
student_token = None
provider_token = None
institution_id = None
student_id = None
property_id = None

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
print("  DIGZIO INSTITUTION MODULE — E2E TEST SUITE")
print(f"  Target: {BASE_URL}")
print(f"  Institution: {INSTITUTION_EMAIL}")
print("=" * 60)

# ─── TEST 1: Institution Registration ───────────────────────
print("\n[1] Institution Registration")
code, body = post("/auth/register", {
    "first_name": "Test",
    "last_name": "Institution",
    "email": INSTITUTION_EMAIL,
    "password": INSTITUTION_PASS,
    "phone_number": f"+2711{random.randint(1000000,9999999)}",
    "role": "institution"
})
ok = code == 201 and "token" in body
institution_token = body.get("token")
check("Register new institution account", ok, body.get("error", str(body)[:100]))

# ─── TEST 2: Institution Login ───────────────────────────────
print("\n[2] Institution Login")
code, body = post("/auth/login", {
    "email": INSTITUTION_EMAIL,
    "password": INSTITUTION_PASS
})
ok = code == 200 and "token" in body
if ok:
    institution_token = body.get("token")
check("Login with institution credentials", ok, body.get("error", ""))

# ─── TEST 3: Institution Profile ─────────────────────────────
print("\n[3] Institution Profile")
code, body = get("/auth/me", token=institution_token)
ok = code == 200 and body.get("email") == INSTITUTION_EMAIL
check("Fetch authenticated institution profile", ok, body.get("error", str(body)[:100]))
role = body.get("role", "")
check("Profile has INSTITUTION role", role.upper() == "INSTITUTION", f"Got role: {role}")

# ─── TEST 4: Register Institution Details ────────────────────
print("\n[4] Institution Registration Details")
code, body = post("/institutions/register", {
    "name": f"Test University {rand}",
    "type": "university",
    "city": "Cape Town",
    "province": "Western Cape",
    "address": "1 University Avenue, Rondebosch, Cape Town",
    "contact_email": INSTITUTION_EMAIL,
    "contact_phone": f"+2721{random.randint(1000000,9999999)}"
}, token=institution_token)
inst = body.get("institution", body)
ok = code in [200, 201] and ("institution_id" in inst or "id" in inst or "name" in inst)
institution_id = inst.get("institution_id") or inst.get("id") or body.get("institution_id") or body.get("id")
check("Register institution details", ok, body.get("error", str(body)[:100]))
check("Institution registration returns an ID", bool(institution_id), f"Body keys: {list(body.keys())[:6]}")

# ─── TEST 5: List All Institutions ───────────────────────────
print("\n[5] Institution Directory")
code, body = get("/institutions")
ok = code == 200 and ("institutions" in body or isinstance(body, list))
institutions = body.get("institutions", body) if isinstance(body, dict) else body
check("Fetch public institution directory", ok, body.get("error", ""))
check("Directory contains at least one institution", isinstance(institutions, list) and len(institutions) > 0,
      f"Got {len(institutions) if isinstance(institutions, list) else 0} institutions")

# ─── TEST 6: Get Institution by ID ───────────────────────────
print("\n[6] Institution Profile Lookup")
if institution_id:
    code, body = get(f"/institutions/{institution_id}")
    inst_data = body.get("institution", body)
    ok = code == 200 and ("institution_id" in inst_data or "id" in inst_data or "name" in inst_data)
    check("Fetch institution by ID", ok, body.get("error", str(body)[:100]))
else:
    # Try fetching first institution from directory
    if isinstance(institutions, list) and len(institutions) > 0:
        first_id = institutions[0].get("institution_id") or institutions[0].get("id")
        code, body = get(f"/institutions/{first_id}")
        ok = code == 200
        check("Fetch institution by ID", ok, body.get("error", str(body)[:100]))
    else:
        check("Fetch institution by ID", False, "No institution_id available")

# ─── TEST 7: Student Links to Institution ────────────────────
print("\n[7] Student-Institution Linking")
# Register a student
code, body = post("/auth/register", {
    "first_name": "Linked",
    "last_name": "Student",
    "email": STUDENT_EMAIL,
    "password": STUDENT_PASS,
    "phone_number": f"+2761{random.randint(1000000,9999999)}",
    "role": "student"
})
student_token = body.get("token")
student_id = body.get("user", {}).get("user_id")

if student_token and institution_id:
    code, body = post("/institutions/students/link", {
        "institution_id": institution_id,
        "student_number": f"STU{random.randint(100000,999999)}",
        "course": "BSc Computer Science",
        "year_of_study": 2,
        "nsfas_funded": True
    }, token=student_token)
    ok = code in [200, 201]
    check("Student links to institution", ok, body.get("error", str(body)[:100]))
else:
    check("Student links to institution", False, "Missing student token or institution_id")

# ─── TEST 8: Student Checks Their Institution Link ───────────
print("\n[8] Student Institution Status")
if student_token:
    code, body = get("/institutions/students/me", token=student_token)
    profile = body.get("profile", body)
    ok = code == 200 and ("institution_id" in profile or "institution" in profile or "student_number" in profile)
    check("Student views their institution link", ok, body.get("error", str(body)[:100]))
else:
    check("Student views their institution link", False, "No student token")

# ─── TEST 9: Institution Views Its Students ──────────────────
print("\n[9] Institution Student Management")
if institution_id and institution_token:
    code, body = get(f"/institutions/{institution_id}/students", token=institution_token)
    ok = code == 200 and ("students" in body or isinstance(body, list))
    students = body.get("students", body) if isinstance(body, dict) else body
    check("Institution views enrolled students", ok, body.get("error", str(body)[:100]))
    check("Student list is not empty", isinstance(students, list) and len(students) > 0,
          f"Got {len(students) if isinstance(students, list) else 0} students")
else:
    check("Institution views enrolled students", False, "No institution_id or token")
    check("Student list is not empty", False, "No institution_id or token")

# ─── TEST 10: Institution Views Nearby Properties ────────────
print("\n[10] Institution Property Accreditation")
if institution_id:
    code, body = get(f"/institutions/{institution_id}/properties")
    ok = code == 200 and ("properties" in body or isinstance(body, list))
    check("Institution views nearby accredited properties", ok, body.get("error", str(body)[:100]))
else:
    check("Institution views nearby accredited properties", False, "No institution_id")

# ─── TEST 11: KYC Submission by Student ──────────────────────
print("\n[11] Student KYC Verification")
if student_token:
    code, body = post("/kyc/submit", {
        "id_number": f"{random.randint(8001010000000, 9912315999999)}",
        "id_type": "south_african_id",
        "first_name": "Linked",
        "last_name": "Student",
        "date_of_birth": "2000-05-15",
        "nsfas_reference": f"NSFAS{random.randint(100000,999999)}"
    }, token=student_token)
    ok = code in [200, 201] and ("kyc_id" in body or "status" in body or "message" in body)
    check("Student submits KYC verification", ok, body.get("error", str(body)[:100]))

    code, body = get("/kyc/status", token=student_token)
    ok = code == 200 and ("status" in body or "kyc_status" in body)
    check("Student KYC status is retrievable", ok, body.get("error", str(body)[:100]))
else:
    check("Student submits KYC verification", False, "No student token")
    check("Student KYC status is retrievable", False, "No student token")

# ─── TEST 12: Security — Student Cannot Access Institution Admin ─
print("\n[12] Security & Access Control")
if student_token and institution_id:
    code, body = get(f"/institutions/{institution_id}/students", token=student_token)
    ok = code in [401, 403]
    check("Student cannot access institution admin endpoints", ok,
          f"Got HTTP {code}: {body.get('error','')}")
else:
    check("Student cannot access institution admin endpoints", False, "Missing tokens")

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
print(f"\n  Institution Email:    {INSTITUTION_EMAIL}")
print(f"  Institution Password: {INSTITUTION_PASS}")
if institution_id:
    print(f"  Institution ID:       {institution_id}")
if student_id:
    print(f"  Linked Student ID:    {student_id}")
print()
