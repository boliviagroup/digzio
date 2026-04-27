#!/usr/bin/env python3.11
"""
Update the ECS task definition for property-api to use the new commit hash.
"""
import json, subprocess, sys

NEW_COMMIT = '103c70d'

# Load the current task definition
with open('/tmp/taskdef.json') as f:
    d = json.load(f)

td = d['taskDefinition']
containers = td['containerDefinitions']

# Update the command to use the new commit hash
for c in containers:
    if c['name'] == 'property-api':
        old_cmd = c.get('command', [])
        print("Old command:", old_cmd)
        new_cmd = ['sh', '-c', 
            f"wget -q -O /app/src/routes/property.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_COMMIT}/apps/property-api/src/routes/property.routes.js' && echo 'Patch applied: /app/src/routes/property.routes.js' || echo 'Patch failed, using original'; node src/index.js"
        ]
        c['command'] = new_cmd
        print("New command:", new_cmd)

# Write the updated container definitions
with open('/tmp/new_containers.json', 'w') as f:
    json.dump(containers, f, indent=2)
print("Written to /tmp/new_containers.json")

# Register new task definition revision
# We need to extract the fields that can be passed to register-task-definition
reg_payload = {
    'family': td['family'],
    'containerDefinitions': containers,
    'networkMode': td.get('networkMode', 'awsvpc'),
    'requiresCompatibilities': td.get('requiresCompatibilities', ['FARGATE']),
    'cpu': td.get('cpu', '256'),
    'memory': td.get('memory', '512'),
    'executionRoleArn': td.get('executionRoleArn', ''),
    'taskRoleArn': td.get('taskRoleArn', ''),
}
# Remove empty strings
reg_payload = {k: v for k, v in reg_payload.items() if v}

with open('/tmp/reg_payload.json', 'w') as f:
    json.dump(reg_payload, f, indent=2)
print("Registration payload written to /tmp/reg_payload.json")
print("Family:", td['family'])
print("CPU:", td.get('cpu'))
print("Memory:", td.get('memory'))
