# Digzio Platform — Sprint 1–6 Master Summary & Execution Plan

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Executive Summary

This document provides a high-level summary of the entire **12-week (6 Sprint) path to the Soft Launch MVP** for the Digzio platform. 

It breaks down the core deliverables for each sprint and provides an estimated number of **Development Sessions** required to complete them. 

*Note: A "Session" is defined as a focused, 4-hour block of uninterrupted engineering work by a single developer (e.g., half a day).*

---

## 2. Sprint Breakdown

### Sprint 1: Infrastructure & Database Foundation
*Laying the unbreakable, zero-trust cloud foundation before any code is written.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **AWS Network** | VPC, Public/Private Subnets, NAT Gateway, Security Groups (Terraform) | 4 Sessions |
| **Database Cluster** | RDS PostgreSQL (Multi-AZ) + ElastiCache Redis (Serverless) | 3 Sessions |
| **CI/CD Pipeline** | GitHub Actions for automated linting, testing, and staging deployment | 3 Sessions |
| **SQL Schema** | 11 core tables, PostGIS extension, ENUMs, triggers, and indexes | 2 Sessions |
| **API Gateway** | AWS API Gateway with WAF (Web Application Firewall) and rate limiting | 3 Sessions |
| **Total Sprint 1** | | **15 Sessions** |

---

### Sprint 2: Authentication & Core Backend Engine
*Building the secure APIs that power the platform.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **Auth Service** | OAuth 2.0, Argon2id hashing, JWT + Redis refresh token blacklist | 5 Sessions |
| **RBAC Middleware** | Role-based route protection (Student vs. Provider vs. Admin) | 2 Sessions |
| **Property API** | CRUD endpoints for listings with PostGIS spatial integration | 4 Sessions |
| **Image API** | Direct-to-S3 pre-signed URL orchestration + Lambda thumbnails | 4 Sessions |
| **Notification Service** | Async email dispatch via SendGrid (Redis Pub/Sub) | 2 Sessions |
| **Total Sprint 2** | | **17 Sessions** |

---

### Sprint 3: Provider Web Portal (Supply Side)
*Building the frontend for landlords to list their properties.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **Provider Dashboard** | React UI with KPI tiles and recent activity feed | 3 Sessions |
| **Listing Wizard** | Multi-step React Hook Form + Zod validation + Google Places | 6 Sessions |
| **Image Uploader** | Drag-and-drop gallery with category tagging and S3 direct upload | 5 Sessions |
| **Compliance Upload** | Secure document upload for Fire Safety and Zoning certs | 3 Sessions |
| **Search Sync Engine** | Backend CDC pipeline syncing `ACTIVE` properties to Elasticsearch | 4 Sessions |
| **Total Sprint 3** | | **21 Sessions** |

---

### Sprint 4: Student Experience & KYC (Demand Side)
*Building the frontend for students to discover properties and verify identity.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **Search UI** | Map view, filters (price, distance, NSFAS), and infinite scroll feed | 5 Sessions |
| **Property Details** | Image carousel, amenities list, and provider compliance badges | 3 Sessions |
| **Student Dashboard** | Action Center alerts and saved properties list | 2 Sessions |
| **Search API** | Backend Elasticsearch `geo_distance` queries and cursor pagination | 4 Sessions |
| **Onfido KYC Service** | SDK integration, secure tokens, and async webhook processing | 6 Sessions |
| **Total Sprint 4** | | **20 Sessions** |

---

### Sprint 5: Application Engine & NSFAS Integration
*The transaction engine: matching supply and demand with automated funding verification.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **Application Flow** | Student UI for room selection, lease terms, and POPIA consent | 4 Sessions |
| **Application API** | Backend state machine enforcing KYC, duplicate, and capacity rules | 5 Sessions |
| **NSFAS Engine** | mTLS REST calls to government API + BullMQ retry queue | 6 Sessions |
| **Provider Review** | Landlord UI (Kanban) + backend pessimistic locking (`SELECT FOR UPDATE`) | 5 Sessions |
| **SMS Service** | Twilio integration for critical state changes (`ACCEPTED` / `REVIEW`) | 2 Sessions |
| **Total Sprint 5** | | **22 Sessions** |

---

### Sprint 6: Production Hardening & Soft Launch
*Securing, testing, and deploying the platform for real users.*

| Deliverable | Description | Est. Sessions |
|---|---|---|
| **Penetration Testing** | Internal security audit of API endpoints and JWT handling | 4 Sessions |
| **POPIA Audit** | Ensuring data minimization, consent logs, and PII encryption | 3 Sessions |
| **Load Testing** | Simulating 1,000 concurrent users via API Gateway | 3 Sessions |
| **Monitoring Setup** | Datadog/CloudWatch dashboards and Slack alerts for error rates | 4 Sessions |
| **Admin Panel (Basic)** | Internal tool to manually suspend users or properties | 5 Sessions |
| **Total Sprint 6** | | **19 Sessions** |

---

## 3. Total Effort & Timeline Summary

| Metric | Estimate |
|---|---|
| **Total Sprints** | 6 Sprints |
| **Total Weeks** | 12 Weeks |
| **Total Development Sessions** | **114 Sessions** (~456 hours of focused engineering) |
| **Team Required** | 1x Backend/DevOps Engineer, 1x Frontend (React) Engineer |

**The Milestone Path:**
- **End of Sprint 2:** Backend is live on Staging. APIs are testable via Postman.
- **End of Sprint 3:** **Milestone 1** — The first 10 real landlords are invited to upload properties.
- **End of Sprint 5:** The core loop is closed. Students can apply; NSFAS is checked automatically.
- **End of Sprint 6:** **Milestone 2** — Public Soft Launch. The platform is live and secure.
