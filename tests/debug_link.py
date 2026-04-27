#!/usr/bin/env python3
import requests

BASE_URL = "https://www.digzio.co.za/api/v1"

# Login as demo student
r = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "demo.student@digzio.co.za",
    "password": "Demo1234!"
})
print(f"Login: {r.status_code} {r.json()}")
token = r.json().get("token")

# Try linking
r2 = requests.post(f"{BASE_URL}/institutions/students/link",
    json={
        "institution_id": "f55e38a8-73f7-4a29-8a9e-a00edb72813a",
        "student_number": "STU999001"
    },
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)
print(f"Link: {r2.status_code}")
print(f"Response: {r2.text}")
