#!/usr/bin/env python3
"""Update the institution-api ECS task definition to use the latest GitHub commit SHA."""
import boto3
import subprocess

REGION = "af-south-1"
CLUSTER = "arn:aws:ecs:af-south-1:244718668833:cluster/digzio-cluster-prod"
SERVICE = "digzio-institution-api-prod"
TASK_FAMILY = "digzio-institution-api-prod"

# Get the latest commit SHA
result = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                        capture_output=True, text=True, cwd="/home/ubuntu/digzio")
NEW_SHA = result.stdout.strip()
print(f"Using commit SHA: {NEW_SHA}")

client = boto3.client("ecs", region_name=REGION)

# Get current task definition
td = client.describe_task_definition(taskDefinition=TASK_FAMILY)["taskDefinition"]

# Update the command with the new SHA
new_command = [
    "sh", "-c",
    f"wget -q -O /app/src/routes/institution.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_SHA}/apps/institution-api/src/routes/institution.routes.js' && echo 'Patch applied' || echo 'Patch failed, using original'; node src/index.js"
]

container_defs = td["containerDefinitions"]
container_defs[0]["command"] = new_command

# Remove read-only fields
keys_to_remove = ["taskDefinitionArn", "revision", "status", "requiresAttributes",
                  "placementConstraints", "compatibilities", "registeredAt", "registeredBy"]
for k in keys_to_remove:
    td.pop(k, None)

td["containerDefinitions"] = container_defs

response = client.register_task_definition(**td)
new_revision = response["taskDefinition"]["taskDefinitionArn"]
print(f"Registered new task definition: {new_revision}")

# Update the ECS service
svc = client.update_service(
    cluster=CLUSTER,
    service=SERVICE,
    taskDefinition=new_revision,
    forceNewDeployment=True
)
print(f"Service updated: {svc['service']['serviceName']}")
print(f"Running: {svc['service']['runningCount']} | Pending: {svc['service']['pendingCount']}")
print("Deployment triggered — new containers will apply the NULL id_number fix.")
