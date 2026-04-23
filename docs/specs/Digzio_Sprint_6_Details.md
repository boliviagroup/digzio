# Digzio Platform — Sprint 6: Production Hardening & Soft Launch Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 6 Overview

Sprint 6 is the final sprint before the platform is exposed to real users in a production environment. Unlike Sprints 2–5, which focused on building features, Sprint 6 focuses entirely on **breaking them, securing them, and monitoring them.**

A successful Sprint 6 ensures that when the first 1,000 students log in, the platform does not crash, data is not leaked, and malicious actors cannot exploit the APIs.

**Duration:** 2 Weeks (Weeks 11–12)  
**Primary Deliverables:** Penetration Testing Remediation, POPIA Compliance Audit, Load Testing, Monitoring & Alerting Setup, and the Digzio Admin Panel.

---

## 2. Security & Compliance

### 2.1 Penetration Testing (`SEC-01`)

Before going live, the engineering team must conduct an internal security audit against the OWASP Top 10 vulnerabilities.

**Specific Test Cases:**
1. **Broken Access Control:** Can a `STUDENT` JWT access a `GET /api/v1/providers/applications` endpoint? (Expected: `403 Forbidden`).
2. **Insecure Direct Object Reference (IDOR):** Can Student A view Student B's application by changing the `application_id` in the URL? (Expected: `404 Not Found` or `403 Forbidden`).
3. **JWT Forgery:** Can a user forge a JWT with `role: ADMIN` and bypass the middleware? (Expected: `401 Unauthorized` due to invalid signature).
4. **Rate Limit Evasion:** Can an attacker bypass the API Gateway rate limit by spoofing the `X-Forwarded-For` header? (Expected: WAF blocks based on true origin IP).

### 2.2 POPIA Compliance Audit (`SEC-02`)

The Protection of Personal Information Act (POPIA) carries severe penalties in South Africa. Digzio must prove compliance before processing student ID numbers.

**Compliance Checklist:**
- [ ] **Data Minimization:** Ensure ID card images and selfies are *not* stored in Digzio S3 buckets (they must remain in Onfido).
- [ ] **Consent Logging:** Ensure the boolean flag `nsfas_consent_granted` and the `consent_timestamp` are recorded in the `applications` table.
- [ ] **Encryption at Rest:** Verify that the PostgreSQL RDS instance has AWS KMS encryption enabled.
- [ ] **Right to be Forgotten:** Implement the `DELETE /api/v1/users/me` endpoint, which obfuscates PII but retains transaction records for financial auditing.

---

## 3. Performance & Reliability

### 3.1 Load Testing (`PERF-01`)

The platform must survive the "NSFAS Results Day" spike, where thousands of students log in simultaneously.

**Testing Methodology:**
- **Tool:** k6 or Artillery.
- **Scenario:** 1,000 concurrent Virtual Users (VUs) executing the core loop: Login → Search Properties → View Property → Apply.
- **Duration:** 15-minute sustained load, followed by a 5-minute spike to 3,000 VUs.

**Performance Benchmarks (Acceptance Criteria):**
- **API Gateway Error Rate:** < 0.1% (`5xx` errors).
- **Search API P95 Latency:** < 300ms.
- **Database CPU Utilization:** < 70% during the spike.

### 3.2 Monitoring & Alerting (`OPS-01`)

If the platform breaks, the engineering team must know before the users complain on Twitter.

**Monitoring Setup (Datadog or AWS CloudWatch):**
- **Dashboard:** Central dashboard tracking API latency, Database Connections, Redis Memory, and Active WebSockets.
- **Alerting (Slack/PagerDuty):**
  - *Critical:* 5xx Error Rate > 1% for 5 minutes.
  - *Critical:* Database CPU > 85% for 5 minutes.
  - *Warning:* NSFAS API Timeout Rate > 5% (indicates government API is down; BullMQ is queuing).

---

## 4. The Digzio Admin Panel (`ADM-01`)

The operations team needs a basic internal tool to manage the marketplace.

**UI Components (React Admin / Retool):**
- **User Management:** Search users by email or phone. View KYC status. Button to manually `SUSPEND` a user.
- **Property Moderation:** View all `PENDING_REVIEW` properties. View uploaded Fire/Zoning certificates. Buttons to `APPROVE` (moves to `ACTIVE`) or `REJECT` with a reason.
- **NSFAS Override:** A highly restricted interface allowing an Admin to manually mark a student as `FUNDED` if the NSFAS API is down for > 24 hours, requiring an audit log comment.

---

## 5. Sprint 6 End State: Milestone 2 (Soft Launch)

By the end of Week 12, the following must be true:

1. **Zero Critical Vulnerabilities:** All High and Critical findings from the internal pen test are remediated.
2. **POPIA Sign-off:** The legal/compliance officer signs off on the data handling flows.
3. **Load Certified:** The platform successfully handles 1,000 concurrent users without degradation.
4. **Ops Ready:** The Admin Panel is live, and Slack alerts are configured.

**Milestone Reached:** The platform is deployed to the Production AWS environment. The DNS records are switched over. Digzio is officially live for its Soft Launch.
