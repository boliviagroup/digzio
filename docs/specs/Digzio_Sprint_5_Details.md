# Digzio Platform — Sprint 5: Application Engine & NSFAS Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 5 Overview

Sprint 5 is the transaction engine of the Digzio platform. It bridges the demand (Sprint 4) and the supply (Sprint 3) by enabling students to apply for properties. 

Crucially, this sprint introduces the **NSFAS API Integration** — the core differentiator of the platform. By automatically verifying a student's funding status, Digzio removes the manual administrative burden from landlords and ensures students are only placed in properties they can afford.

**Duration:** 2 Weeks (Weeks 9–10)  
**Primary Deliverables:** Student Application Flow, NSFAS Verification Engine, Provider Application Review Interface, and WhatsApp & Email Notifications.

---

## 2. The Application State Machine

Every application in Digzio follows a strict lifecycle governed by the `applications` table.

| State | Trigger | Meaning |
|---|---|---|
| `PENDING_NSFAS` | Student submits application | Waiting for NSFAS API response. |
| `PENDING_REVIEW` | NSFAS API returns `FUNDED` | Application is now visible to the landlord. |
| `REJECTED_NSFAS` | NSFAS API returns `UNFUNDED` | Application dies here. Landlord never sees it. |
| `ACCEPTED` | Landlord clicks "Accept" | Student secures the room; triggers lease generation. |
| `REJECTED` | Landlord clicks "Reject" | Room goes to next applicant. |
| `CANCELLED` | Student withdraws | Student found another property. |

---

## 3. Frontend: Student & Provider Interfaces

### 3.1 Student Application Flow (`APP-01`)

The flow a student follows after clicking "Apply Now" on a property.

**UI Components:**
- **Room Selection:** If the property has multiple room types (e.g., Single vs. Sharing), the student selects one.
- **Lease Term:** Select 10-month or 12-month lease.
- **NSFAS Consent Checkbox:** A legally binding checkbox granting Digzio permission to query the student's ID number against the NSFAS database (POPIA requirement).
- **Status Tracker:** A real-time stepper on the Student Dashboard showing the application moving through the state machine.

### 3.2 Provider Application Review (`PRV-05`)

The interface where landlords review incoming, pre-vetted applications.

**UI Components:**
- **Kanban Board or Data Table:** Columns for "New Applications", "Reviewing", and "Accepted".
- **Application Card:** Displays the student's name, requested room type, and a prominent green **"NSFAS Verified"** badge.
- **Action Buttons:** "Accept Applicant" or "Decline".
- **Capacity Warning:** If accepting the student exceeds the `total_beds` of the property, the UI disables the "Accept" button.

---

## 4. Backend: Application & NSFAS Services

### 4.1 Application Engine (`APP-01` Backend)

The orchestrator of the transaction. It ensures business rules are enforced before an application is created.

**Business Logic Rules Enforced on `POST /api/v1/applications`:**
1. **KYC Check:** Is `users.kyc_status == 'VERIFIED'`? (If no, return `403 Forbidden`).
2. **Duplicate Check:** Does the student already have an `ACCEPTED` application elsewhere? (If yes, return `409 Conflict`).
3. **Capacity Check:** Does the property have available beds? (If no, return `400 Bad Request`).

If all checks pass, the application is created in `PENDING_NSFAS` state.

### 4.2 NSFAS Integration Engine (`NSF-01`)

This service communicates securely with the external NSFAS API.

**Data Flow:**
1. Application created → emits `ApplicationCreated` event.
2. NSFAS Engine picks up the event and extracts the student's SA ID number.
3. Engine makes a mutual-TLS (mTLS) secured REST call to the NSFAS endpoint: `GET /api/v1/nsfas/verify/{id_number}`.
4. **If NSFAS returns `FUNDED`:** Engine updates application to `PENDING_REVIEW` and emits `ApplicationReadyForReview` event.
5. **If NSFAS returns `UNFUNDED`:** Engine updates application to `REJECTED_NSFAS` and emits `ApplicationFailed` event.

*Fallback Strategy:* If the NSFAS API is down (a common occurrence), the engine implements an exponential backoff retry queue (using Redis/BullMQ) for up to 24 hours.

### 4.3 WhatsApp & Email Notifications (`NOT-02`)

Because South African students may not always have active mobile data for push notifications, critical state changes are sent via WhatsApp.

**Trigger Events for WhatsApp:**
- Application reaches `PENDING_REVIEW` ("Great news! Your NSFAS funding is verified. Your application is now with the landlord.")
- Application reaches `ACCEPTED` ("Congratulations! You got the room at Oak House. Log in to sign your lease.")

---

## 5. Sprint 5 Acceptance Criteria & End State

By the end of Week 10, the following must be true:

1. **Transaction Integrity:** A student cannot apply for a property that is full, nor can they apply if their KYC is incomplete.
2. **NSFAS Shield:** A landlord *never* sees an application in their dashboard unless the NSFAS API has explicitly returned a `FUNDED` status.
3. **Resilience:** If the external NSFAS API times out, the Digzio backend queues the verification and retries automatically without failing the student's request.
4. **Communication:** WhatsApp Business API successfully delivers an WhatsApp to the student's verified phone number when the landlord clicks "Accept".

**Milestone Reached:** The core loop is closed. Supply exists, demand exists, and transactions can be executed securely with automated financial vetting. The platform is functionally complete for the MVP. Sprint 6 will focus purely on hardening, security, and load testing before the public soft launch.
