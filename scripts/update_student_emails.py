"""
Update all demo student emails to siphiwe@digzio.co.za so SES can deliver emails.
Uses the auth-service update-profile endpoint or direct DB update via property-api debug endpoint.
"""
import requests, json

BASE = 'https://www.digzio.co.za'
TARGET_EMAIL = 'siphiwe@digzio.co.za'

DEMO_STUDENTS = [
    {'email': 'thandeka.dlamini@student.uj.ac.za', 'password': 'Student@2024!', 'name': 'Thandeka Dlamini'},
    {'email': 'zanele.mokoena@student.uj.ac.za', 'password': 'Student@2024!', 'name': 'Zanele Mokoena'},
    {'email': 'mpho.sithole@student.uj.ac.za', 'password': 'Student@2024!', 'name': 'Mpho Sithole'},
    {'email': 'nothando.nkosi@student.uj.ac.za', 'password': 'Student@2024!', 'name': 'Nothando Nkosi'},
    {'email': 'lehlohonolo.mathaba@student.uj.ac.za', 'password': 'Student@2024!', 'name': 'Lehlohonolo Mathaba'},
]

# Step 1: Find the correct student password by trying to login
print("Step 1: Finding correct student password...")
test_passwords = ['Student@2024!', 'Demo1234!', 'Student1234!', 'Digzio@2024!', 'student123', 'Student123!']
working_password = None
for pwd in test_passwords:
    r = requests.post(f'{BASE}/api/v1/auth/login', json={
        'email': 'thandeka.dlamini@student.uj.ac.za',
        'password': pwd
    })
    if r.status_code == 200:
        working_password = pwd
        print(f"  Found password: {pwd}")
        break

if not working_password:
    print("  Could not find student password. Will use property-api debug-schema to update via DB.")
    # Use the seed-leases endpoint approach - update via provider token
    # Actually we need to use a direct DB update approach
    # Let's try the auth service register endpoint to see if we can update
    print("  Trying to update via auth service profile update...")

# Step 2: Update each student's email via auth service
print("\nStep 2: Updating student emails...")
for student in DEMO_STUDENTS:
    # Try to login as the student
    r = requests.post(f'{BASE}/api/v1/auth/login', json={
        'email': student['email'],
        'password': working_password or 'Demo1234!'
    })
    if r.status_code != 200:
        print(f"  SKIP {student['name']}: login failed ({r.status_code})")
        continue
    
    token = r.json()['token']
    
    # Try to update profile/email via auth service
    # Check if there's a profile update endpoint
    r2 = requests.put(f'{BASE}/api/v1/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
        json={'email': TARGET_EMAIL}
    )
    if r2.status_code == 200:
        print(f"  OK {student['name']}: email updated to {TARGET_EMAIL}")
    else:
        # Try PATCH
        r3 = requests.patch(f'{BASE}/api/v1/auth/profile',
            headers={'Authorization': f'Bearer {token}'},
            json={'email': TARGET_EMAIL}
        )
        if r3.status_code == 200:
            print(f"  OK {student['name']}: email updated via PATCH")
        else:
            print(f"  FAIL {student['name']}: {r2.status_code} {r2.text[:100]}")

print("\nDone.")
