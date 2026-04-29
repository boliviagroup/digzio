import json, subprocess, sys

REGION = 'af-south-1'
CLUSTER = 'digzio-cluster-prod'
SERVICE = 'digzio-application-service'
TASK_DEF = 'digzio-application-service-prod:7'
NEW_COMMIT = 'd2abce4'
FILE_PATH = 'apps/application-service/src/routes/application.routes.js'
GITHUB_RAW = f'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_COMMIT}/{FILE_PATH}'

# Get current task definition
result = subprocess.run(
    ['aws', 'ecs', 'describe-task-definition', '--task-definition', TASK_DEF, '--region', REGION],
    capture_output=True, text=True
)
td = json.loads(result.stdout)['taskDefinition']

# Remove fields that can't be in register-task-definition
for field in ['taskDefinitionArn', 'revision', 'status', 'requiresAttributes',
              'compatibilities', 'registeredAt', 'registeredBy', 'deregisteredAt']:
    td.pop(field, None)

# Update the command in the container definition
for c in td['containerDefinitions']:
    if c.get('command'):
        new_cmd = (
            f"sh -c wget -q -O /app/src/routes/application.routes.js '{GITHUB_RAW}' "
            f"&& echo 'Patch applied: /app/src/routes/application.routes.js' "
            f"|| echo 'Patch failed, using original'; node src/index.js"
        )
        c['command'] = ['sh', '-c', new_cmd.replace("sh -c ", "")]
        print(f"Updated command to use commit {NEW_COMMIT}")

# Register new task definition
with open('/tmp/appservice_new_taskdef.json', 'w') as f:
    json.dump(td, f)

reg = subprocess.run(
    ['aws', 'ecs', 'register-task-definition', '--cli-input-json', f'file:///tmp/appservice_new_taskdef.json', '--region', REGION],
    capture_output=True, text=True
)
if reg.returncode != 0:
    print("ERROR:", reg.stderr[:500])
    sys.exit(1)

new_td = json.loads(reg.stdout)['taskDefinition']
new_arn = new_td['taskDefinitionArn']
new_rev = new_td['revision']
print(f"Registered new task definition: revision {new_rev}")
print(f"ARN: {new_arn}")

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
else:
    svc = json.loads(update.stdout)['service']
    print(f"ECS service updated: desired={svc['desiredCount']}, running={svc['runningCount']}")
    print(f"Deployment: {svc['deployments'][0]['status']} - {svc['deployments'][0]['desiredCount']} tasks")
