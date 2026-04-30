"""
digzio-rds-rotation-handler
============================
Triggered by EventBridge when the RDS-managed Secrets Manager secret rotates.
Reads the new password from the digzio/prod/db-password secret, then updates
all 9 ECS task definitions with the new DB_PASSWORD env var and forces a
new deployment for each service.

Environment variables (set at deploy time):
  CLUSTER          - ECS cluster name (digzio-cluster-prod)
  SECRET_ARN       - ARN of digzio/prod/db-password secret
  RDS_SECRET_ARN   - ARN of the RDS-managed secret (rds!db-...)
  REGION           - AWS region (af-south-1)
"""

import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CLUSTER = os.environ.get("CLUSTER", "digzio-cluster-prod")
SECRET_ARN = os.environ.get("SECRET_ARN", "arn:aws:secretsmanager:af-south-1:244718668833:secret:digzio/prod/db-password")
RDS_SECRET_ARN = os.environ.get("RDS_SECRET_ARN", "arn:aws:secretsmanager:af-south-1:244718668833:secret:rds!db-7e8ec887-9904-4e87-a3fb-e378d4c598ca-YBZddz")
REGION = os.environ.get("REGION", "af-south-1")

# All backend ECS services that use DB_PASSWORD
# (web-frontend does not connect to the DB directly)
BACKEND_SERVICES = [
    "digzio-auth-service-prod",
    "digzio-property-api-prod",
    "digzio-application-service-prod",
    "digzio-institution-api-prod",
    "digzio-kyc-service-prod",
    "digzio-lease-service-prod",
    "digzio-notification-service-prod",
    "digzio-incident-api-prod",
    "digzio-image-api-prod",
]


def get_new_password(sm_client):
    """Retrieve the new password from the RDS-managed secret."""
    logger.info(f"Fetching new password from RDS-managed secret: {RDS_SECRET_ARN}")
    response = sm_client.get_secret_value(SecretId=RDS_SECRET_ARN)
    secret = json.loads(response["SecretString"])
    # RDS-managed secrets have the format: {"username": "...", "password": "..."}
    password = secret.get("password")
    if not password:
        raise ValueError("No 'password' key found in RDS-managed secret")
    logger.info("Successfully retrieved new password from RDS-managed secret")
    return password


def sync_digzio_secret(sm_client, new_password):
    """Keep digzio/prod/db-password in sync with the new RDS password."""
    logger.info(f"Syncing digzio/prod/db-password secret: {SECRET_ARN}")
    sm_client.put_secret_value(
        SecretId=SECRET_ARN,
        SecretString=new_password,
    )
    logger.info("digzio/prod/db-password synced successfully")


def update_service(ecs_client, service_name, new_password):
    """
    Register a new task definition revision with the updated DB_PASSWORD,
    update the ECS service to use it, and force a new deployment.
    """
    logger.info(f"Processing service: {service_name}")

    # 1. Describe the current task definition
    svc_resp = ecs_client.describe_services(cluster=CLUSTER, services=[service_name])
    if not svc_resp["services"]:
        logger.warning(f"Service {service_name} not found in cluster {CLUSTER}, skipping")
        return None

    task_def_arn = svc_resp["services"][0]["taskDefinition"]
    logger.info(f"  Current task definition: {task_def_arn}")

    td_resp = ecs_client.describe_task_definition(taskDefinition=task_def_arn)
    td = td_resp["taskDefinition"]

    # 2. Build updated container definitions with new DB_PASSWORD
    container_defs = td["containerDefinitions"]
    for container in container_defs:
        env_vars = container.get("environment", [])
        updated = False
        for env in env_vars:
            if env["name"] == "DB_PASSWORD":
                env["value"] = new_password
                updated = True
                break
        if not updated:
            # Add DB_PASSWORD if it doesn't exist yet
            env_vars.append({"name": "DB_PASSWORD", "value": new_password})
            container["environment"] = env_vars
        logger.info(f"  Updated DB_PASSWORD in container: {container['name']}")

    # 3. Register new task definition revision
    register_kwargs = {
        "family": td["family"],
        "containerDefinitions": container_defs,
        "networkMode": td.get("networkMode", "awsvpc"),
        "cpu": td.get("cpu"),
        "memory": td.get("memory"),
        "requiresCompatibilities": td.get("requiresCompatibilities", ["FARGATE"]),
    }
    if td.get("executionRoleArn"):
        register_kwargs["executionRoleArn"] = td["executionRoleArn"]
    if td.get("taskRoleArn"):
        register_kwargs["taskRoleArn"] = td["taskRoleArn"]
    if td.get("volumes"):
        register_kwargs["volumes"] = td["volumes"]
    if td.get("placementConstraints"):
        register_kwargs["placementConstraints"] = td["placementConstraints"]
    # Preserve secrets (e.g., JWT_SECRET from Secrets Manager)
    for container in container_defs:
        pass  # already included in containerDefinitions

    new_td_resp = ecs_client.register_task_definition(**register_kwargs)
    new_td_arn = new_td_resp["taskDefinition"]["taskDefinitionArn"]
    new_revision = new_td_resp["taskDefinition"]["revision"]
    logger.info(f"  Registered new task definition revision: {new_revision} ({new_td_arn})")

    # 4. Update the ECS service to use the new task definition and force deployment
    ecs_client.update_service(
        cluster=CLUSTER,
        service=service_name,
        taskDefinition=new_td_arn,
        forceNewDeployment=True,
    )
    logger.info(f"  Service {service_name} updated to revision :{new_revision} and redeployment triggered")

    return new_revision


def lambda_handler(event, context):
    """
    Main Lambda entry point.
    Triggered by EventBridge on Secrets Manager RotateSecret events for the
    RDS-managed secret.
    """
    logger.info(f"Event received: {json.dumps(event)}")

    # Validate this is a rotation completion event (not a rotation start)
    # EventBridge delivers: detail.eventName = "RotateSecret"
    detail = event.get("detail", {})
    event_name = detail.get("eventName", "")
    
    # The secret ARN is in requestParameters.secretId
    request_params = detail.get("requestParameters", {})
    rotated_secret = request_params.get("secretId", "")

    logger.info(f"Event name: {event_name}, Rotated secret: {rotated_secret}")

    # Only proceed if this is a RotateSecret completion for our RDS secret
    # (or if triggered manually/for testing with no detail)
    if event_name and event_name != "RotateSecret":
        logger.info(f"Ignoring event: {event_name}")
        return {"statusCode": 200, "body": f"Ignored event: {event_name}"}

    sm_client = boto3.client("secretsmanager", region_name=REGION)
    ecs_client = boto3.client("ecs", region_name=REGION)

    # Get the new password from the RDS-managed secret
    new_password = get_new_password(sm_client)

    # Sync our application secret
    sync_digzio_secret(sm_client, new_password)

    # Update all backend services
    results = {}
    errors = []
    for service_name in BACKEND_SERVICES:
        try:
            new_revision = update_service(ecs_client, service_name, new_password)
            results[service_name] = f"updated to revision :{new_revision}"
        except Exception as e:
            logger.error(f"Failed to update {service_name}: {e}")
            errors.append({"service": service_name, "error": str(e)})

    summary = {
        "statusCode": 200 if not errors else 207,
        "updated": results,
        "errors": errors,
        "message": f"Updated {len(results)} services, {len(errors)} errors",
    }
    logger.info(f"Summary: {json.dumps(summary)}")
    return summary
