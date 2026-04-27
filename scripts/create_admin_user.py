"""
Creates the demo.admin@digzio.co.za user with ADMIN role directly in RDS
by running a one-off ECS task that executes a Node.js inline script.
"""
import boto3
import json
import time

REGION = "af-south-1"
CLUSTER = "arn:aws:ecs:af-south-1:244718668833:cluster/digzio-cluster-prod"
ACCOUNT = "244718668833"

# Use the auth-service task definition as a base (it has DB creds)
TASK_DEF = "digzio-auth-service-prod:2"

# bcrypt hash of "Demo1234!" with salt rounds 10
# Pre-computed: $2b$10$YourHashHere
# We'll compute it inline in the Node script

NODE_SCRIPT = """
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const hash = await bcrypt.hash('Demo1234!', 10);
  console.log('Hash generated:', hash.substring(0, 20) + '...');
  
  const result = await pool.query(`
    INSERT INTO users (
      first_name, last_name, email, password_hash,
      phone_number, role, kyc_status, is_active
    ) VALUES (
      'Digzio', 'Admin',
      'demo.admin@digzio.co.za',
      $1,
      '+27100000000',
      'ADMIN',
      'VERIFIED',
      true
    )
    ON CONFLICT (email) DO UPDATE SET
      role = 'ADMIN',
      password_hash = $1,
      is_active = true
    RETURNING user_id, email, role
  `, [hash]);
  
  console.log('Admin user created/updated:', JSON.stringify(result.rows[0]));
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
"""

ecs = boto3.client("ecs", region_name=REGION)

# Get the task definition to extract network config and execution role
td = ecs.describe_task_definition(taskDefinition=TASK_DEF)["taskDefinition"]
exec_role = td.get("executionRoleArn", "")
task_role = td.get("taskRoleArn", "")
env = td["containerDefinitions"][0].get("environment", [])

# Build the command: node -e "<script>"
# We need to escape the script for shell
import shlex
node_cmd = f"node -e {shlex.quote(NODE_SCRIPT)}"

# Get VPC/subnet/sg from a running service
ecs_svc = ecs.describe_services(
    cluster=CLUSTER,
    services=["digzio-auth-service-prod"]
)["services"][0]
network_config = ecs_svc["networkConfiguration"]

print("Launching one-off ECS task to create admin user...")
response = ecs.run_task(
    cluster=CLUSTER,
    taskDefinition=TASK_DEF,
    launchType="FARGATE",
    networkConfiguration=network_config,
    overrides={
        "containerOverrides": [{
            "name": td["containerDefinitions"][0]["name"],
            "command": ["sh", "-c", f"cd /app && {node_cmd}"],
            "environment": env
        }]
    }
)

task_arn = response["tasks"][0]["taskArn"]
print(f"Task launched: {task_arn}")
print("Waiting for task to complete...")

# Poll until stopped
for i in range(30):
    time.sleep(10)
    tasks = ecs.describe_tasks(cluster=CLUSTER, tasks=[task_arn])["tasks"]
    status = tasks[0]["lastStatus"]
    print(f"  [{i+1}] Status: {status}")
    if status == "STOPPED":
        containers = tasks[0]["containers"]
        for c in containers:
            exit_code = c.get("exitCode", "?")
            reason = c.get("reason", "")
            print(f"  Container exit code: {exit_code}, reason: {reason}")
        break

print("Done. Check CloudWatch logs for the task output.")
print(f"Log group: /ecs/digzio-auth-service-prod")
