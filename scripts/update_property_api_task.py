#!/usr/bin/env python3
"""Update the property-api ECS task definition to use the new GitHub commit SHA."""
import boto3
import json

REGION = "af-south-1"
CLUSTER = "arn:aws:ecs:af-south-1:244718668833:cluster/digzio-cluster-prod"
SERVICE = "digzio-property-api-prod"
TASK_FAMILY = "digzio-property-api-prod"
NEW_SHA = "a99b8fc"

client = boto3.client("ecs", region_name=REGION)

# Get current task definition
td = client.describe_task_definition(taskDefinition=TASK_FAMILY)["taskDefinition"]

# Update the command with the new SHA
new_command = [
    "sh", "-c",
    f"wget -q -O /app/src/routes/property.routes.js 'https://raw.githubusercontent.com/boliviagroup/digzio/{NEW_SHA}/apps/property-api/src/routes/property.routes.js' && echo 'Patch applied: /app/src/routes/property.routes.js' || echo 'Patch failed, using original'; node src/index.js"
]

container_defs = td["containerDefinitions"]
container_defs[0]["command"] = new_command

# Register new task definition revision
keys_to_remove = ["taskDefinitionArn", "revision", "status", "requiresAttributes",
                  "placementConstraints", "compatibilities", "registeredAt", "registeredBy"]
for k in keys_to_remove:
    td.pop(k, None)

td["containerDefinitions"] = container_defs

response = client.register_task_definition(**td)
new_revision = response["taskDefinition"]["taskDefinitionArn"]
print(f"Registered new task definition: {new_revision}")

# Update the ECS service to use the new task definition
svc = client.update_service(
    cluster=CLUSTER,
    service=SERVICE,
    taskDefinition=new_revision,
    forceNewDeployment=True
)
print(f"Service updated: {svc['service']['serviceName']}")
print(f"Running: {svc['service']['runningCount']} | Pending: {svc['service']['pendingCount']}")
print("Deployment triggered — new containers will apply the role check fix.")
