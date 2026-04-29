import requests, json

BASE = "https://www.digzio.co.za/api/v1"

# Login as provider
prov = requests.post(f"{BASE}/auth/login", json={"email":"demo.provider@digzio.co.za","password":"Demo1234!"})
print("Provider login:", prov.status_code, prov.text[:100])
prov_data = prov.json()
if "token" not in prov_data:
    print("Provider login failed:", prov_data)
    exit(1)
prov_token = prov_data["token"]

# Get provider applications
apps_r = requests.get(f"{BASE}/applications/provider", headers={"Authorization": f"Bearer {prov_token}"})
print("Provider apps status:", apps_r.status_code)
apps = apps_r.json()
if not isinstance(apps, list):
    print("Unexpected apps response:", apps)
    exit(1)
print(f"Provider sees {len(apps)} applications")

# List all apps
for a in apps:
    print(f"  {a.get('student_name','?')} | {a.get('property_title','?')} | {a.get('status','?')} | id={str(a.get('id','?'))[:8]}")

# Find Thandeka's Siwedi Braamfontein application
thandeka_app = None
for a in apps:
    name = (a.get("student_name","") or "").lower()
    prop = (a.get("property_title","") or "")
    if "thandeka" in name and "Braamfontein" in prop:
        thandeka_app = a
        break

if not thandeka_app:
    print("\nThandeka Braamfontein app not found")
    exit(1)

app_id = thandeka_app["id"]
print(f"\nFound Thandeka's Braamfontein app: {app_id[:8]} status={thandeka_app['status']}")

# Step 1: PENDING_NSFAS
r1 = requests.patch(f"{BASE}/applications/{app_id}/status",
    json={"status": "PENDING_NSFAS"},
    headers={"Authorization": f"Bearer {prov_token}"})
print(f"Step 1 PENDING_NSFAS: {r1.status_code} -> {r1.json().get('status','?')}")

# Step 2: APPROVED
r2 = requests.patch(f"{BASE}/applications/{app_id}/status",
    json={"status": "APPROVED"},
    headers={"Authorization": f"Bearer {prov_token}"})
print(f"Step 2 APPROVED: {r2.status_code} -> {r2.json().get('status','?')}")

# Now check student side
stud = requests.post(f"{BASE}/auth/login", json={"email":"thandeka.dlamini@student.uj.ac.za","password":"Demo1234!"})
stud_data = stud.json()
if "token" not in stud_data:
    print("Student login failed:", stud_data)
    exit(1)
stud_token = stud_data["token"]

stud_apps_r = requests.get(f"{BASE}/applications/my", headers={"Authorization": f"Bearer {stud_token}"})
stud_apps_data = stud_apps_r.json()
stud_list = stud_apps_data.get("applications", stud_apps_data) if isinstance(stud_apps_data, dict) else stud_apps_data
print(f"\nStudent sees {len(stud_list)} applications:")
for a in stud_list:
    print(f"  status={a.get('status')} | property={a.get('property_title','?')}")
