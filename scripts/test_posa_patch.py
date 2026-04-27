#!/usr/bin/env python3.11
"""Test the POSA PATCH endpoint with the correct property ID."""
import requests
import json

BASE = "https://www.digzio.co.za/api/v1"

# Login as provider
r = requests.post(f"{BASE}/auth/login", json={
    "email": "demo.provider@digzio.co.za",
    "password": "Demo1234!"
})
print(f"Login: {r.status_code}")
data = r.json()
token = data.get("token", "")
print(f"Token: {token[:30]}...")

# Get properties
r = requests.get(f"{BASE}/properties/my", headers={"Authorization": f"Bearer {token}"})
print(f"Properties: {r.status_code} - {r.text[:200]}")
data2 = r.json()
# Handle both array and {properties: [...]} formats
if isinstance(data2, list):
    props = data2
else:
    props = data2.get("properties", [])
if not props:
    print("No properties found!")
    exit(1)

prop_id = props[0].get("id") or props[0].get("property_id")
prop_name = props[0].get("name") or props[0].get("title", "Unknown")
print(f"Property: {prop_name} (ID: {prop_id})")

# Test POSA PATCH
r = requests.patch(
    f"{BASE}/institutions/posa/property/{prop_id}",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"posa_code": "1233", "posa_institution": "Siwedi & Associates Pinmill"}
)
print(f"POSA PATCH: {r.status_code} - {r.text[:300]}")

# Test POSA generate
r = requests.get(
    f"{BASE}/institutions/posa/generate?property_id={prop_id}&month=2026-04",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"POSA Generate: {r.status_code} - {r.text[:300]}")

# Test provider-students
r = requests.get(
    f"{BASE}/institutions/posa/provider-students?property_id={prop_id}",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Provider Students: {r.status_code} - {r.text[:300]}")
