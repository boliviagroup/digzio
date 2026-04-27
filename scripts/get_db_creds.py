import subprocess, json

result = subprocess.run([
    'aws', 'ecs', 'describe-task-definition',
    '--region', 'af-south-1',
    '--task-definition', 'digzio-auth-service-prod',
    '--output', 'json'
], capture_output=True, text=True)

td = json.loads(result.stdout)
containers = td['taskDefinition']['containerDefinitions']
for c in containers:
    print(f"Container: {c['name']}")
    for env in c.get('environment', []):
        print(f"  {env['name']} = {env['value']}")
