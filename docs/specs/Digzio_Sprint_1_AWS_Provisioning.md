# Digzio Sprint 1: AWS Infrastructure & Provisioning Plan

**Version:** 1.0
**Status:** Ready for Execution
**Author:** Manus AI

---

## 1. Sprint 1 Overview

Sprint 1 is the foundational sprint of the Digzio platform. Its sole objective is to provision the secure, scalable AWS infrastructure required to host the backend microservices, database, caching layer, and API Gateway. No application code is written in this sprint; it is entirely focused on Infrastructure-as-Code (IaC) using Terraform.

**Duration:** 5 Days (Manus Accelerated)
**Goal:** A fully functional, secure, and networked AWS environment in `af-south-1` (Cape Town).

---

## 2. AWS Provisioning Steps (The Critical Path)

The infrastructure must be provisioned in a strict dependency order to avoid Terraform state failures or networking deadlocks.

### Step 1: Network Foundation (VPC)
The Virtual Private Cloud (VPC) is the secure perimeter for all Digzio services.

- **Action:** Provision a `/16` VPC in `af-south-1`.
- **Subnets:** Create two public subnets (for the Load Balancer/NAT) and two private subnets (for the RDS database, Redis cache, and Fargate containers) across two Availability Zones (AZs) for high availability.
- **Routing:** Attach an Internet Gateway to the public subnets and a NAT Gateway to the private subnets to allow outbound internet access for backend services (e.g., calling Onfido or NSFAS).

### Step 2: Data Persistence Layer (RDS & ElastiCache)
The stateful data services must be provisioned before any compute resources.

- **Database:** Provision an Amazon RDS PostgreSQL 15 instance (`db.t4g.micro` for MVP) inside the private subnets. Ensure `publicly_accessible` is set to `false`.
- **Cache:** Provision an Amazon ElastiCache Redis cluster (`cache.t4g.micro` for MVP) in the private subnets.
- **Security:** Configure Security Groups so that only the Fargate compute cluster can communicate with RDS on port 5432 and Redis on port 6379.

### Step 3: Compute Layer (ECS Fargate)
The serverless compute environment that will run the Node.js microservices.

- **Action:** Create an Amazon Elastic Container Service (ECS) cluster.
- **Configuration:** Define Fargate task definitions for the initial services (Auth, Property, etc.). Ensure the tasks are launched exclusively into the private subnets.
- **IAM Roles:** Attach an execution role granting the tasks permission to pull images from Elastic Container Registry (ECR) and write logs to CloudWatch.

### Step 4: Edge & Routing (API Gateway & Load Balancer)
The entry point for all client traffic (Student App, Provider Web, Admin Web).

- **Load Balancer:** Provision an Application Load Balancer (ALB) in the public subnets to route traffic to the Fargate tasks.
- **API Gateway:** Provision an Amazon API Gateway as the unified entry point. Configure routes (`/auth`, `/properties`, etc.) to forward requests to the ALB.
- **Security:** Attach an AWS WAF (Web Application Firewall) to the API Gateway to block OWASP Top 10 vulnerabilities and enforce rate limiting (1,000 requests/IP/minute).

### Step 5: Storage & CDN (S3 & CloudFront)
The repository for property images and compliance documents.

- **S3 Buckets:** Create `digzio-public-assets` (for property images) and `digzio-private-compliance` (for sensitive documents).
- **CDN:** Provision a CloudFront distribution pointing to the `digzio-public-assets` bucket to ensure fast image delivery globally.
- **Security:** Enforce Block Public Access on the private bucket and use Origin Access Control (OAC) to restrict the public bucket so it is only readable via CloudFront.

---

## 3. Database Migration Execution

Once the RDS instance is live, the database schema must be applied.

1. **Bastion Host:** Temporarily provision an EC2 bastion host in the public subnet (or use AWS Systems Manager Session Manager) to access the private RDS instance.
2. **Apply Schema:** Execute the `digzio_001_initial_schema.sql` migration file against the RDS endpoint.
3. **Verify:** Confirm the creation of all 11 tables, ENUM types, and the PostGIS spatial index.

---

## 4. CI/CD Pipeline Configuration

The GitHub Actions pipeline will automate deployments to the new infrastructure.

- **Trigger:** Push to the `main` branch.
- **Build:** Docker build the backend microservices.
- **Push:** Push the Docker images to Amazon ECR.
- **Deploy:** Update the ECS Fargate service to use the new image digest.

---

## 5. Acceptance Criteria for Sprint 1

Sprint 1 is considered complete when the following conditions are met:

| Criterion | Validation Method |
|---|---|
| **Network Isolation** | RDS and Redis endpoints are unreachable from the public internet. |
| **Database Readiness** | The `digzio_001_initial_schema.sql` migration runs successfully with zero errors. |
| **API Gateway Health** | A `GET /health` request to the API Gateway returns `200 OK`. |
| **WAF Protection** | A simulated SQL injection payload (`' OR 1=1 --`) sent to the API Gateway returns `403 Forbidden`. |
| **Storage Access** | Direct access to the S3 public bucket URL is denied; access via the CloudFront URL is permitted. |

Once these criteria are met, the infrastructure is ready for Sprint 2 (Auth & Core Engine).
