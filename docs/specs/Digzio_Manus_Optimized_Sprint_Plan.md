# Digzio Platform — Manus-Optimized Execution Plan

**Version:** 2.0 (Manus Accelerated)  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Executive Summary

The original 12-week timeline assumed a traditional human engineering team of two developers working standard 40-hour weeks with context switching, meetings, and fatigue.

By utilizing **Manus as the primary engineering engine**, the timeline can be radically compressed. Manus does not sleep, does not context-switch, and writes boilerplate, infrastructure-as-code, and API logic at machine speed. 

What previously required 12 weeks can be executed in **3 to 4 weeks of continuous agentic sessions**, provided the human product owner (you) is available for rapid feedback, API key provisioning, and unblocking external dependencies (e.g., Onfido, NSFAS).

---

## 2. The Manus Accelerated Timeline

Instead of "Sprints" measured in weeks, this plan is measured in **Manus Sessions**. A single Manus session can typically accomplish what a human developer might do in 1–2 days.

### Phase 1: Foundation & Core Engine (Days 1–5)
*Human equivalent: Sprints 1 & 2 (4 weeks)*

| Session Group | Deliverable | Manus Execution Speed |
|---|---|---|
| **INF-01 to INF-03** | AWS VPC, RDS PostgreSQL, Redis, API Gateway, WAF | Manus writes and applies Terraform modules in 2-3 sessions. |
| **AUTH-01 & RBAC** | JWT Auth Service & Middleware | Manus generates standard Node.js/Express auth boilerplate in 1 session. |
| **PROP-01 & PROP-02** | Property CRUD & S3 Image Orchestration | Manus writes PostGIS queries and AWS SDK logic in 2 sessions. |

**Human Blocker:** You must provide the AWS Root credentials and configure the domain name (DNS).

---

### Phase 2: Provider Web Portal (Days 6–10)
*Human equivalent: Sprint 3 (2 weeks)*

| Session Group | Deliverable | Manus Execution Speed |
|---|---|---|
| **PRV-01 to PRV-04** | Provider Dashboard, Listing Wizard, Image Gallery, Compliance Upload | Manus scaffolds the React SPA, builds the UI components with Tailwind, and wires the API in 4-5 sessions. |
| **ENG-02** | Elasticsearch Sync Engine | Manus writes the Redis Pub/Sub CDC pipeline in 1 session. |

**Human Blocker:** You must review the UI/UX of the Provider Portal and approve the listing flow.

---

### Phase 3: Student App & KYC (Days 11–15)
*Human equivalent: Sprint 4 (2 weeks)*

| Session Group | Deliverable | Manus Execution Speed |
|---|---|---|
| **STU-01 to STU-03** | Property Search, Details View, Student Dashboard | Manus builds the mobile-first React views and wires the Elasticsearch queries in 3-4 sessions. |
| **KYC-01** | Onfido Integration | Manus integrates the SDK and webhook handler in 1-2 sessions. |

**Human Blocker:** You must provide the Onfido API keys and approve the live testing environment.

---

### Phase 4: Application Engine & NSFAS (Days 16–20)
*Human equivalent: Sprint 5 (2 weeks)*

| Session Group | Deliverable | Manus Execution Speed |
|---|---|---|
| **APP-01 & PRV-05** | Application State Machine & Provider Review | Manus writes the complex SQL transactions (pessimistic locking) and API logic in 2-3 sessions. |
| **NSF-01** | NSFAS Integration Engine | Manus builds the mTLS client and BullMQ retry queue in 2 sessions. |
| **NOT-02** | WhatsApp & Email Integration | Manus wires the WhatsApp Business API SDK in 1 session. |

**Human Blocker:** You must provide the NSFAS API mTLS certificates and WhatsApp Business API API keys.

---

### Phase 5: Hardening & Soft Launch (Days 21–25)
*Human equivalent: Sprint 6 (2 weeks)*

| Session Group | Deliverable | Manus Execution Speed |
|---|---|---|
| **SEC-01 & SEC-02** | Pen Testing & POPIA Audit | Manus runs automated security scans (e.g., OWASP ZAP) and verifies encryption in 2 sessions. |
| **PERF-01** | Load Testing | Manus writes and executes k6 load testing scripts in 1 session. |
| **ADM-01** | Admin Panel | Manus scaffolds a basic Retool or React admin dashboard in 2 sessions. |

**Human Blocker:** Final go/no-go decision for Soft Launch.

---

## 3. Summary of the Manus Advantage

| Metric | Traditional Team | Manus Accelerated |
|---|---|---|
| **Time to Soft Launch** | 12 Weeks | **3.5 Weeks (25 Days)** |
| **Cost Profile** | High (Developer Salaries) | Low (Compute/Token Costs) |
| **Bottleneck** | Developer velocity | Human feedback & 3rd-party API keys |

By acting as the orchestrator and unblocker, you can guide Manus to build the entire Digzio platform in under a month. The critical path is no longer writing code; it is making fast product decisions and securing external dependencies (AWS, Onfido, WhatsApp Business API, NSFAS).
