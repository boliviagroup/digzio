import requests, json

BASE = 'https://www.digzio.co.za'
ALB = 'http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com'

# Login as provider
print("Logging in as provider...")
r = requests.post(f'{BASE}/api/v1/auth/login', json={
    'email': 'demo.provider@digzio.co.za',
    'password': 'Demo1234!'
})
if r.status_code != 200:
    print("Provider login failed:", r.status_code, r.text[:200])
    exit(1)
provider_token = r.json()['token']
print(f"Provider logged in OK")

# Get provider applications
r = requests.get(f'{BASE}/api/v1/applications/provider',
    headers={'Authorization': f'Bearer {provider_token}'})
apps = r.json().get('applications', [])
print(f"Found {len(apps)} applications")

# Find a SUBMITTED application from a real student (not Demo Student)
target = None
for a in apps:
    if a['status'] == 'SUBMITTED' and 'thandeka' in a.get('student_email','').lower():
        target = a
        break

if not target:
    # Fall back to any SUBMITTED application
    for a in apps:
        if a['status'] == 'SUBMITTED':
            target = a
            break

if not target:
    print("No SUBMITTED applications found to test with")
    exit(1)

print(f"\nTarget application:")
print(f"  ID: {target['application_id']}")
print(f"  Student: {target['first_name']} {target['last_name']} ({target['student_email']})")
print(f"  Property: {target['property_title']}")
print(f"  Status: {target['status']}")

# Step 1: Advance to PENDING_NSFAS (triggers NSFAS email)
print(f"\nStep 1: Advancing to PENDING_NSFAS (triggers NSFAS email)...")
r = requests.patch(f'{BASE}/api/v1/applications/{target["application_id"]}/status',
    headers={'Authorization': f'Bearer {provider_token}'},
    json={'status': 'PENDING_NSFAS', 'provider_notes': 'NSFAS verification in progress'})
print(f"  Response: {r.status_code} - {r.json().get('status','?')}")

# Step 2: Advance to APPROVED (triggers Approved email)
print(f"\nStep 2: Advancing to APPROVED (triggers Approval email)...")
r = requests.patch(f'{BASE}/api/v1/applications/{target["application_id"]}/status',
    headers={'Authorization': f'Bearer {provider_token}'},
    json={'status': 'APPROVED'})
print(f"  Response: {r.status_code} - {r.json().get('status','?')}")

# Check the CloudWatch logs for the email sends
print("\nChecking application-service logs for email sends...")
import subprocess, time
time.sleep(3)

# Get the latest log stream
result = subprocess.run([
    'aws', 'logs', 'describe-log-streams',
    '--log-group-name', '/ecs/digzio-prod',
    '--log-stream-name-prefix', 'application-service/',
    '--order-by', 'LastEventTime',
    '--descending',
    '--max-items', '3',
    '--region', 'af-south-1'
], capture_output=True, text=True)

streams = json.loads(result.stdout).get('logStreams', [])
if not streams:
    print("No log streams found for application-service")
else:
    stream = streams[0]['logStreamName']
    print(f"Checking log stream: {stream}")
    
    log_result = subprocess.run([
        'aws', 'logs', 'get-log-events',
        '--log-group-name', '/ecs/digzio-prod',
        '--log-stream-name', stream,
        '--limit', '30',
        '--region', 'af-south-1'
    ], capture_output=True, text=True)
    
    events = json.loads(log_result.stdout).get('events', [])
    for e in events[-20:]:
        msg = e.get('message', '').strip()
        if any(kw in msg.lower() for kw in ['email', 'patch', 'notif', 'approved', 'nsfas', 'sent', 'error']):
            print(f"  LOG: {msg[:150]}")

print("\nDone. Check student inbox for emails.")
