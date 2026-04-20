# DIGZIO: Production Build Sprint Plan
**Path to Live Platform MVP**

**Version:** 1.0  
**Date:** April 2026  
**Status:** Approved for Execution  
**Prepared for:** Digzio Engineering Team  
**Author:** Manus AI  

---

## 1. Executive Summary

This document outlines the **Production Sprint Plan** to build and launch the Digzio student housing marketplace. The strategy follows a "crawl, walk, run" methodology, ensuring that foundational infrastructure and the core backend engine are hardened before user-facing interfaces are built. 

The immediate goal is a **Soft Launch MVP (Minimum Viable Product)** featuring a closed group of early-adopter accommodation providers listing a select few properties, allowing real students to register, verify their identity, and apply using NSFAS integration.

**Sprint Cadence:** 2-week sprints.
**Total Duration to Soft Launch:** 12 weeks (6 Sprints).

---

## Phase 1: Foundation & Core Engine (Weeks 1–4)
*Goal: Establish secure cloud infrastructure, CI/CD pipelines, database schemas, and the core authentication/property backend services.*

### Sprint 1: Infrastructure, CI/CD & Database Foundation
**Focus:** Zero-trust architecture, database provisioning, and deployment pipelines.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| INF-01 | Cloud Setup | Provision AWS VPC, subnets (public/private), and Security Groups. | VPC deployed via Terraform; strict micro-segmentation applied. |
| INF-02 | Database | Deploy PostgreSQL (RDS) and Redis (ElastiCache) clusters. | DBs accessible only from private subnets; automated daily backups configured. |
| INF-03 | CI/CD | Configure GitHub Actions for automated testing and deployment. | Code pushes to `main` trigger automated tests and deploy to Staging. |
| ENG-01 | Data Model | Implement the core database schema (Users, Properties, Leases). | Migrations run successfully; all foreign keys and constraints enforced. |
| SEC-01 | API Gateway | Deploy AWS API Gateway with WAF integration. | API Gateway routes traffic to dummy endpoints; WAF blocks common OWASP Top 10 attacks. |

### Sprint 2: Authentication & Core Property Engine
**Focus:** User identity, RBAC (Role-Based Access Control), and the backend logic for property management.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| AUTH-01 | Identity | Implement OAuth 2.0 / OIDC authentication service. | Users can register and log in; JWT tokens issued with correct role scopes. |
| AUTH-02 | RBAC | Enforce role-based access control middleware. | API Gateway rejects requests from users lacking required roles (Student vs. Provider). |
| PROP-01 | Property API | Build CRUD endpoints for Property Listings. | `POST /properties` creates a listing; `GET /properties` returns listings. |
| PROP-02 | Image Repo | Implement Per-Property Image Repository API and S3 integration. | Images upload to S3; thumbnails generated; CDN URLs saved to `property_images` table. |
| NOT-01 | Notifications | Integrate SendGrid for transactional emails. | System successfully sends "Welcome" email upon user registration. |

---

## Phase 2: Provider Onboarding MVP (Weeks 5–6)
*Goal: Enable a small cohort of landlords to log in, create profiles, and upload their first properties to populate the marketplace.*

### Sprint 3: Provider Web Portal
**Focus:** The React-based frontend for landlords to manage their portfolios.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| PRV-01 | Dashboard | Build the Provider Main Dashboard layout. | Dashboard loads KPI widgets (Occupancy, Pending Applications) using mocked or real data. |
| PRV-02 | Listing UI | Build the multi-step "Add Property" form. | Providers can input property details, amenities, and pricing rules. |
| PRV-03 | Gallery UI | Implement the drag-and-drop Image Gallery uploader. | Providers can upload up to 20 images, categorize them, and reorder them. |
| PRV-04 | Compliance | Build the compliance document upload interface. | Providers can upload fire safety and zoning certificates to S3. |
| ENG-02 | Search Index | Implement Elasticsearch for property indexing. | Newly created properties are automatically synced to the Elasticsearch cluster. |

**Milestone 1:** *Internal Provider Beta. Digzio ops team assists 5-10 early-adopter landlords in uploading real properties.*

---

## Phase 3: Student Experience & NSFAS Integration (Weeks 7–10)
*Goal: Allow students to discover properties, verify their identity, and submit applications backed by NSFAS data.*

### Sprint 4: Student App (Discovery & KYC)
**Focus:** The React Native / PWA frontend for students to browse properties and verify identity.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| STU-01 | Search UI | Build the property search interface with filters. | Students can search by university proximity, price, and amenities via Elasticsearch. |
| STU-02 | Property View | Build the detailed property view and image carousel. | Progressive image loading works; all property details and provider compliance badges display correctly. |
| KYC-01 | Onfido | Integrate Onfido API for student identity verification. | Student uploads ID and selfie; Onfido webhook updates verification status in database. |
| STU-03 | Dashboard | Build the Student Main Dashboard. | Dashboard displays "Saved Properties" and "Action Center" alerts. |

### Sprint 5: Application Engine & NSFAS Sync
**Focus:** The core transaction: applying for a room and verifying funding.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| APP-01 | Apply Flow | Build the student application submission flow. | Student can select a room, agree to terms, and submit application. |
| NSF-01 | NSFAS API | Integrate with the NSFAS funding verification endpoint. | System queries NSFAS API with student ID; updates application with "Funded" or "Unfunded" status. |
| PRV-05 | App Review | Build the Provider interface to review applications. | Providers see incoming applications, NSFAS status, and can "Accept" or "Reject". |
| NOT-02 | SMS Alerts | Integrate Twilio for critical SMS notifications. | Student receives SMS when application is accepted by provider. |

---

## Phase 4: Production Hardening & Soft Launch (Weeks 11–12)
*Goal: Ensure the platform is secure, performant, legally compliant, and ready for real-world traffic.*

### Sprint 6: Security, Compliance & Load Testing
**Focus:** POPIA compliance, penetration testing, and operational readiness.

| Story ID | Epic | Description | Acceptance Criteria |
|---|---|---|---|
| SEC-02 | Pen Test | Conduct internal/external penetration testing. | All critical and high vulnerabilities identified are patched. |
| CMP-01 | POPIA | Implement data minimization and consent logs. | Privacy policy accepted by all users; audit trails log all PII access. |
| PERF-01 | Load Test | Conduct load testing on API Gateway and Database. | System handles 1,000 concurrent simulated users with < 500ms response time. |
| OPS-01 | Monitoring | Set up Datadog / CloudWatch dashboards and alerts. | Ops team receives Slack alerts if API error rate exceeds 1% or DB CPU > 80%. |
| ADMIN-01| Ops Panel | Build basic Admin Dashboard for user/property suspension. | Digzio staff can manually suspend a fraudulent listing or user. |

**Milestone 2:** *Production Soft Launch. The platform is live. Marketing directs a limited cohort of students to apply for the initially onboarded properties.*

---

## 3. Next Steps Post-Soft Launch

Following a successful soft launch and initial bug-fixing phase, the engineering team will transition to building out the remaining master specification features:

1. **Sprint 7:** Payment Gateway Integration (Stripe/PayU) for non-NSFAS top-ups and deposits.
2. **Sprint 8:** Institution (University) Dashboard and Reporting Engine.
3. **Sprint 9:** Holiday Rental Module (seasonal toggles and short-term booking flows).
