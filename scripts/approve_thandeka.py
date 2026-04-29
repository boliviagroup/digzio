import requests, json

BASE = "https://www.digzio.co.za/api/v1"

# Login as provider
prov = requests.post(f"{BASE}/auth/login", json={"email":"demo.provider@digzio.co.za","password":"Demo1234!"})
prov_token = prov.json()["token"]
print(f"Provider logged in OK")

# Get provider applications - handle both list and dict response
apps_r = requests.get(f"{BASE}/applications/provider", headers={"Authorization": f"Bearer {prov_token}"})
apps_data = apps_r.json()
apps = apps_data if isinstance(apps_data, list) else apps_data.get("applications", [])
print(f"Provider sees {len(apps)} applications")

# Find Thandeka's Braamfontein app
thandeka_braam = None
for a in apps:
    fname = (a.get("first_name","") or "").lower()
    lname = (a.get("last_name","") or "").lower()
    prop = (a.get("property_title","") or "")
    if ("thandeka" in fname or "dlamini" in lname) and "Braamfontein" in prop:
        thandeka_braam = a
        break

if not thandeka_braam:
    print("Could not find Thandeka Braamfontein app. All apps:")
    for a in apps:
        print(f"  {a.get('first_name','')} {a.get('last_name','')} | {a.get('property_title','')} | {a.get('status','')} | id={str(a.get('application_id','?'))[:8]}")
    exit(1)

# Use application_id (not id)
app_id = thandeka_braam.get("application_id") or thandeka_braam.get("id")
print(f"\nThandeka's Braamfontein app: {app_id[:8]} | current status: {thandeka_braam.get('status')}")

# Step 1: PENDING_NSFAS
r1 = requests.patch(f"{BASE}/applications/{app_id}/status",
    json={"status": "PENDING_NSFAS"},
    headers={"Authorization": f"Bearer {prov_token}"})
print(f"Step 1 → PENDING_NSFAS: HTTP {r1.status_code} | new status: {r1.json().get('status','?')}")

# Step 2: APPROVED
r2 = requests.patch(f"{BASE}/applications/{app_id}/status",
    json={"status": "APPROVED"},
    headers={"Authorization": f"Bearer {prov_token}"})
print(f"Step 2 → APPROVED: HTTP {r2.status_code} | new status: {r2.json().get('status','?')}")

# Now check student side
stud = requests.post(f"{BASE}/auth/login", json={"email":"thandeka.dlamini@student.uj.ac.za","password":"Demo1234!"})
stud_token = stud.json()["token"]
stud_apps_r = requests.get(f"{BASE}/applications/my", headers={"Authorization": f"Bearer {stud_token}"})
stud_data = stud_apps_r.json()
stud_list = stud_data.get("applications", stud_data) if isinstance(stud_data, dict) else stud_data

print(f"\nStudent dashboard now shows {len(stud_list)} applications:")
for a in stud_list:
    status = a.get("status","?")
    prop = a.get("property_title","?")
    marker = " ✅ APPROVED" if status == "APPROVED" else ""
    print(f"  {status} | {prop}{marker}")
