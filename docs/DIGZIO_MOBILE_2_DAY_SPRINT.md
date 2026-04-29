# Digzio Mobile App — 2-Day Accelerated Build Plan

**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Mobile Application (iOS & Android)

---

## 1. The 48-Hour Strategy

With only 2 days to deliver the mobile app, we must ruthlessly prioritize the **core marketplace loop**. The goal is to build a functional, native wrapper around the existing APIs that allows Providers to manage applications and Students to find housing. 

We will drop complex features (e.g., in-app lease PDF generation, advanced map clusters) and focus entirely on the highest-value screens. The design system will rely heavily on NativeWind (Tailwind) to match the web app without writing custom CSS.

---

## 2. Day 1: Foundation & The Student Journey

The first day establishes the app shell, secures authentication, and delivers the core student experience: finding a property and applying.

### Morning (Hours 0-4): App Shell & Auth
- **Expo Initialization:** Set up React Native (Expo), NativeWind, and React Navigation.
- **Global Design Tokens:** Inject the exact Digzio web colors (`#0F2D4A` Navy, `#1A9BAD` Teal) and Space Grotesk fonts into the Tailwind config.
- **Authentication Flow:** Build Login and Registration screens. Wire them to `POST /api/v1/auth/login` and store the JWT in `expo-secure-store`.

### Afternoon (Hours 4-8): Property Discovery
- **Property Feed:** Build a `FlashList` of all available properties, pulling from `GET /api/v1/properties`. Display the newly uploaded S3 images using `expo-image` for caching.
- **Property Detail Screen:** Create a clean view showing price, beds, amenities, and a prominent "Apply Now" button.

### Evening (Hours 8-12): Student Dashboard & Applications
- **Application Submission:** Build a streamlined application form wired to `POST /api/v1/applications`.
- **Student Dashboard:** Create a simple tab showing the student's KYC status and a list of their submitted applications (Pending/Approved/Rejected).

---

## 3. Day 2: The Provider Journey & Launch Prep

The second day shifts focus to the Provider, giving them the tools to review and approve the applications submitted by students on Day 1.

### Morning (Hours 0-4): Provider Dashboard & Portfolio
- **Provider Dashboard:** Build the overview screen showing total properties and pending applications, wired to `GET /api/v1/properties/my`.
- **Portfolio List:** Display the provider's properties with active/inactive toggles.

### Afternoon (Hours 4-8): Application Management
- **Applications Inbox:** Build a list of incoming student applications (`GET /api/v1/applications/provider`).
- **Review & Approve:** Create the detail view showing the student's NSFAS/KYC status, and wire the "Approve" and "Reject" buttons to `PATCH /api/v1/applications/:id/status`. (This will trigger the existing AWS SES email notifications).

### Evening (Hours 8-12): Polish & Build
- **Bug Bashing:** Fix navigation glitches, ensure safe area insets are respected, and test on both iOS and Android simulators.
- **EAS Build Configuration:** Setup `eas.json` and trigger the Expo Application Services build to generate the `.apk` (Android) and iOS simulator build.

---

## 4. What is Cut (Post-Launch Backlog)

To hit the 2-day deadline, the following features are deferred:
1. **In-App Property Creation:** Providers will use the web dashboard to add new properties. The mobile app will be read/manage only.
2. **Push Notifications:** We will rely on the existing AWS SES email notifications for application approvals instead of native push.
3. **Interactive Maps:** The property feed will be a list view; map integration (`react-native-maps`) is deferred.
4. **In-App PDF Viewer:** Leases will be handled via the web platform or emailed.

By focusing strictly on the core marketplace loop, we can deliver a polished, functional mobile app in 48 hours.
