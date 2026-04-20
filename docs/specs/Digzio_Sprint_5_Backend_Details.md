# Digzio Platform — Sprint 5: Backend Services Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 5 Backend Overview

Sprint 5 represents the core transaction engine of the Digzio platform. While earlier sprints handled identity (Sprint 2) and inventory (Sprint 3), Sprint 5 handles the actual matching of supply and demand via the **Application Engine** and the **NSFAS Integration Engine**.

This sprint is characterized by complex state machines, external API integrations with strict security requirements (mTLS), and robust error handling to account for the unreliability of government API endpoints.

**Duration:** 2 Weeks (Weeks 9–10)  
**Primary Deliverables:** Application Engine (State Machine), NSFAS Integration Engine (External API Orchestrator), Provider Review API (Capacity Enforcement), and Twilio Notification Service (Event-Driven SMS).

---

## 2. Service Details

### 2.1 Application Engine (`APP-01` Backend)

This service is the central state machine for the platform. It manages the lifecycle of a student's request to rent a property.

**Core Business Logic (Pre-Flight Checks):**
Before an application is written to the database, the service enforces strict invariants:
1. **KYC Constraint:** Queries `users.kyc_status`. If not `VERIFIED`, rejects with `403 Forbidden`.
2. **Duplication Constraint:** Queries `applications` table. If the student already has an `ACCEPTED` application for the same academic year, rejects with `409 Conflict`.
3. **Capacity Constraint:** Queries `properties.total_beds` minus count of `ACCEPTED` applications. If capacity is 0, rejects with `400 Bad Request`.

**Database Interaction:**
```sql
-- Transactional insert ensuring state is PENDING_NSFAS
BEGIN;
INSERT INTO applications (student_id, property_id, status, lease_term)
VALUES ('uuid', 'uuid', 'PENDING_NSFAS', 10)
RETURNING application_id;
COMMIT;
```

**Event Emission:**
Upon successful insertion, the service publishes an `ApplicationCreated` event to Redis Pub/Sub, which is immediately consumed by the NSFAS Engine.

---

### 2.2 NSFAS Integration Engine (`NSF-01`)

This is the most critical external integration. It queries the National Student Financial Aid Scheme (NSFAS) to verify if a student has approved funding for the current academic year.

**Security Requirements:**
- **mTLS (Mutual TLS):** The connection to the NSFAS API requires a client certificate issued by a trusted CA, in addition to standard API keys.
- **POPIA Compliance:** The student's ID number is only transmitted in the encrypted payload and is never logged in plaintext in application logs.

**Resilience Architecture (BullMQ):**
Because the NSFAS API is historically prone to downtime, this service implements an exponential backoff retry strategy using BullMQ (backed by Redis).
1. Initial attempt fails (e.g., `503 Service Unavailable`).
2. Job is pushed to the retry queue.
3. Attempts occur at 1 min, 5 min, 30 min, 2 hr, 6 hr, and 24 hr intervals.
4. If it fails after 24 hours, the application status is set to `NSFAS_TIMEOUT` and flagged for manual admin intervention.

**State Transitions:**
- If NSFAS returns `FUNDED`: Application status updates to `PENDING_REVIEW`.
- If NSFAS returns `UNFUNDED`: Application status updates to `REJECTED_NSFAS`.

---

### 2.3 Provider Review API (`PRV-05` Backend)

This API serves the Provider Dashboard, allowing landlords to see and act upon pre-vetted applications.

**Data Isolation:**
The `GET /api/v1/providers/applications` endpoint includes a strict `WHERE status = 'PENDING_REVIEW'` clause. A landlord **never** sees an application that is still awaiting NSFAS verification or has been rejected by NSFAS.

**Concurrency Control (The Double-Booking Problem):**
When a landlord clicks "Accept" (`POST /api/v1/applications/{id}/accept`), the backend must prevent race conditions where two landlords accept the same student simultaneously, or one landlord accepts more students than they have beds.

**Technical Implementation:**
- **Pessimistic Locking:** The service uses PostgreSQL `SELECT ... FOR UPDATE` on the `properties` row to lock the capacity count during the transaction.
- **Atomic Update:**
  ```sql
  UPDATE applications SET status = 'ACCEPTED' WHERE application_id = 'uuid';
  -- Automatically triggers a rejection for all other PENDING_REVIEW applications for this student
  UPDATE applications SET status = 'CANCELLED' WHERE student_id = 'uuid' AND status = 'PENDING_REVIEW';
  ```

---

### 2.4 Twilio Notification Service (`NOT-02`)

An extension of the Notification Service built in Sprint 2. It now listens for application state changes and dispatches SMS messages.

**Event-Driven Architecture:**
1. Application Engine updates status to `ACCEPTED`.
2. Engine publishes `ApplicationAccepted` event to Redis.
3. Notification Service consumes event.
4. Service queries `users.phone_number`.
5. Service calls Twilio API: `POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`.

**Cost Optimization:**
SMS in South Africa is expensive (~$0.13 per message). The backend implements logic to only send SMS for critical state changes (`PENDING_REVIEW` and `ACCEPTED`). Marketing or non-critical alerts default to email via SendGrid.

---

## 3. Sprint 5 Backend Acceptance Criteria

By the end of Week 10, the backend must satisfy the following:

1. **Transaction Integrity:** It is impossible for a student to have two `ACCEPTED` applications simultaneously. The database constraints and backend logic must enforce this.
2. **NSFAS Shielding:** A database query confirms that no application with `status = 'PENDING_NSFAS'` is ever returned to a provider's API request.
3. **Resilience Testing:** Simulating a `500 Internal Server Error` from the mocked NSFAS endpoint successfully triggers the BullMQ exponential backoff retry mechanism.
4. **Concurrency Safety:** A load test simulating 5 simultaneous "Accept" requests for a property with only 1 bed remaining results in 1 success (`200 OK`) and 4 failures (`400 Bad Request - Capacity Reached`).
