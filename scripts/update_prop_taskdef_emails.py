"""Update property-api ECS task definition to use commit da6ab0d (admin email update endpoint)"""
import json, subprocess, sys

NEW_COMMIT = 'da6ab0d'
RAW_URL = f'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_COMMIT}/apps/property-api/src/routes/property.routes.js'

def run(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"ERROR: {r.stderr[:200]}")
        sys.exit(1)
    return r.stdout.strip()

# Get current task definition
td_json = run("aws ecs describe-task-definition --task-definition digzio-property-api-prod --region af-south-1")
td = json.loads(td_json)['taskDefinition']

# Update the command to use new commit
containers = td['containerDefinitions']
for c in containers:
    if 'command' in c:
        cmd_str = ' '.join(c['command'])
        if 'raw.githubusercontent.com' in cmd_str:
            # Replace old commit hash with new one
            import re
            new_cmd = re.sub(r'boliviagroup/digzio/[a-f0-9]+/', f'boliviagroup/digzio/{NEW_COMMIT}/', cmd_str)
            print(f"Old cmd: {cmd_str[:120]}")
            print(f"New cmd: {new_cmd[:120]}")
            c['command'] = ['sh', '-c', new_cmd.replace('sh -c ', '', 1) if new_cmd.startswith('sh -c ') else new_cmd]
            # Reconstruct properly
            # The command is ['sh', '-c', 'wget ... && node ...']
            if len(c['command']) == 3 and c['command'][0] == 'sh':
                inner = c['command'][2]
                inner = re.sub(r'boliviagroup/digzio/[a-f0-9]+/', f'boliviagroup/digzio/{NEW_COMMIT}/', inner)
                c['command'][2] = inner
                print(f"Final inner cmd: {inner[:150]}")

# Build new task def
new_td = {
    'family': td['family'],
    'taskRoleArn': td.get('taskRoleArn',''),
    'executionRoleArn': td.get('executionRoleArn',''),
    'networkMode': td.get('networkMode','awsvpc'),
    'containerDefinitions': containers,
    'requiresCompatibilities': td.get('requiresCompatibilities',['FARGATE']),
    'cpu': td.get('cpu','256'),
    'memory': td.get('memory','512'),
}
if td.get('volumes'):
    new_td['volumes'] = td['volumes']

with open('/tmp/prop_taskdef_emails.json', 'w') as f:
    json.dump(new_td, f)

# Register new revision
result = run("aws ecs register-task-definition --cli-input-json file:///tmp/prop_taskdef_emails.json --region af-south-1")
rev = json.loads(result)['taskDefinition']['revision']
family = json.loads(result)['taskDefinition']['family']
print(f"Registered: {family}:{rev}")

# Update service
run(f"aws ecs update-service --cluster digzio-cluster-prod --service digzio-property-api-prod --task-definition {family}:{rev} --force-new-deployment --region af-south-1")
print(f"ECS service updated to {family}:{rev}")
print("Waiting 90 seconds for deployment...")
import time; time.sleep(90)
print("Ready!")
