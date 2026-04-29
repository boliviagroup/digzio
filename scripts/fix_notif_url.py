import json, subprocess, sys

REGION = 'af-south-1'
CLUSTER = 'digzio-cluster-prod'
SERVICE = 'digzio-application-service-prod'
TASK_DEF = 'digzio-application-service-prod:8'
ALB_URL = 'http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com'

# Get current task definition
result = subprocess.run(
    ['aws', 'ecs', 'describe-task-definition', '--task-definition', TASK_DEF, '--region', REGION],
    capture_output=True, text=True
)
td = json.loads(result.stdout)['taskDefinition']

# Remove read-only fields
for field in ['taskDefinitionArn', 'revision', 'status', 'requiresAttributes',
              'compatibilities', 'registeredAt', 'registeredBy', 'deregisteredAt']:
    td.pop(field, None)

# Update NOTIFICATION_SERVICE_URL in the container environment
for c in td['containerDefinitions']:
    env = c.get('environment', [])
    updated = False
    for e in env:
        if e['name'] == 'NOTIFICATION_SERVICE_URL':
            e['value'] = ALB_URL
            updated = True
            print(f"Updated NOTIFICATION_SERVICE_URL to: {ALB_URL}")
    if not updated:
        env.append({'name': 'NOTIFICATION_SERVICE_URL', 'value': ALB_URL})
        c['environment'] = env
        print(f"Added NOTIFICATION_SERVICE_URL: {ALB_URL}")

# Register new task definition
with open('/tmp/appservice_notif_fix.json', 'w') as f:
    json.dump(td, f)

reg = subprocess.run(
    ['aws', 'ecs', 'register-task-definition',
     '--cli-input-json', 'file:///tmp/appservice_notif_fix.json',
     '--region', REGION],
    capture_output=True, text=True
)
if reg.returncode != 0:
    print("ERROR:", reg.stderr[:500])
    sys.exit(1)

new_td = json.loads(reg.stdout)['taskDefinition']
new_arn = new_td['taskDefinitionArn']
new_rev = new_td['revision']
print(f"Registered revision {new_rev}: {new_arn}")

# Update ECS service
update = subprocess.run(
    ['aws', 'ecs', 'update-service',
     '--cluster', CLUSTER,
     '--service', SERVICE,
     '--task-definition', new_arn,
     '--force-new-deployment',
     '--region', REGION],
    capture_output=True, text=True
)
if update.returncode != 0:
    print("ECS update ERROR:", update.stderr[:300])
    sys.exit(1)

svc = json.loads(update.stdout)['service']
d = svc['deployments'][0]
print(f"ECS updated: desired={svc['desiredCount']}, running={svc['runningCount']}")
print(f"Deployment: {d['status']} - {d['desiredCount']} tasks - taskDef: {d['taskDefinition'].split('/')[-1]}")
