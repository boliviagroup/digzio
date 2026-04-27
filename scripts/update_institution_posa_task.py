import subprocess, json

SHA = "45ac55b"
REGION = "af-south-1"
FAMILY = "digzio-institution-api-prod"

# Get current task definition
result = subprocess.run([
    'aws', 'ecs', 'describe-task-definition',
    '--region', REGION,
    '--task-definition', FAMILY,
    '--output', 'json'
], capture_output=True, text=True)

td = json.loads(result.stdout)['taskDefinition']
containers = td['containerDefinitions']

# Update command to run migration first, then start server
for c in containers:
    if c['name'] == 'institution-api':
        c['command'] = [
            'sh', '-c',
            f"wget -q -O /app/src/routes/institution.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{SHA}/apps/institution-api/src/routes/institution.routes.js' && "
            f"wget -q -O /app/src/migrate_posa.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{SHA}/apps/institution-api/src/migrate_posa.js' && "
            f"node src/migrate_posa.js && "
            f"node src/index.js"
        ]
        print(f"Updated command for {c['name']}")

# Build new task definition
new_td = {
    'family': td['family'],
    'networkMode': td.get('networkMode', 'awsvpc'),
    'containerDefinitions': containers,
    'requiresCompatibilities': td.get('requiresCompatibilities', ['FARGATE']),
    'cpu': td.get('cpu', '256'),
    'memory': td.get('memory', '512'),
    'executionRoleArn': td.get('executionRoleArn', '')
}
if td.get('taskRoleArn'):
    new_td['taskRoleArn'] = td['taskRoleArn']

# Write to file
with open('/tmp/institution_posa_task.json', 'w') as f:
    json.dump(new_td, f)

print("Task definition written to /tmp/institution_posa_task.json")

# Register new task definition
reg_result = subprocess.run([
    'aws', 'ecs', 'register-task-definition',
    '--region', REGION,
    '--cli-input-json', f'file:///tmp/institution_posa_task.json',
    '--output', 'json'
], capture_output=True, text=True)

if reg_result.returncode == 0:
    reg_td = json.loads(reg_result.stdout)
    new_rev = reg_td['taskDefinition']['revision']
    print(f"Registered new task definition revision: {new_rev}")

    # Update ECS service to use new task definition
    # Get cluster ARN
    cluster_result = subprocess.run([
        'aws', 'ecs', 'list-clusters', '--region', REGION, '--output', 'json'
    ], capture_output=True, text=True)
    clusters = json.loads(cluster_result.stdout)['clusterArns']
    cluster = clusters[0] if clusters else 'digzio-cluster'
    print(f"Using cluster: {cluster}")

    update_result = subprocess.run([
        'aws', 'ecs', 'update-service',
        '--region', REGION,
        '--cluster', cluster,
        '--service', 'digzio-institution-api-prod',
        '--task-definition', f'{FAMILY}:{new_rev}',
        '--force-new-deployment',
        '--output', 'json'
    ], capture_output=True, text=True)

    if update_result.returncode == 0:
        print("ECS service updated successfully! New deployment triggered.")
    else:
        print(f"ECS update error: {update_result.stderr}")
else:
    print(f"Registration error: {reg_result.stderr}")
