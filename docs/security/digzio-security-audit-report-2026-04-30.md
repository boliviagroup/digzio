# Digzio Platform — Independent Security Audit Report

**Classification:** Confidential — Internal Use Only  
**Audit Date:** 30 April 2026  
**Report Version:** 1.0  
**Prepared by:** Independent Security Review (Automated Static + Dynamic Analysis)  
**Scope:** Production environment — `https://www.digzio.co.za`  
**Platform Version:** Auth-service `:7`, Institution-API `:22`, Web-frontend `:19`

---

## Executive Summary

This report presents the findings of an independent security audit conducted against the Digzio student housing platform. The audit covered authentication and authorisation controls, API security, infrastructure configuration, and frontend security. Testing was performed using a combination of static source code analysis, dynamic API testing, and infrastructure configuration review against the AWS production environment.

**Overall Risk Rating: MEDIUM-HIGH**

The platform demonstrates a solid security foundation in several areas — all endpoints require authentication, role-based access control is enforced, SQL injection is prevented through parameterised queries, and security headers are applied via Helmet. However, five critical and high-severity findings were identified that require immediate remediation before the platform handles sensitive student financial or identity data at scale.

| Severity | Count |
|----------|-------|
| **Critical** | 2 |
| **High** | 3 |
| **Medium** | 4 |
| **Low** | 3 |
| **Informational** | 2 |
| **Total** | 14 |

---

## Scope and Methodology

### Systems in Scope

| Component | Technology | Endpoint |
|-----------|-----------|----------|
| Web Frontend | React + TypeScript (Vite) | `https://www.digzio.co.za` |
| Auth Service | Node.js / Express | `/api/v1/auth/*` |
| Property API | Node.js / Express | `/api/v1/properties/*` |
| Application Service | Node.js / Express | `/api/v1/applications/*` |
| KYC Service | Node.js / Express | `/api/v1/kyc/*` |
| Institution API | Node.js / Express | `/api/v1/institutions/*` |
| Incident API | Node.js / Express | `/api/v1/incidents/*` |
| Lease Service | Node.js / Express | `/api/v1/leases/*` |
| Image API | Node.js / Express | `/api/v1/images/*` |
| Infrastructure | AWS ECS, RDS, ALB, S3 | `af-south-1` |

### Methodology

Testing followed the OWASP Testing Guide v4.2 and OWASP API Security Top 10 (2023). The following techniques were applied:

- **Static analysis** — source code review of all route files, middleware, and configuration
- **Dynamic testing** — live API calls against the production environment using authenticated and unauthenticated sessions
- **Infrastructure review** — AWS CLI inspection of ECS task definitions, RDS configuration, S3 bucket policies, ALB listeners, and IAM roles
- **Privilege escalation testing** — cross-role API access attempts using tokens from STUDENT, PROVIDER, INSTITUTION, and ADMIN accounts

---

## Findings

### CRITICAL-01 — Hardcoded JWT Secret with Weak Default Fallback

**Severity:** Critical  
**OWASP Category:** A02:2021 – Cryptographic Failures  
**Affected Components:** All nine microservices

**Description:**  
Every microservice uses the same JWT secret with a hardcoded plaintext fallback value:

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';
```

This secret is also stored in plaintext in every ECS task definition as an environment variable (`JWT_SECRET`), making it visible to anyone with IAM read access to ECS. Because all services share a single JWT secret, a token signed by any service is accepted by all other services. An attacker who discovers the secret — through ECS console access, CloudTrail logs, or a misconfigured IAM policy — can forge arbitrary JWTs for any user, including administrators.

**Evidence:**  
Confirmed in nine route files and nine ECS task definitions via `aws ecs describe-task-definition`.

**Remediation:**
1. Rotate the JWT secret immediately to a cryptographically random 256-bit value (e.g., `openssl rand -hex 32`).
2. Store the secret in AWS Secrets Manager and reference it via the `secrets` field in ECS task definitions, not `environment`.
3. Consider issuing service-specific signing keys if inter-service trust boundaries need to be enforced.

---

### CRITICAL-02 — Broken Object-Level Authorisation (BOLA / IDOR) on Application Endpoint

**Severity:** Critical  
**OWASP Category:** API1:2023 – Broken Object Level Authorization  
**Affected Component:** Application Service — `GET /api/v1/applications/:id`

**Description:**  
Any authenticated user can retrieve the full details of any application by supplying its UUID, regardless of whether they are the applicant. During testing, Student B successfully retrieved Student A's application record — including `student_id`, `property_id`, `status`, `applied_at`, and `provider_notes` — using only Student B's valid JWT.

**Evidence:**
```
GET /api/v1/applications/8bce1c91-3520-42fa-bd46-dbd03f052f23
Authorization: Bearer <Student B token>

HTTP 200 OK
{
  "application_id": "8bce1c91-3520-42fa-bd46-dbd03f052f23",
  "student_id": "829714ce-150f-49f3-b208-677a2d4aaf45",   ← Student A's ID
  "property_id": "5931a953-fea2-4614-9c3e-7d7787b1261a",
  "status": "SUBMITTED",
  ...
}
```

**Remediation:**  
Add an ownership check to `GET /api/v1/applications/:id`. The query must include a `WHERE application_id = $1 AND (student_id = $2 OR provider_id = $3)` clause, where `$2` and `$3` are extracted from the verified JWT, not from the request body.

---

### HIGH-01 — All Secrets Stored as Plaintext ECS Environment Variables

**Severity:** High  
**OWASP Category:** A05:2021 – Security Misconfiguration  
**Affected Components:** All nine ECS task definitions

**Description:**  
All nine microservices store sensitive credentials — including `DB_PASSWORD`, `JWT_SECRET`, `REFRESH_SECRET`, and AWS API keys — as plaintext `environment` entries in ECS task definitions. These values are visible in the AWS ECS console, in CloudTrail logs, and to any IAM principal with `ecs:DescribeTaskDefinition` permission. They are also stored unencrypted in the ECS task definition revision history, which is immutable and cannot be deleted.

**Affected secrets confirmed:**

| Service | Plaintext Secrets |
|---------|------------------|
| auth-service | `JWT_SECRET`, `DB_PASSWORD`, `REFRESH_SECRET` |
| property-api | `DB_PASSWORD` |
| application-service | `DB_PASSWORD` |
| kyc-service | `DB_PASSWORD` |
| institution-api | `JWT_SECRET`, `DB_PASSWORD` |
| incident-api | `JWT_SECRET`, `DB_PASSWORD` |
| lease-service | `DB_PASSWORD` |
| image-api | `DB_PASSWORD`, `AWS_SECRET_ACCESS_KEY` |
| notification-service | `DB_PASSWORD` |

**Remediation:**  
Migrate all secrets to AWS Secrets Manager or AWS Systems Manager Parameter Store (SecureString). Reference them using the `secrets` array in ECS task definitions. This ensures secrets are encrypted at rest and are never written to CloudTrail in plaintext.

---

### HIGH-02 — RDS Instance Publicly Accessible

**Severity:** High  
**OWASP Category:** A05:2021 – Security Misconfiguration  
**Affected Component:** `digzio-db-prod` (PostgreSQL RDS)

**Description:**  
The production RDS PostgreSQL instance has `PubliclyAccessible: true`. While the security group currently restricts inbound access on port 5432 to the VPC CIDR (`10.0.0.0/16`) and two specific IP addresses, the public accessibility flag means the instance has a public DNS endpoint and is reachable from the internet if the security group is ever misconfigured. Additionally, deletion protection is disabled (`DeletionProtection: false`), meaning the database can be deleted without a safeguard.

**Evidence:**
```json
{
  "id": "digzio-db-prod",
  "publiclyAccessible": true,
  "deletionProtection": false
}
```

**Remediation:**
1. Set `PubliclyAccessible: false` on the RDS instance to remove the public endpoint.
2. Enable `DeletionProtection: true`.
3. Enable Multi-AZ (`MultiAZ: false` currently) for production resilience.
4. Remove the two hardcoded IP addresses from the security group and use a VPN or bastion host for administrative access.

---

### HIGH-03 — No AWS CloudTrail Logging Enabled

**Severity:** High  
**OWASP Category:** A09:2021 – Security Logging and Monitoring Failures  
**Affected Component:** AWS Account (`244718668833`)

**Description:**  
No CloudTrail trails are configured in the AWS account. This means there is no audit log of API calls, IAM changes, ECS deployments, RDS configuration changes, or S3 access. In the event of a security incident, it would be impossible to determine what actions were taken, by whom, or when.

**Evidence:**
```
aws cloudtrail describe-trails → Trails: 0
```

**Remediation:**
1. Create a multi-region CloudTrail trail logging to a dedicated S3 bucket with server-side encryption and log file validation enabled.
2. Enable CloudTrail Insights to detect unusual API activity.
3. Configure CloudWatch Alarms for critical events (root account usage, IAM policy changes, security group modifications).

---

### MEDIUM-01 — No Rate Limiting on Application Service, KYC Service, or Institution API

**Severity:** Medium  
**OWASP Category:** API4:2023 – Unrestricted Resource Consumption  
**Affected Components:** Application Service, KYC Service, Institution API

**Description:**  
Three of the nine microservices — application-service, kyc-service, and institution-api — do not implement any rate limiting middleware. The auth-service applies a limit of 100 requests per 15 minutes per IP, but the property-api limit was temporarily increased to 2,000 requests per 15 minutes for a bulk import and was never restored. An attacker could submit thousands of housing applications, flood the KYC verification queue, or enumerate institution student data without restriction.

**Remediation:**
1. Add `express-rate-limit` middleware to all services that do not currently have it.
2. Restore the property-api rate limit to a production-appropriate value (e.g., 200 requests per 15 minutes).
3. Apply stricter limits to sensitive endpoints (e.g., 10 login attempts per 15 minutes per IP on the auth endpoint).

---

### MEDIUM-02 — JWT Tokens Stored in localStorage (XSS Accessible)

**Severity:** Medium  
**OWASP Category:** A02:2021 – Cryptographic Failures / A03:2021 – Injection  
**Affected Component:** Web Frontend (`apps/web-marketing/client/src/lib/api.ts`)

**Description:**  
Both the access token and refresh token are stored in `localStorage`:

```typescript
localStorage.setItem("digzio_token", token);
localStorage.setItem("digzio_refresh_token", refreshToken);
```

`localStorage` is accessible to any JavaScript running on the page. If an XSS vulnerability is ever introduced — through a third-party dependency, a malicious CDN script, or a future code change — an attacker can steal both tokens and impersonate the user. The refresh token has a 30-day expiry, meaning the attacker retains access for up to 30 days after the theft.

**Remediation:**  
Store tokens in `httpOnly`, `Secure`, `SameSite=Strict` cookies. This prevents JavaScript from accessing the tokens. The auth-service backend must be updated to set the cookie on login and clear it on logout. The frontend API client should be updated to send credentials with `credentials: 'include'` rather than reading from localStorage.

---

### MEDIUM-03 — No Content Security Policy on the Frontend

**Severity:** Medium  
**OWASP Category:** A03:2021 – Injection  
**Affected Component:** Web Frontend

**Description:**  
The main web application at `https://www.digzio.co.za/` does not return a `Content-Security-Policy` header. While API responses from backend services include `default-src 'none'` via Helmet, the HTML pages served by the frontend container have no CSP. This means there is no browser-enforced restriction on which scripts, styles, or resources can be loaded, increasing the impact of any XSS vulnerability.

**Remediation:**  
Add a strict CSP to the Nginx or Express configuration serving the frontend. A starting policy would be:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://digzio-property-images-prod.s3.af-south-1.amazonaws.com; connect-src 'self' https://www.digzio.co.za; frame-ancestors 'none';
```

---

### MEDIUM-04 — Verbose Internal Error Details Exposed via API (`detail` field)

**Severity:** Medium  
**OWASP Category:** A05:2021 – Security Misconfiguration  
**Affected Components:** Institution API, Application Service

**Description:**  
Several error handlers return raw database error messages in a `detail` field:

```javascript
res.status(500).json({ error: 'Server error', detail: err.message });
```

PostgreSQL error messages can reveal table names, column names, constraint names, and query structure. This information assists an attacker in crafting targeted injection or enumeration attacks.

**Remediation:**  
In production (`NODE_ENV=production`), log the full error server-side but return only a generic message to the client. Remove the `detail: err.message` field from all 500-level responses.

---

### LOW-01 — No Multi-Factor Authentication (MFA)

**Severity:** Low  
**OWASP Category:** A07:2021 – Identification and Authentication Failures  
**Affected Component:** Auth Service

**Description:**  
The platform does not implement MFA for any user role, including ADMIN and INSTITUTION users who have access to sensitive student PII and financial data. A compromised password is sufficient to gain full access to all administrative functions.

**Remediation:**  
Implement TOTP-based MFA (e.g., using the `speakeasy` library) for ADMIN and INSTITUTION roles as a minimum. Consider making MFA optional but strongly encouraged for STUDENT and PROVIDER roles.

---

### LOW-02 — JWT Access Token Expiry is 7 Days

**Severity:** Low  
**OWASP Category:** A07:2021 – Identification and Authentication Failures  
**Affected Component:** Auth Service

**Description:**  
Access tokens are issued with a 7-day expiry (`JWT_EXPIRES_IN=7d`). There is no token revocation mechanism (no token blacklist or session store). If a token is stolen, it remains valid for up to 7 days with no way to invalidate it. The refresh token has a 30-day expiry, compounding this risk.

**Remediation:**  
Reduce the access token expiry to 15–60 minutes. Implement a Redis-backed token revocation list for logout and password-change events. The existing Redis instance (`digzio-redis-prod`) is already deployed and available for this purpose.

---

### LOW-03 — No Account Lockout After Failed Login Attempts

**Severity:** Low  
**OWASP Category:** A07:2021 – Identification and Authentication Failures  
**Affected Component:** Auth Service

**Description:**  
During testing, 10 consecutive failed login attempts against a valid account produced no lockout, CAPTCHA challenge, or progressive delay. The rate limiter (100 requests per 15 minutes per IP) provides some protection against rapid brute-force attacks but does not lock accounts and can be bypassed by rotating IP addresses.

**Remediation:**  
Implement account-level lockout after 5–10 consecutive failed login attempts within a 15-minute window. Store failed attempt counts in Redis. Send an email notification to the account owner when a lockout occurs.

---

### INFO-01 — Uniform Error Messages Prevent Account Enumeration

**Severity:** Informational  
**Status:** Positive Finding

**Description:**  
The login endpoint returns the same error message (`"Invalid credentials"`) for both non-existent email addresses and incorrect passwords. This prevents account enumeration attacks.

---

### INFO-02 — Debug Collector Script Present in Public Directory

**Severity:** Informational  
**Affected Component:** Web Frontend

**Description:**  
A `debug-collector.js` file exists at `/home/ubuntu/digzio/apps/web-marketing/client/public/__manus__/debug-collector.js`. This file is not included in the production build (`dist/__manus__/` does not exist) and is not served by the live application. However, it should be removed from the repository to avoid confusion and to prevent accidental inclusion in future builds.

---

## Positive Security Findings

The following security controls were found to be correctly implemented and represent good security practice:

| Control | Status |
|---------|--------|
| All sensitive endpoints require authentication | Confirmed |
| Role-based access control enforced (STUDENT / PROVIDER / INSTITUTION / ADMIN) | Confirmed |
| SQL injection prevented via parameterised queries throughout | Confirmed |
| Passwords hashed with bcrypt (cost factor 10) | Confirmed |
| Helmet security headers applied to all API services | Confirmed |
| HSTS enabled (`max-age=15552000; includeSubDomains`) | Confirmed |
| TLS 1.3 enforced on ALB (`ELBSecurityPolicy-TLS13-1-2-2021-06`) | Confirmed |
| S3 buckets have all public access blocked | Confirmed |
| RDS storage encrypted at rest | Confirmed |
| No stack traces or SQL errors exposed in API responses | Confirmed |
| No `X-Powered-By: Express` header exposed | Confirmed |
| Zero known CVEs in frontend dependencies (`pnpm audit`) | Confirmed |

---

## Risk Summary Matrix

| ID | Title | Severity | Effort to Fix | Priority |
|----|-------|----------|---------------|----------|
| CRITICAL-01 | Hardcoded JWT secret / plaintext in ECS | Critical | Medium | Immediate |
| CRITICAL-02 | BOLA/IDOR on application endpoint | Critical | Low | Immediate |
| HIGH-01 | All secrets as plaintext ECS env vars | High | Medium | Sprint 1 |
| HIGH-02 | RDS publicly accessible, no deletion protection | High | Low | Sprint 1 |
| HIGH-03 | No CloudTrail logging | High | Low | Sprint 1 |
| MEDIUM-01 | Missing rate limiting on 3 services | Medium | Low | Sprint 2 |
| MEDIUM-02 | JWT in localStorage (XSS accessible) | Medium | Medium | Sprint 2 |
| MEDIUM-03 | No CSP on frontend | Medium | Low | Sprint 2 |
| MEDIUM-04 | Verbose error detail in 500 responses | Medium | Low | Sprint 2 |
| LOW-01 | No MFA for admin/institution roles | Low | High | Sprint 3 |
| LOW-02 | 7-day access token expiry, no revocation | Low | Medium | Sprint 3 |
| LOW-03 | No account lockout after failed logins | Low | Low | Sprint 3 |

---

## Recommended Remediation Roadmap

### Immediate Actions (Before Next User Onboarding)

1. **Rotate the JWT secret** to a cryptographically random value and update all ECS task definitions.
2. **Fix the BOLA vulnerability** in `GET /api/v1/applications/:id` by adding an ownership check.

### Sprint 1 (Within 2 Weeks)

3. Migrate all secrets from ECS `environment` to AWS Secrets Manager.
4. Set `PubliclyAccessible: false` and `DeletionProtection: true` on the RDS instance.
5. Enable a multi-region CloudTrail trail with S3 logging and log file validation.

### Sprint 2 (Within 4 Weeks)

6. Add rate limiting to application-service, kyc-service, and institution-api.
7. Migrate JWT storage from `localStorage` to `httpOnly` cookies.
8. Add a Content Security Policy header to the frontend.
9. Remove `detail: err.message` from all 500-level API responses.

### Sprint 3 (Within 8 Weeks)

10. Implement TOTP-based MFA for ADMIN and INSTITUTION roles.
11. Reduce access token expiry to 15 minutes and implement Redis-backed revocation.
12. Implement account lockout after 5 consecutive failed login attempts.

---

## Appendix A — Test Accounts Used

| Email | Role | Purpose |
|-------|------|---------|
| `demo.admin@digzio.co.za` | ADMIN | Admin privilege tests |
| `demo.institution@digzio.co.za` | INSTITUTION | Institution endpoint tests |
| `amahle.dube2026@digzio.co.za` | STUDENT | BOLA/IDOR source account |
| `sipho.ndlovu2026@digzio.co.za` | STUDENT | BOLA/IDOR target account |

## Appendix B — Tools and Commands Used

- AWS CLI (`aws ecs`, `aws rds`, `aws ec2`, `aws s3api`, `aws cloudtrail`, `aws elbv2`)
- `curl` — dynamic API testing
- Static source code analysis via `grep` across all route files
- `pnpm audit` — frontend dependency vulnerability scan

---

*This report was produced through automated static analysis and dynamic testing of the production environment. It does not constitute a full penetration test. A manual penetration test by a qualified security professional is recommended prior to processing live NSFAS payment data or student identity documents.*

**End of Report**
