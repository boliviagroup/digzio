# Digzio Sprint 1 — AWS Infrastructure Provisioning: Completion Report

**Date:** 23 April 2026  
**AWS Account:** `244718668833`  
**Region:** `af-south-1` (Cape Town — POPIA compliant)  
**Status:** ✅ COMPLETE  

---

## 1. Summary

Sprint 1 has been completed successfully. All core AWS infrastructure for the Digzio platform has been provisioned in the `af-south-1` Cape Town region using Terraform, and the production-grade PostgreSQL schema has been applied to the RDS database. The platform data estate is now live and POPIA-compliant.

---

## 2. Infrastructure Provisioned

| Resource | Name | Status | Details |
|---|---|---|---|
| **VPC** | `digzio-vpc-prod` | ✅ Available | `10.0.0.0/16`, 3 AZs |
| **Public Subnets** | `*-public-af-south-1a/b/c` | ✅ Active | `10.0.101-103.0/24` |
| **Private Subnets** | `*-private-af-south-1a/b/c` | ✅ Active | `10.0.1-3.0/24` |
| **Internet Gateway** | `igw-09ab8782b2a16fb12` | ✅ Attached | Public internet access |
| **NAT Gateway** | `nat-0097c3b1d601f6e7b` | ✅ Active | Private subnet outbound |
| **RDS PostgreSQL** | `digzio-db-prod` | ✅ Available | PostgreSQL 15.17, `db.t4g.micro` |
| **ElastiCache Redis** | `digzio-redis-prod` | ✅ Available | Redis 7.0.7, `cache.t3.micro` |
| **ECS Fargate Cluster** | `digzio-cluster-prod` | ✅ Active | FARGATE + FARGATE_SPOT |
| **S3 Bucket (Frontend)** | `digzio-frontend-prod` | ✅ Created | Versioning enabled |
| **S3 Bucket (Images)** | `digzio-property-images-prod` | ✅ Created | Versioning enabled |

---

## 3. Database Schema Applied

Migration `digzio_001_initial_schema.sql` applied successfully to `digzio-db-prod`.

| Category | Count | Items |
|---|---|---|
| **Tables** | 11 | `users`, `student_profiles`, `institutions`, `properties`, `property_images`, `applications`, `leases`, `payments`, `compliance_documents`, `notifications`, `maintenance_tickets` |
| **ENUMs** | 9 | `user_role_enum`, `kyc_status_enum`, `property_status_enum`, `application_status_enum`, `payment_status_enum`, `payment_method_enum`, `compliance_type_enum`, `ticket_status_enum`, `ticket_severity_enum` |
| **Extensions** | 2 | `postgis` (spatial search), `uuid-ossp` (UUID generation) |
| **Indexes** | 27 | Including `idx_properties_location` (PostGIS spatial), `idx_users_email`, `idx_applications_student`, `idx_applications_property` |

---

## 4. Security Configuration

| Control | Status | Notes |
|---|---|---|
| RDS `PubliclyAccessible` | ✅ `false` | Database not reachable from internet |
| RDS in private subnet | ✅ Confirmed | `10.0.1.0/24` — no public route |
| RDS password in Secrets Manager | ✅ Active | ARN: `rds!db-7e8ec887-...` |
| S3 public access blocked | ✅ Enabled | Both buckets have `BlockPublicAccess` |
| VPC Security Groups | ✅ Configured | RDS SG: port 5432 from VPC CIDR only |
| Bastion host | ✅ Terminated | Temporary bastion used for migration, immediately terminated |

---

## 5. CI/CD Pipelines Created

Two GitHub Actions workflows have been created:

| Workflow | File | Trigger | Action |
|---|---|---|---|
| **Frontend CI/CD** | `.github/workflows/frontend.yml` | Push to `main` affecting `apps/web-marketing/` | Build Vite app → Deploy to S3 |
| **Backend CI/CD** | `.github/workflows/backend.yml` | Push to `main` affecting `apps/api/` | Build Docker → Push to ECR → Deploy to ECS |

**Required GitHub Secrets** (to be added to the repository):

| Secret | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | `AKIATR6S6RQQ4LOOPJOS` |
| `AWS_SECRET_ACCESS_KEY` | (from IAM console) |

---

## 6. Key Endpoints

| Resource | Endpoint |
|---|---|
| **RDS Endpoint** | `digzio-db-prod.cjy0eyycgbq0.af-south-1.rds.amazonaws.com:5432` |
| **Redis Endpoint** | `digzio-redis-prod.wcsy7d.0001.afs1.cache.amazonaws.com:6379` |
| **ECS Cluster** | `arn:aws:ecs:af-south-1:244718668833:cluster/digzio-cluster-prod` |
| **VPC** | `vpc-029ac1c9e08a06c7f` |

---

## 7. Sprint 1 Acceptance Criteria

| Criterion | Status |
|---|---|
| VPC with public/private subnets in af-south-1 | ✅ Passed |
| RDS PostgreSQL not publicly accessible | ✅ Passed |
| Redis ElastiCache available in private subnet | ✅ Passed |
| ECS Fargate cluster active | ✅ Passed |
| S3 buckets created with versioning | ✅ Passed |
| SQL schema migration applied (11 tables, 9 ENUMs, PostGIS) | ✅ Passed |
| GitHub Actions CI/CD workflows created | ✅ Passed |
| All resources tagged `Project=Digzio` | ✅ Passed |

---

## 8. Next Steps — Sprint 2

Sprint 2 begins immediately. The focus is backend microservices:

1. **ECR Repository** — Create Docker image registry for API services
2. **Auth Service** — JWT + Refresh Token + RBAC (Node.js on ECS Fargate)
3. **Property API** — CRUD endpoints for property listings
4. **Image API** — S3 upload, resize, and serve via CloudFront
5. **Notification Service** — WhatsApp Business API + SendGrid integration
6. **Application Load Balancer** — Route traffic to ECS services
7. **API Gateway** — Public-facing API with WAF rules

**Pending credentials needed for Sprint 2:**

| Service | Purpose | Status |
|---|---|---|
| WhatsApp Business API (Meta) | Notifications | Not yet set up |
| SendGrid | Email notifications | Not yet set up |
| DHA API / PBVerify | KYC Layer 1 | Not yet set up |
| Smile Identity | KYC Layer 2 (liveness) | Not yet set up |
| GitHub repository URL | CI/CD push | Needed |
