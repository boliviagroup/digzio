# Digzio Mobile App Development Plan

**Project Overview:** Full-stack development of the Digzio mobile application (iOS & Android) connecting to the existing AWS af-south-1 microservices backend. The app will focus on the Student and Provider flows first, with Institution features to follow.
**Tech Stack:** React Native (Expo), TypeScript, Tailwind CSS (NativeWind), Redux Toolkit/React Query for state management.
**Total Estimated Duration:** 8 Sprints (16 Weeks)
**Sprint Duration:** 2 Weeks per Sprint

This plan breaks down the mobile app development into structured sprints, individual sessions, and effort estimates.

## Phase 1: Foundation & Core Authentication (Sprints 1-2)

### Sprint 1: Project Setup & Authentication
**Goal:** Establish the React Native monorepo, configure navigation, and implement secure JWT authentication connecting to the existing Auth Service.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 1.1 | **Initialize Expo Project:** Setup TypeScript, ESLint, Prettier, and NativeWind (Tailwind for React Native). Configure environment variables for dev/prod API endpoints. | 1 Day |
| 1.2 | **Navigation Architecture:** Implement React Navigation (Stack and Tab Navigators) for the core app structure (Auth Stack vs. Main App Stack). | 2 Days |
| 1.3 | **UI Component Library:** Build foundational reusable UI components (Buttons, Inputs, Cards, Typography) matching the Digzio brand guidelines. | 2 Days |
| 1.4 | **Authentication Flow (UI):** Develop Login, Registration, and Forgot Password screens. | 2 Days |
| 1.5 | **Auth API Integration:** Connect to the `auth-service` (Port 3001). Implement secure JWT storage using Expo SecureStore and handle token refresh logic. | 3 Days |

**Sprint 1 Total Estimate:** 10 Days

### Sprint 2: User Profiles & KYC Integration
**Goal:** Allow users to manage their profiles and implement the student KYC verification flow.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 2.1 | **User Profile Screens:** Build the "My Profile" dashboard for both Students and Providers. | 2 Days |
| 2.2 | **Profile API Integration:** Connect to the `user-service` (Port 3003) to fetch and update user details. | 2 Days |
| 2.3 | **KYC Document Upload UI:** Create screens for students to upload ID documents and proof of enrollment using Expo ImagePicker and DocumentPicker. | 3 Days |
| 2.4 | **KYC API Integration:** Connect to the `kyc-service` (Port 3005) for document submission and status polling (Pending, Verified, Rejected). | 2 Days |
| 2.5 | **Sprint Review & Testing:** End-to-end testing of Auth and KYC flows on iOS Simulators and Android Emulators. | 1 Day |

**Sprint 2 Total Estimate:** 10 Days

## Phase 2: The Student Journey (Sprints 3-4)

### Sprint 3: Property Discovery & Search
**Goal:** Enable students to search, filter, and view property listings using the existing PostGIS geospatial queries.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 3.1 | **Home Dashboard (Student):** Build the main student feed highlighting featured properties and nearby options. | 2 Days |
| 3.2 | **Map Integration:** Implement `react-native-maps` to display properties visually. Connect to the `institution-api` (Port 3008) to show properties near the student's campus. | 3 Days |
| 3.3 | **Search & Filter UI:** Develop advanced filtering (Price, Beds, NSFAS Accredited, Amenities). | 2 Days |
| 3.4 | **Property Details Screen:** Build a rich property view with image carousels, amenity lists, and provider details. | 2 Days |
| 3.5 | **Property API Integration:** Connect search, filter, and details views to the `property-api` (Port 3002). | 1 Day |

**Sprint 3 Total Estimate:** 10 Days

### Sprint 4: Applications & Leases
**Goal:** Allow students to apply for properties and view their lease agreements.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 4.1 | **Application Flow UI:** Create a multi-step form for students to submit a rental application. | 2 Days |
| 4.2 | **Application API Integration:** Connect to the `application-service` (Port 3006) to submit applications and view status (Pending, Approved, Rejected). | 2 Days |
| 4.3 | **My Applications Dashboard:** Build a screen for students to track all active and past applications. | 2 Days |
| 4.4 | **Lease Viewing:** Integrate with the `lease-service` (Port 3007) to fetch approved leases. Implement a PDF viewer to display the generated lease agreements. | 3 Days |
| 4.5 | **Sprint Review & Testing:** End-to-end testing of the complete student journey. | 1 Day |

**Sprint 4 Total Estimate:** 10 Days

## Phase 3: The Provider Journey (Sprints 5-6)

### Sprint 5: Property Management
**Goal:** Enable property providers to list and manage their portfolios directly from the app.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 5.1 | **Provider Dashboard:** Build a high-level overview of the provider's portfolio (Total beds, Occupancy rate, Pending applications). | 2 Days |
| 5.2 | **Create Listing Flow (UI):** Develop a multi-step form for adding new properties, including image uploads and location tagging. | 3 Days |
| 5.3 | **Listing API Integration:** Connect property creation and editing to the `property-api` (Port 3002). | 2 Days |
| 5.4 | **Portfolio Management:** Screens to view, edit, and toggle the status (Active/Inactive) of existing listings. | 2 Days |
| 5.5 | **Image Handling Optimization:** Implement image compression and optimized S3 uploads from the mobile client. | 1 Day |

**Sprint 5 Total Estimate:** 10 Days

### Sprint 6: Tenant & Lease Management
**Goal:** Allow providers to review applications, approve tenants, and manage active leases.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 6.1 | **Application Review UI:** Build screens for providers to view incoming student applications, including their KYC and NSFAS status. | 2 Days |
| 6.2 | **Application Action Integration:** Connect to the `application-service` to approve or reject applications. | 2 Days |
| 6.3 | **Lease Generation Trigger:** Connect to the `lease-service` to trigger PDF generation upon application approval. | 2 Days |
| 6.4 | **Active Tenants Dashboard:** Create a view for providers to manage currently active leases and tenant contact info. | 2 Days |
| 6.5 | **Sprint Review & Testing:** End-to-end testing of the complete provider journey. | 2 Days |

**Sprint 6 Total Estimate:** 10 Days

## Phase 4: Polish, Push Notifications & Launch (Sprints 7-8)

### Sprint 7: Notifications & Institution Basics
**Goal:** Implement real-time push notifications and basic Institution views.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 7.1 | **Push Notification Setup:** Configure Expo Push Notifications and Apple APNs/Firebase FCM. | 2 Days |
| 7.2 | **Notification Service Integration:** Connect the mobile client tokens to the `notification-service` (Port 3004) to receive alerts (e.g., "Application Approved"). | 3 Days |
| 7.3 | **In-App Notifications Center:** Build a notification inbox UI to view historical alerts. | 2 Days |
| 7.4 | **Institution Linking (Student):** Add UI for students to link themselves to an Institution (connecting to `institution-api`). | 2 Days |
| 7.5 | **Institution Read-Only View:** Basic screens for Institution users to view their linked students' statuses. | 1 Day |

**Sprint 7 Total Estimate:** 10 Days

### Sprint 8: App Store Preparation & Beta Launch
**Goal:** Finalize the app, fix bugs, and deploy to the App Store and Google Play.

| Session | Task Description | Estimate |
| :--- | :--- | :--- |
| 8.1 | **Performance Optimization:** Profile the app using React Native tools. Optimize list rendering (FlashList) and image caching. | 3 Days |
| 8.2 | **Bug Bashing:** Resolve any UI/UX inconsistencies and handle edge cases (offline states, slow network handling). | 3 Days |
| 8.3 | **App Store Assets:** Generate app icons, splash screens, and promotional screenshots for the stores. | 1 Day |
| 8.4 | **EAS Build & Submit:** Configure Expo Application Services (EAS) to build production binaries (.ipa and .aab). | 2 Days |
| 8.5 | **TestFlight & Google Play Console:** Upload binaries, fill out metadata, and submit for App Store Review and Google Play Internal Testing. | 1 Day |

**Sprint 8 Total Estimate:** 10 Days

---

## Summary of Estimates

* **Total Sprints:** 8
* **Total Development Days:** 80 Days (~16 Weeks for a single developer, faster with a team)
* **Backend Readiness:** Since the 8 microservices are already live on AWS af-south-1 and fully tested via Postman/E2E scripts, the mobile app development is purely focused on frontend UI and API integration, significantly reducing backend blocking dependencies.
