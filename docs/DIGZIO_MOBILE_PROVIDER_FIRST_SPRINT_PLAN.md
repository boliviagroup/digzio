# Digzio Mobile App — Accelerated Sprint Plan (Provider First)

**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Mobile Application (iOS & Android)

---

## 1. Strategic Rationale: Why Start with the Provider Journey?

Reversing the development order to build the **Provider Journey** first is a highly strategic move for a marketplace platform like Digzio.

1. **Supply Precedes Demand:** In any two-sided marketplace (Airbnb, Uber, Digzio), supply (properties) must exist before demand (students) can be fulfilled. If students download the app and find no listings, they will churn immediately. By empowering providers first, the platform can build a robust inventory of high-quality, POSA-compliant properties.
2. **Mobile Utility for Providers:** Providers are often on the move—visiting properties, taking photos, or meeting contractors. A mobile app allows them to snap photos and create listings directly from their phones, dramatically reducing friction compared to a desktop web upload process.
3. **Data Seeding:** Real provider usage will naturally seed the database with authentic properties and images, creating a rich testing environment for the subsequent Student Journey sprint.

---

## 2. Sprint 1: Foundation & The Provider Journey

The first mobile sprint will focus on establishing the mobile codebase, implementing secure authentication, and delivering the core tools providers need to manage their portfolios and applications on the go.

**Sprint Duration:** 5 Days (Accelerated Timeline)  
**Primary Actors:** Property Providers

### Day 1: Architecture & Authentication
The first day focuses on scaffolding the app and securing provider access.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Project Initialization** | Setup Expo, NativeWind (Tailwind), and React Navigation. Configure environment variables for AWS ALB endpoints. | N/A |
| **Component Library** | Build reusable UI components (Buttons, Inputs, Cards) matching the Digzio web brand guidelines. | N/A |
| **Auth Screens** | Develop Login and Registration screens with form validation tailored for Providers. | `POST /api/v1/auth/login` |
| **Secure Storage** | Implement JWT storage using Expo SecureStore and configure the Axios/Fetch interceptors. | `POST /api/v1/auth/refresh` |

### Day 2: Provider Dashboard & Portfolio Overview
Day two gives providers a high-level view of their business.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Provider Dashboard** | Build the main overview screen showing total properties, active beds, and pending applications. | `GET /api/v1/properties/my` |
| **Portfolio List** | Create a scrollable list (using FlashList) of all owned properties with quick status toggles (Active/Inactive). | `GET /api/v1/properties/my` |
| **POSA Summary** | Add a summary card showing the provider's overall POSA compliance status across their portfolio. | `GET /api/v1/properties/my` |

### Day 3: Mobile Property Creation & Image Uploads
Day three leverages mobile hardware (camera) to make listing creation frictionless.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Listing Flow UI** | Develop a multi-step form for adding new properties (Basic Info, Pricing, Amenities, POSA Details). | `POST /api/v1/properties` |
| **Camera Integration** | Integrate `expo-camera` and `expo-image-picker` to allow providers to take or select property photos. | N/A |
| **S3 Uploads** | Wire the image selection to the Image API to upload photos directly to Amazon S3. | `POST /api/v1/images/upload` |

### Day 4: Application Management & Approvals
Day four allows providers to review and act on incoming student demand.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Applications Inbox** | Build a dedicated tab listing all incoming student applications, sortable by status and property. | `GET /api/v1/applications/provider` |
| **Application Details** | Create a detailed view showing the student's profile, KYC verification status, and NSFAS funding status. | `GET /api/v1/applications/:id` |
| **Approval Workflow** | Implement the action buttons (Approve/Reject) and wire them to update the application status. | `PATCH /api/v1/applications/:id/status` |

### Day 5: Push Notifications & Polish
The final day adds real-time engagement and prepares the app for testing.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Push Notifications** | Configure Expo Push Notifications to alert providers when a new application is received. | `POST /api/v1/notifications/push` |
| **Performance Profiling** | Optimize image caching (using `expo-image`) and ensure smooth transitions. | N/A |
| **End-to-End Testing** | Run automated and manual tests on both iOS Simulator and Android Emulator covering the full Provider flow. | N/A |

---

## 3. Looking Ahead: Sprint 2 (The Student Journey)

Once providers are equipped to list properties and manage applications, Sprint 2 will focus entirely on the **Student Journey**. This will include:
- Geospatial property search and interactive map discovery.
- Mobile KYC document uploads (using the device camera for ID capture).
- The student application submission flow.
- Push notifications alerting students when their applications are approved.

By starting with the Provider Journey, we ensure that when the Student Journey is launched, the platform is already populated with high-quality, verified housing inventory.
