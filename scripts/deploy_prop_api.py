#!/usr/bin/env python3
"""Deploy a new property-api task definition with updated commit hash."""
import json, subprocess, re, sys, time

NEW_COMMIT = sys.argv[1] if len(sys.argv) > 1 else '8205926'

print(f'Deploying with commit: {NEW_COMMIT}')

# Get current task def
td_json = subprocess.run(
    'aws ecs describe-task-definition --task-definition digzio-property-api-prod --region af-south-1',
    shell=True, capture_output=True, text=True
).stdout
td = json.loads(td_json)['taskDefinition']

containers = td['containerDefinitions']
for c in containers:
    if 'command' in c and len(c['command']) == 3:
        inner = c['command'][2]
        inner = re.sub(r'boliviagroup/digzio/[a-f0-9]+/', f'boliviagroup/digzio/{NEW_COMMIT}/', inner)
        c['command'][2] = inner
        print(f'Updated command to use commit {NEW_COMMIT}')

new_td = {k: td[k] for k in ['family','taskRoleArn','executionRoleArn','networkMode',
                               'containerDefinitions','requiresCompatibilities','cpu','memory'] if k in td}

with open('/tmp/prop_td_new.json', 'w') as f:
    json.dump(new_td, f)

r = subprocess.run(
    'aws ecs register-task-definition --cli-input-json file:///tmp/prop_td_new.json --region af-south-1',
    shell=True, capture_output=True, text=True
)
result = json.loads(r.stdout)
rev = result['taskDefinition']['revision']
family = result['taskDefinition']['family']
print(f'Registered: {family}:{rev}')

subprocess.run(
    f'aws ecs update-service --cluster digzio-cluster-prod --service digzio-property-api-prod '
    f'--task-definition {family}:{rev} --force-new-deployment --region af-south-1 > /dev/null',
    shell=True
)
print(f'Deployed {family}:{rev}')
print('Waiting 90s for container to start...')
time.sleep(90)
print('Done!')
