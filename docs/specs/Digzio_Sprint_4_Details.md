# Digzio Platform — Sprint 4: Student Experience & KYC Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 4 Overview

Sprint 4 is the inflection point of the Digzio project. With the infrastructure hardened (Sprint 1), backend APIs live (Sprint 2), and the first real properties loaded by providers (Sprint 3), it is time to open the doors to the demand side: **Students**.

This sprint builds the **Student App** (frontend) and the supporting **Search & KYC Services** (backend). The primary goal is to allow a student to discover properties, verify their identity securely, and prepare their profile for NSFAS funding applications (which follow in Sprint 5).

**Duration:** 2 Weeks (Weeks 7–8)  
**Primary Deliverables:** Property Search UI, Property Details View, Onfido KYC Integration, Student Dashboard, and Elasticsearch Query Engine.

---

## 2. Frontend: Student App (`apps/web-student`)

The Student App is designed as a mobile-first Progressive Web App (PWA) using React, as the vast majority of South African students will access the platform via smartphones.

### 2.1 Property Search & Discovery (`STU-01`)

The core discovery experience. Students must be able to find relevant, affordable housing near their campus instantly.

**UI Components:**
- **Search Bar:** Autocomplete for university names (e.g., "University of Cape Town", "Wits").
- **Filter Drawer:** Price range slider, NSFAS-accredited toggle, distance from campus radius (e.g., "< 2km"), and amenities checkboxes (Wi-Fi, Backup Power).
- **Results Feed:** A scrollable list of property cards displaying the primary thumbnail, price, distance, and a prominent "NSFAS Approved" badge if applicable.
- **Map View:** A toggle to view results on a Google Maps interface with clustered pins.

**API Wiring:**
- Calls `GET /api/v1/search/properties` with query parameters (`lat`, `lng`, `radius`, `min_price`, `max_price`, `nsfas_only`).

---

### 2.2 Detailed Property View (`STU-02`)

When a student clicks a property card, they need all the information required to make a housing decision.

**UI Components:**
- **Image Carousel:** Swipeable full-screen gallery with progressive loading to save mobile data.
- **Key Details:** Price, bed availability, lease term options (10-month vs 12-month).
- **Provider Trust Box:** Displays the landlord's verification status and compliance badges (Fire Safety, Zoning).
- **Sticky CTA:** A persistent "Apply Now" or "Save for Later" button at the bottom of the viewport.

---

### 2.3 Student Dashboard & Action Center (`STU-03`)

The post-login landing page for students.

**UI Components:**
- **Action Center Alert:** A highly visible banner prompting the student to complete their profile or KYC verification before they can apply for housing.
- **Saved Properties:** A horizontal scroll of properties the student has bookmarked.
- **Application Status Tracker:** A stepper component showing the progress of any active applications (built fully in Sprint 5, stubbed here).

---

## 3. Backend: Search & KYC Services

### 3.1 Search Query Engine (`STU-01` Backend)

This service translates the frontend's REST API calls into complex Elasticsearch queries.

**Key Technical Decisions:**
- **Geo-Distance Queries:** Elasticsearch's `geo_distance` query is used to find properties within the requested radius of the selected university campus.
- **Pagination:** Cursor-based pagination (using Elasticsearch `search_after`) is implemented instead of offset pagination to ensure high performance on mobile infinite scroll.

**Core API Contract:**

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/api/v1/search/properties` | `GET` | Query params: `lat`, `lng`, `radius`, `nsfas_only` | Returns a paginated list of `ACTIVE` properties matching the criteria, sorted by distance or price. |

---

### 3.2 Onfido KYC Integration (`KYC-01`)

Identity verification is legally required to prevent fraud and is a prerequisite for NSFAS funding approval. Digzio integrates with Onfido for automated biometric checks.

**Data Flow (The KYC Loop):**
1. Student clicks "Verify Identity" in the app.
2. Frontend requests an Onfido SDK token from `POST /api/v1/kyc/token`.
3. Backend generates a secure token tied to the student's `user_id` and returns it.
4. Frontend initializes the Onfido Web SDK. The student takes a photo of their SA ID card and records a live selfie video.
5. The SDK uploads the media directly to Onfido's secure servers.
6. Onfido processes the check asynchronously (usually < 30 seconds).
7. Onfido fires a secure Webhook back to Digzio: `POST /api/v1/webhooks/onfido`.
8. The backend verifies the webhook signature, updates the `users.kyc_status` to `VERIFIED` or `FAILED`, and emits a Redis Pub/Sub event to notify the frontend via WebSocket.

**Key Technical Decisions:**
- **Zero PII Storage:** Digzio does *not* store the images of the ID cards or the selfies in its own S3 buckets. All biometric data remains securely within Onfido's compliant vault. Digzio only stores the `kyc_status` and the Onfido `check_id` for audit purposes. This drastically reduces POPIA liability.

---

## 4. Sprint 4 Acceptance Criteria & End State

By the end of Week 8, the following must be true:

1. **Search Performance:** A geo-spatial search query returns results from Elasticsearch in under 200ms.
2. **Data Efficiency:** The property image carousel loads low-resolution placeholders first, swapping to high-resolution only when the image enters the viewport.
3. **KYC Security:** A student can successfully complete an Onfido check via the frontend SDK, and the backend webhook correctly updates their status to `VERIFIED` in the PostgreSQL database.
4. **Access Control:** A student who is *not* `VERIFIED` cannot progress past the "Apply Now" button on a property (they are redirected to the KYC flow).

**Milestone Reached:** The platform now has both supply (properties) and demand (students). Students can browse, save, and verify their identities. The stage is perfectly set for Sprint 5: The Application Engine and NSFAS Integration.
