"""
Digzio Property Bulk Activator
Fetches all properties with status=DRAFT and activates them via PATCH endpoint.
"""
import requests, time, json
import urllib3
urllib3.disable_warnings()

BASE_URL = "https://www.digzio.co.za"
AUTH_URL = f"{BASE_URL}/api/v1/auth"
PROP_URL = f"{BASE_URL}/api/v1/properties"
DEFAULT_PASSWORD = "Provider@2026!"

PROVIDERS = [
    {"name": "Cape Student Residences",          "email": "info@capestudentres.co.za"},
    {"name": "Roomza Demo Provider",             "email": "provider@roomza.co.za"},
    {"name": "Gauteng Student Housing",          "email": "admin@gautenghousing.co.za"},
    {"name": "Stellenbosch Accommodation Group", "email": "bookings@stellaccgroup.co.za"},
]

def login(email):
    try:
        resp = requests.post(f"{AUTH_URL}/login",
                             json={"email": email, "password": DEFAULT_PASSWORD},
                             timeout=15, verify=False)
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("token") or data.get("data", {}).get("token")
            if token:
                print(f"  LOGIN OK: {email}", flush=True)
                return token
        print(f"  LOGIN FAILED {resp.status_code}: {email}", flush=True)
    except Exception as e:
        print(f"  LOGIN ERROR: {email} - {e}", flush=True)
    return None

def get_provider_properties(token):
    """Get all properties for this provider (includes DRAFT ones)"""
    try:
        resp = requests.get(f"{PROP_URL}/my",
                           headers={"Authorization": f"Bearer {token}"},
                           timeout=20, verify=False)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("properties", data.get("data", []))
    except Exception as e:
        print(f"  ERROR fetching properties: {e}", flush=True)
    return []

def activate_property(token, property_id, prop_name):
    """Activate a single property via PATCH"""
    try:
        resp = requests.patch(
            f"{PROP_URL}/{property_id}",
            json={"status": "ACTIVE"},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=15, verify=False
        )
        return resp.status_code
    except Exception as e:
        print(f"  ERROR activating {prop_name}: {e}", flush=True)
        return 0

def main():
    print("=== DIGZIO PROPERTY BULK ACTIVATOR ===", flush=True)
    
    # Login all providers
    provider_tokens = []
    for p in PROVIDERS:
        token = login(p["email"])
        if token:
            provider_tokens.append({"email": p["email"], "token": token})
    
    if not provider_tokens:
        print("ERROR: No providers logged in.", flush=True)
        return
    
    total_activated = 0
    total_already_active = 0
    total_errors = 0
    
    for prov in provider_tokens:
        print(f"\nProcessing provider: {prov['email']}", flush=True)
        props = get_provider_properties(prov["token"])
        print(f"  Found {len(props)} properties", flush=True)
        
        draft_props = [p for p in props if p.get("status") == "DRAFT"]
        print(f"  DRAFT properties: {len(draft_props)}", flush=True)
        
        for i, prop in enumerate(draft_props):
            pid = prop.get("property_id")
            pname = prop.get("title", "unknown")
            
            status = activate_property(prov["token"], pid, pname)
            
            if status == 200:
                total_activated += 1
                if (i + 1) % 10 == 0:
                    print(f"  Activated {i+1}/{len(draft_props)} for {prov['email']}", flush=True)
            elif status == 429:
                print(f"  Rate limited. Waiting 60s...", flush=True)
                time.sleep(60)
                # Retry
                status = activate_property(prov["token"], pid, pname)
                if status == 200:
                    total_activated += 1
                else:
                    total_errors += 1
            else:
                total_errors += 1
                print(f"  ERROR [{status}]: {pname}", flush=True)
            
            time.sleep(0.5)  # 0.5s between activations (PATCH is cheaper)
    
    print(f"\n=== ACTIVATION COMPLETE ===", flush=True)
    print(f"  Activated: {total_activated}", flush=True)
    print(f"  Errors:    {total_errors}", flush=True)

if __name__ == "__main__":
    main()
