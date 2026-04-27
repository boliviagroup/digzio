#!/usr/bin/env python3.11
"""
Update the ECS task definition for property-api to use commit b895095.
"""
import json

NEW_COMMIT = 'b895095'

with open('/tmp/taskdef.json') as f:
    d = json.load(f)

td = d['taskDefinition']
containers = td['containerDefinitions']

for c in containers:
    if c['name'] == 'property-api':
        new_cmd = ['sh', '-c', 
            f"wget -q -O /app/src/routes/property.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_COMMIT}/apps/property-api/src/routes/property.routes.js' && echo 'Patch applied: /app/src/routes/property.routes.js' || echo 'Patch failed, using original'; node src/index.js"
        ]
        c['command'] = new_cmd
        print("Updated command to use commit:", NEW_COMMIT)

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
reg_payload = {k: v for k, v in reg_payload.items() if v}

with open('/tmp/reg_payload_v3.json', 'w') as f:
    json.dump(reg_payload, f, indent=2)
print("Written to /tmp/reg_payload_v3.json")
