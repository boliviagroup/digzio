# Digzio Platform — Sprint 3: Backend Services Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 3 Backend Overview

While the frontend team builds the Provider Web Portal in Sprint 3, the backend team must finalize and expose the APIs required to support property onboarding. 

Although the foundational endpoints were stubbed out in Sprint 2, Sprint 3 requires the implementation of the complex business logic: handling PostGIS spatial data, orchestrating S3 direct uploads, enforcing compliance rules, and synchronizing data to Elasticsearch.

**Duration:** 2 Weeks (Weeks 5–6)  
**Primary Deliverables:** Property Service (Geo-spatial logic), Image Repository Service (S3 Orchestration), Compliance Service (State Machine), and Elasticsearch Sync Engine.

---

## 2. Service Details

### 2.1 Property Service: Geo-Spatial Logic (`PROP-01` Extension)

The property creation endpoint must now handle exact coordinates to enable proximity searches for students in Sprint 4.

**Key Technical Decisions:**
- **PostGIS Integration:** The payload receives standard decimal `lat` and `lng`. The backend must convert this into a PostGIS `GEOMETRY` object before inserting it into PostgreSQL.
- **Data Validation:** Zod (or Joi) is used at the controller level to ensure coordinates fall within the bounding box of South Africa.

**Database Interaction:**
```sql
-- Example of the internal SQL executed by the ORM/Query Builder
INSERT INTO properties (provider_id, title, location, status)
VALUES (
  'uuid', 
  'Oak House', 
  ST_SetSRID(ST_MakePoint(lng, lat), 4326), 
  'DRAFT'
);
```

---

### 2.2 Image Repository Service: S3 Orchestration (`PROP-02` Extension)

The backend must securely orchestrate direct-to-S3 uploads without touching the binary data itself.

**Data Flow & Business Logic:**
1. **Pre-Signed URL Generation:** When `POST /api/v1/properties/{id}/images/upload-url` is called, the backend uses the AWS SDK to generate a temporary (15-minute) signed URL.
2. **Metadata Constraints:** The backend enforces constraints in the signed URL (e.g., `content-length-range` max 5MB, `Content-Type` must be `image/jpeg` or `image/png`).
3. **Database Write:** Once the frontend successfully uploads the image to S3, it calls `POST /api/v1/properties/{id}/images/confirm`. The backend verifies the object exists in S3 and writes the CDN URL to the `property_images` table.

---

### 2.3 Compliance Service: State Machine (`PRV-04`)

Properties cannot be shown to students until they are legally compliant. This service acts as the state machine governing the `properties.status` field.

**Business Logic Rules:**
- A property is created as `DRAFT`.
- A provider uploads required documents (Fire Safety, Zoning) via the Compliance Service (using the same S3 pre-signed URL pattern, but to a *private* bucket).
- Once all mandatory documents are uploaded, the property status transitions to `PENDING_REVIEW`.
- (In a later sprint, Admins will review these. For the MVP Soft Launch, we will auto-approve or use a basic admin script to transition them to `ACTIVE`).

**Core API Contracts:**

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/api/v1/properties/{id}/compliance/upload-url` | `POST` | `document_type` (e.g., `FIRE_SAFETY`) | Returns a pre-signed URL for a private S3 bucket. |
| `/api/v1/properties/{id}/compliance/confirm` | `POST` | `document_type`, `s3_key` | Verifies upload and records it in `compliance_documents` table. Evaluates if property can move to `PENDING_REVIEW`. |

---

### 2.4 Elasticsearch Sync Engine (`ENG-02`)

The most critical engineering task of Sprint 3. The PostgreSQL database is the source of truth, but Elasticsearch is the read-optimized search engine that students will query.

**Technical Implementation:**
- **Pattern:** Change Data Capture (CDC) or Application-Level Eventing.
- **Decision for MVP:** To avoid the complexity of deploying Debezium/Kafka for the MVP, we will use Application-Level Eventing via Redis.
- **Flow:**
  1. The Property Service updates a property status to `ACTIVE`.
  2. The service publishes a `PropertyActivated` event to a Redis Pub/Sub channel.
  3. A background worker (the Sync Engine) consumes the event.
  4. The worker fetches the full, denormalized property document (including amenities, primary image, and `lat/lng`) from PostgreSQL.
  5. The worker indexes the document into AWS OpenSearch (Elasticsearch).

**Elasticsearch Mapping (Index Schema):**
The index must be configured to support `geo_point` queries.
```json
{
  "mappings": {
    "properties": {
      "location": { "type": "geo_point" },
      "base_price_monthly": { "type": "float" },
      "amenities": { "type": "keyword" }
    }
  }
}
```

---

## 3. Sprint 3 Backend Acceptance Criteria

By the end of Week 6, the backend must satisfy the following:

1. **Geo-Spatial Insertion:** Creating a property successfully writes a valid PostGIS geometry point.
2. **S3 Orchestration:** Requesting an upload URL returns a valid AWS Signature V4 URL restricted to 5MB and image types.
3. **State Machine Enforcement:** It is impossible to transition a property to `ACTIVE` via the API if it lacks a `FIRE_SAFETY` compliance document.
4. **Search Sync:** When a property is marked `ACTIVE` in PostgreSQL, it appears in the Elasticsearch index within 5 seconds.
