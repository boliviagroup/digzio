import requests, json

BASE = "https://www.digzio.co.za/api/v1"

# Login
r = requests.post(f"{BASE}/auth/login", json={"email":"thandeka.dlamini@student.uj.ac.za","password":"Demo1234!"})
print("Login response:", r.status_code, r.text[:200])
data = r.json()
if isinstance(data, dict):
    token = data.get("token")
else:
    print("Unexpected login response:", data)
    exit(1)

print(f"Token: {token[:30]}...")

# Get applications
r2 = requests.get(f"{BASE}/applications/student", headers={"Authorization": f"Bearer {token}"})
print("Applications response:", r2.status_code, r2.text[:500])
apps = r2.json()
if isinstance(apps, list):
    print(f"\nTotal applications: {len(apps)}")
    for a in apps:
        print(f"  status={a.get('status')} | property={a.get('property_title','?')} | id={str(a.get('id','?'))[:8]}")
else:
    print("Unexpected apps response:", apps)
