# Digzio Mobile App Development Plan (Manus AI Driven)

**Project Overview:** Full-stack development of the Digzio mobile application (iOS & Android) connecting to the existing AWS af-south-1 microservices backend. The app will focus on the Student and Provider flows first, with Institution features to follow.
**Developer:** Manus AI (Autonomous Agent)
**Tech Stack:** React Native (Expo), TypeScript, Tailwind CSS (NativeWind), Redux Toolkit/React Query.
**Total Estimated Duration:** 4 Accelerated Sprints (8-10 Days Total)
**Sprint Duration:** 2-3 Days per Sprint

This plan reflects the hyper-accelerated timeline possible when an autonomous AI agent like Manus handles the development. Because the 8 backend microservices are already live, tested, and patched in AWS af-south-1, Manus can rapidly generate UI, connect APIs, and test flows without being blocked by backend dependencies.

## Phase 1: Foundation, Auth & KYC (Sprint 1)
**Goal:** Establish the React Native monorepo, configure navigation, implement secure JWT authentication, and build the student KYC verification flow.
**Estimated Duration:** 2 Days

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 1.1 | **Initialize Expo Project:** Setup TypeScript, ESLint, Prettier, and NativeWind. Configure environment variables for AWS ALB endpoints. | 2 Hours |
| 1.2 | **Navigation & UI Library:** Implement React Navigation (Auth vs. Main App Stack). Build foundational reusable UI components (Buttons, Inputs, Cards). | 4 Hours |
| 1.3 | **Authentication Flow:** Develop Login/Registration screens and connect to the `auth-service` (Port 3001). Implement secure JWT storage. | 4 Hours |
| 1.4 | **User Profiles:** Build the "My Profile" dashboard connecting to the `user-service` (Port 3003). | 3 Hours |
| 1.5 | **KYC Integration:** Create screens for document upload and status polling. Connect to the `kyc-service` (Port 3005). | 3 Hours |

## Phase 2: The Student Journey (Sprint 2)
**Goal:** Enable students to search properties using PostGIS, apply for housing, and view their lease agreements.
**Estimated Duration:** 2.5 Days

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 2.1 | **Property Discovery:** Build the main student feed and map integration (`react-native-maps`). Connect to `institution-api` for nearby properties. | 5 Hours |
| 2.2 | **Search & Details:** Develop advanced filtering and rich property views. Connect to the `property-api` (Port 3002). | 4 Hours |
| 2.3 | **Application Flow:** Create the multi-step rental application form. Connect to the `application-service` (Port 3006). | 4 Hours |
| 2.4 | **Lease Viewing:** Integrate with the `lease-service` (Port 3007) to fetch approved leases. Implement a PDF viewer. | 3 Hours |
| 2.5 | **E2E Testing:** Automated script testing of the complete student journey via the Expo client. | 2 Hours |

## Phase 3: The Provider Journey (Sprint 3)
**Goal:** Enable property providers to list portfolios, review student applications, and manage active leases.
**Estimated Duration:** 2 Days

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 3.1 | **Provider Dashboard:** Build the portfolio overview (Occupancy, Pending applications). | 3 Hours |
| 3.2 | **Create Listing Flow:** Develop the multi-step form for adding new properties (images, location). Connect to `property-api`. | 5 Hours |
| 3.3 | **Application Review:** Build screens to view incoming student applications (KYC/NSFAS status) and approve/reject via `application-service`. | 4 Hours |
| 3.4 | **Tenant Management:** Create views for managing active leases and triggering PDF generation via `lease-service`. | 3 Hours |
| 3.5 | **E2E Testing:** Automated script testing of the complete provider journey. | 1 Hour |

## Phase 4: Polish, Notifications & Launch Prep (Sprint 4)
**Goal:** Implement real-time push notifications, basic Institution views, and prepare the app for EAS Build.
**Estimated Duration:** 2 Days

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 4.1 | **Push Notifications:** Configure Expo Push Notifications. Connect tokens to the `notification-service` (Port 3004). | 4 Hours |
| 4.2 | **Institution Basics:** Add UI for students to link to Institutions and basic read-only views for Institution users. | 3 Hours |
| 4.3 | **Performance Optimization:** Profile and optimize list rendering (FlashList) and image caching. | 3 Hours |
| 4.4 | **Bug Bashing:** Resolve UI inconsistencies and handle edge cases (offline states, slow networks). | 4 Hours |
| 4.5 | **EAS Build Configuration:** Setup `eas.json` to build production binaries (.ipa and .aab) for manual App Store submission. | 2 Hours |

---

## Summary of AI-Accelerated Estimates

* **Total Sprints:** 4 Accelerated Sprints
* **Total Development Time:** ~8.5 Days
* **Why it's faster:** 
  1. **No Backend Wait Time:** The 8 AWS microservices are already live, tested, and stable.
  2. **Continuous Context:** Manus AI retains the full schema, API routes, and business logic context from building the backend, eliminating the need for API discovery or documentation reading.
  3. **Parallel Execution:** Automated code generation, refactoring, and testing happen at machine speed.
