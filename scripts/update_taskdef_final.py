#!/usr/bin/env python3.11
"""Update ECS task definition to use commit e3fd0b8 (final fix)."""
import json

NEW_COMMIT = 'e3fd0b8'

with open('/tmp/taskdef.json') as f:
    d = json.load(f)

td = d['taskDefinition']
containers = td['containerDefinitions']

for c in containers:
    if c['name'] == 'property-api':
        c['command'] = ['sh', '-c', 
            f"wget -q -O /app/src/routes/property.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_COMMIT}/apps/property-api/src/routes/property.routes.js' && echo 'Patch applied: /app/src/routes/property.routes.js' || echo 'Patch failed, using original'; node src/index.js"
        ]
        print("Updated to commit:", NEW_COMMIT)

reg_payload = {k: v for k, v in {
    'family': td['family'],
    'containerDefinitions': containers,
    'networkMode': td.get('networkMode', 'awsvpc'),
    'requiresCompatibilities': td.get('requiresCompatibilities', ['FARGATE']),
    'cpu': td.get('cpu', '256'),
    'memory': td.get('memory', '512'),
    'executionRoleArn': td.get('executionRoleArn', ''),
    'taskRoleArn': td.get('taskRoleArn', ''),
}.items() if v}

with open('/tmp/reg_payload_final.json', 'w') as f:
    json.dump(reg_payload, f, indent=2)
print("Written /tmp/reg_payload_final.json")
