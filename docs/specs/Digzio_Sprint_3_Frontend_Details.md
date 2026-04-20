# Digzio Platform — Sprint 3: Provider Web Portal Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 3 Overview

Sprint 3 marks the transition from pure backend infrastructure to user-facing product. The goal is to build the **Provider Web Portal** (React + Vite + TypeScript) so that the first cohort of real landlords can log in, create their profiles, and upload their properties. 

This sprint is critical because it populates the marketplace with real supply (properties) before the demand side (students) is invited in Sprint 4.

**Duration:** 2 Weeks (Weeks 5–6)  
**Primary Deliverables:** Provider Dashboard, Property Listing Form, Image Gallery Uploader, Compliance Document Upload, and Elasticsearch Sync.

---

## 2. Frontend Application Architecture

The Provider Portal (`apps/web-provider`) is a Single Page Application (SPA).

**Key Technical Decisions:**
- **Framework:** React 18 with TypeScript.
- **Styling:** Tailwind CSS with a customized design system (Digzio UI) for consistent component reuse.
- **State Management:** React Query (TanStack Query) for server state caching and synchronization; Zustand for local UI state.
- **Form Handling:** React Hook Form integrated with Zod for robust client-side validation before API submission.
- **Routing:** React Router DOM with protected route wrappers checking JWT validity.

---

## 3. Screen & Component Details

### 3.1 Provider Main Dashboard (`PRV-01`)

The landing screen for landlords after authentication. It provides a high-level overview of their portfolio.

**UI Components:**
- **KPI Tiles:** 
  - *Total Properties* (Count of active vs. draft listings)
  - *Occupancy Rate* (Percentage of filled beds)
  - *Pending Applications* (Count of applications awaiting review)
- **Recent Activity Feed:** A chronological list of system notifications (e.g., "Property 'Oak House' approved by Admin").
- **Quick Actions:** Prominent "Add New Property" CTA button.

**API Wiring:** 
- Calls `GET /api/v1/properties/my-portfolio` to populate the KPI tiles.
- In Sprint 3, "Occupancy" and "Applications" will read zero, as students do not exist yet.

---

### 3.2 Property Listing Wizard (`PRV-02`)

A multi-step form wizard for creating a new property. Breaking it into steps prevents user fatigue and ensures high data quality.

**Wizard Steps:**
1. **Basic Details:** Title, description, property type (e.g., Apartment, Commune, House).
2. **Location:** Address input with Google Places Autocomplete integration. Captures exact `lat/lng` for the backend PostGIS database.
3. **Room & Pricing Configuration:** Number of beds, base monthly price, NSFAS accreditation status flag.
4. **Amenities Checklist:** Wi-Fi, laundry, security, parking, backup power (critical in SA context).

**API Wiring:**
- Client-side Zod validation ensures no empty fields.
- Submits payload to `POST /api/v1/properties`.
- On success, transitions the property to `DRAFT` status and routes the user to the Image Gallery step.

---

### 3.3 Image Gallery Uploader (`PRV-03`)

The most complex UI component in Sprint 3. Landlords must upload high-quality images to attract students.

**UI Components:**
- **Drag-and-Drop Zone:** Accepts multiple `.jpg` or `.png` files (max 5MB each).
- **Preview Grid:** Displays uploaded images as thumbnail cards.
- **Categorization Dropdown:** Forces the user to tag each image (e.g., "Exterior", "Bedroom", "Kitchen").
- **Reorder Capability:** Drag-and-drop sorting to define the `display_order` (the first image becomes the primary thumbnail).

**API Wiring (Direct-to-S3):**
1. React requests a pre-signed URL from `POST /api/v1/properties/{id}/images/upload-url`.
2. React uploads the binary file directly to the AWS S3 bucket using the pre-signed URL via `PUT`.
3. React polls `GET /api/v1/properties/{id}/images` until the backend confirms the Lambda function has generated the thumbnail.

---

### 3.4 Compliance Document Upload (`PRV-04`)

To ensure student safety and NSFAS compliance, properties cannot go `ACTIVE` without verified documentation.

**UI Components:**
- **Document Slots:** Specific upload zones for "Fire Safety Certificate", "Zoning Approval", and "NSFAS Accreditation Letter" (if applicable).
- **Status Badges:** Visual indicators showing "Pending Review", "Approved", or "Rejected" for each document.

**API Wiring:**
- Similar direct-to-S3 upload flow as images, but files are stored in a private bucket with strict IAM access controls (only Digzio Admins can view them).
- Submits to `POST /api/v1/properties/{id}/compliance`.

---

### 3.5 Elasticsearch Sync (`ENG-02`)

While the frontend is being built, the backend team implements the search index.

**Technical Implementation:**
- A PostgreSQL trigger or CDC (Change Data Capture) pipeline using Debezium listens for changes to the `properties` table.
- When a property transitions from `DRAFT` to `ACTIVE`, the record is asynchronously pushed to the AWS OpenSearch (Elasticsearch) cluster.
- **Why?** In Sprint 4, students will need to search properties by location, price, and amenities instantly. Querying PostgreSQL directly for complex geospatial text searches is too slow at scale.

---

## 4. Sprint 3 Acceptance Criteria & End State

By the end of Week 6, the following must be true:

1. **End-to-End Flow:** A landlord can log in, click "Add Property", complete the wizard, upload 5 images, upload a fire certificate, and see their property listed as `DRAFT` on their dashboard.
2. **Performance:** Image uploads to S3 succeed within 5 seconds for a 2MB file.
3. **Data Quality:** It is impossible to submit a property without a valid `lat/lng` coordinate.
4. **Search Readiness:** An `ACTIVE` property is verifiable in the Elasticsearch index within 60 seconds of approval.

**Milestone 1 Reached:** At this point, the Digzio Ops team will invite 5–10 friendly landlords to use the live Staging environment to upload the very first real properties. The marketplace now has supply.
