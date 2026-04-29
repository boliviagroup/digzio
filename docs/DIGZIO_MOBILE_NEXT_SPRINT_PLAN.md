# Digzio Mobile App — Next Sprint Plan & Timeline

**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Mobile Application (iOS & Android)

---

## 1. Context & Readiness

With the Digzio web platform and backend microservices fully deployed, tested, and live on AWS (`af-south-1`), the foundation for the mobile application is completely solid. The 8 backend microservices (Auth, Property, Application, KYC, Lease, Institution, Image, and Notification) are stable, meaning mobile development will experience **zero backend-blocking dependencies**.

The mobile app will be built using **React Native (Expo)** with **TypeScript** and **Tailwind CSS (NativeWind)**. Because the backend is ready, we can adopt a highly accelerated, AI-driven sprint schedule.

---

## 2. Next Sprint Overview: Foundation & The Student Journey

The immediate next sprint (Sprint 1) will focus on establishing the mobile codebase, implementing secure authentication, and delivering the core "Student Journey"—allowing students to browse properties, complete KYC, and submit applications.

**Sprint Duration:** 5 Days (Accelerated Timeline)  
**Primary Actors:** Student Users

### 2.1 Sprint Objectives
1. Initialize the Expo React Native monorepo with strict TypeScript and ESLint rules.
2. Implement secure JWT authentication connected to the live `auth-service`.
3. Build the interactive property discovery map using PostGIS data from the `property-api`.
4. Develop the student KYC document upload flow.
5. Create the end-to-end rental application submission process.

---

## 3. Detailed Timeline & Deliverables

### Day 1: Architecture & Authentication
The first day focuses on scaffolding the app and securing user access.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Project Initialization** | Setup Expo, NativeWind (Tailwind), and React Navigation. Configure environment variables for AWS ALB endpoints. | N/A |
| **Component Library** | Build reusable UI components (Buttons, Inputs, Cards) matching the Digzio web brand guidelines. | N/A |
| **Auth Screens** | Develop Login and Registration screens with form validation. | `POST /api/v1/auth/login` |
| **Secure Storage** | Implement JWT storage using Expo SecureStore and configure the Axios/Fetch interceptors for token attachment. | `POST /api/v1/auth/refresh` |

### Day 2: Student Profiles & KYC Verification
Day two ensures students can manage their identity, a prerequisite for applying to properties.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Student Dashboard** | Build the "My Profile" view showing application statistics and current KYC status. | `GET /api/v1/auth/me` |
| **KYC Upload UI** | Create the mobile-native KYC form using Expo DocumentPicker for ID uploads. | `POST /api/v1/kyc/submit` |
| **KYC Status Polling** | Implement UI states for "Not Started", "Under Review", and "Verified". | `GET /api/v1/kyc/status` |

### Day 3: Property Discovery & Geospatial Search
Day three brings the core value proposition to life: finding accommodation.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Property Feed** | Build a high-performance list view (using FlashList) of available properties with image carousels. | `GET /api/v1/properties` |
| **Interactive Map** | Implement `react-native-maps` to visually plot properties. | `GET /api/v1/properties` |
| **Search & Filters** | Add mobile-friendly filter drawers for Price, NSFAS Accreditation, and Location. | `GET /api/v1/properties` |
| **Property Details** | Create the rich detail screen showing amenities, provider info, and POSA compliance data. | `GET /api/v1/properties/:id` |

### Day 4: Applications & Lease Viewing
Day four connects the student to the provider by enabling the application flow.

| Task | Description | Backend API |
|------|-------------|-------------|
| **Application Form** | Build the multi-step mobile application form, pulling in the user's KYC data automatically. | `POST /api/v1/applications` |
| **Application Tracking** | Create the "My Applications" tab to track status (Submitted, Pending NSFAS, Approved, Rejected). | `GET /api/v1/applications/my` |
| **Lease Integration** | Implement a mobile PDF viewer to display generated lease agreements once approved. | `GET /api/v1/leases/my` |

### Day 5: Testing, Optimization & Review
The final day ensures the app is robust, performant, and ready for the next phase.

| Task | Description |
|------|-------------|
| **Performance Profiling** | Optimize image caching (using `expo-image`) and ensure 60fps scrolling on the property feed. |
| **Edge Case Handling** | Implement offline-state UI warnings and loading skeletons for slow network conditions. |
| **End-to-End Testing** | Run automated and manual tests on both iOS Simulator and Android Emulator covering the full Auth → KYC → Search → Apply flow. |
| **Sprint Demo** | Record a screen capture of the working mobile flows for stakeholder review. |

---

## 4. Dependencies & Risks

### 4.1 Resolved Dependencies
- **Backend APIs:** All required endpoints are live and tested. No backend development is required for this sprint.
- **Database Schema:** The POSA compliance and application schemas are finalized.
- **Authentication:** JWT infrastructure is fully operational.

### 4.2 Potential Risks
- **App Store Review Guidelines:** Ensuring the KYC document upload flow complies with Apple and Google privacy guidelines regarding data collection.
- **Map Performance:** Rendering a large number of property pins on older Android devices may require clustering optimization early in Day 3.

---

## 5. Looking Ahead: Sprint 2 (The Provider Journey)

Following the successful completion of Sprint 1, the subsequent sprint will focus on the **Provider Journey**. This will include:
- Provider portfolio dashboard and occupancy metrics.
- Mobile property listing creation (including taking photos directly from the device camera).
- Application review and approval interface.
- Push notifications for new applications (integrating with the existing AWS SES/Notification service).

By utilizing the existing robust backend, the Digzio mobile app can be brought to market rapidly without compromising on features or security.
