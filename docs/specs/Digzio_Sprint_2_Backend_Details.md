# Digzio Platform — Sprint 2: Backend Services Detail

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Sprint 2 Overview

Sprint 2 builds upon the infrastructure foundation laid in Sprint 1. The focus shifts entirely to the **Core Backend Engine** — the APIs and microservices that power the Digzio platform. No frontend UI is built yet; the goal is to have a fully functional, secure, and testable backend that the frontend teams can consume in Sprint 3.

**Duration:** 2 Weeks (Weeks 3–4)  
**Primary Deliverables:** Authentication Service, RBAC Middleware, Property API, Image Repository API, and Notification Service.

---

## 2. Service Details

### 2.1 Authentication Service (`AUTH-01`)

This service handles user registration, login, and secure session management using OAuth 2.0 / OIDC standards. It issues JSON Web Tokens (JWT) for stateless authentication across the platform.

**Key Technical Decisions:**
- **Password Hashing:** Argon2id (industry standard for password hashing, superior to bcrypt).
- **Token Strategy:** Short-lived Access Token (15 minutes) + HTTP-only, secure, SameSite Refresh Token (7 days, Domain=.digzio.co.za for cross-subdomain sharing).
- **Session Revocation:** Redis is used to maintain a "blacklist" of revoked refresh tokens for immediate logout or account suspension.

**Core API Contracts:**

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/api/v1/auth/register` | `POST` | `email`, `password`, `first_name`, `last_name`, `role` | Creates a new user in the `users` table. Returns 201 Created. |
| `/api/v1/auth/login` | `POST` | `email`, `password` | Validates credentials. Returns Access Token in body, Refresh Token in secure cookie. |
| `/api/v1/auth/refresh` | `POST` | (Cookie) | Issues a new Access Token if the Refresh Token is valid and not blacklisted in Redis. |
| `/api/v1/auth/logout` | `POST` | (Cookie) | Blacklists the Refresh Token in Redis and clears the cookie. |

---

### 2.2 Role-Based Access Control Middleware (`AUTH-02`)

Digzio has four distinct user roles: `STUDENT`, `PROVIDER`, `INSTITUTION`, and `ADMIN`. This middleware sits behind the API Gateway and ensures users can only access endpoints authorized for their role.

**Data Flow:**
1. Request arrives at API Gateway.
2. Gateway forwards to backend service.
3. RBAC Middleware intercepts.
4. Validates JWT signature.
5. Extracts `role` from JWT payload.
6. Checks if `role` is permitted for the requested route.
7. If permitted, passes to controller. If not, returns `403 Forbidden`.

*Example: A `STUDENT` attempting to `POST /api/v1/properties` (create a listing) will be blocked at the middleware layer before the property service is even invoked.*

---

### 2.3 Property Listing API (`PROP-01`)

The core engine for landlords to manage their accommodation portfolio. This service interacts heavily with the PostgreSQL `properties` table and utilizes the PostGIS extension for location data.

**Key Technical Decisions:**
- **Geo-Spatial Data:** The `location` field is stored as a PostGIS `GEOMETRY(Point, 4326)` to enable efficient "find properties within X km of campus" queries later.
- **Draft State:** Properties default to `DRAFT` status upon creation. They cannot be published (`ACTIVE`) until compliance documents are uploaded and verified.

**Core API Contracts:**

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/api/v1/properties` | `POST` | `title`, `description`, `address`, `property_type`, `total_beds`, `base_price_monthly`, `lat`, `lng` | Creates a new property listing (Requires `PROVIDER` role). |
| `/api/v1/properties/{id}` | `PUT` | Partial property object | Updates an existing listing. Middleware ensures the user owns the property. |
| `/api/v1/properties/my-portfolio` | `GET` | None | Returns all properties owned by the authenticated provider. |

---

### 2.4 Per-Property Image Repository API (`PROP-02`)

Images are the most bandwidth-intensive part of the platform. This service handles secure, direct-to-S3 uploads to keep heavy image traffic off the backend servers.

**Data Flow (Pre-Signed URLs):**
1. Provider requests to upload an image: `POST /api/v1/properties/{id}/images/upload-url`.
2. Backend validates ownership and generates a temporary, secure AWS S3 Pre-Signed URL.
3. Provider's frontend uploads the image *directly* to S3 using the URL.
4. S3 triggers an AWS Lambda function to generate a thumbnail.
5. Frontend notifies backend of completion; backend saves the CDN URLs to the `property_images` table.

**Core API Contracts:**

| Endpoint | Method | Payload | Purpose |
|---|---|---|---|
| `/api/v1/properties/{id}/images/upload-url` | `POST` | `filename`, `content_type`, `category` | Returns a pre-signed S3 URL for direct upload. |
| `/api/v1/properties/{id}/images` | `GET` | None | Returns all images for a property, sorted by `display_order`. |
| `/api/v1/properties/{id}/images/reorder` | `PUT` | Array of `image_id`s in new order | Updates the `display_order` for the gallery. |

---

### 2.5 Notification Service (`NOT-01`)

A decoupled microservice responsible for dispatching transactional emails via SendGrid. In Sprint 2, it is implemented to handle user onboarding.

**Key Technical Decisions:**
- **Asynchronous Processing:** The Auth service does not wait for the email to send. It publishes a "UserRegistered" event to a Redis Pub/Sub channel or simple queue.
- **Worker Process:** The Notification service listens for events and dispatches the email via the SendGrid API. This ensures the login/registration flow remains lightning fast even if SendGrid is slow.

**Sprint 2 Implementation:**
- **Trigger:** Successful registration via `/api/v1/auth/register`.
- **Action:** SendGrid API is called with the "Welcome to Digzio" dynamic template.
- **Logging:** A record is inserted into the `notifications` table for in-app display.

---

## 3. Sprint 2 Acceptance Criteria & End State

By the end of Week 4, the following must be true:

1. **Postman/Insomnia Collection:** A complete API collection exists and all endpoints return expected `200/201` or `4xx/5xx` responses.
2. **Security:** It is impossible to access a protected route without a valid JWT. It is impossible for a Student to create a property.
3. **Data Integrity:** Creating a property successfully writes to the PostgreSQL database with correct foreign keys linking to the provider.
4. **Storage:** Images can be uploaded via Pre-Signed URLs and are successfully served via the CloudFront CDN.

With this backend engine live, **Phase 2 (Sprint 3)** can commence, where the React frontend is built to consume these exact APIs.
