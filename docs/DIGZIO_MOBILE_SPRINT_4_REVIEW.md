# Digzio Mobile App — Sprint 4 Review: Polish, Push Notifications & Launch

**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Mobile Application (iOS & Android)

---

## 1. Sprint Context

Under the revised **Provider-First Strategy**, the mobile app development is structured into four accelerated sprints. Sprint 1 and 2 deliver the core Provider and Student journeys respectively. Sprint 3 focuses on property discovery and geospatial search. 

**Sprint 4** is the final sprint before launch. It focuses on closing the loop with real-time push notifications, optimizing performance, and preparing the app binaries for App Store and Google Play submission. Because the backend microservices (including the `notification-service`) are already live, this sprint is entirely focused on frontend integration and platform release mechanics.

---

## 2. Sprint 4 Goals & Objectives

The primary objectives for Sprint 4 are:
1. **Real-Time Engagement:** Implement push notifications so providers are instantly alerted of new applications, and students are notified of approval/rejection.
2. **Performance & Polish:** Ensure the app feels native, fast, and adheres strictly to the Digzio design system (Space Grotesk typography, Navy/Teal gradients, and card-based layouts).
3. **App Store Readiness:** Generate all necessary assets, configure Expo Application Services (EAS), and submit the app for review.

---

## 3. Detailed Session Breakdown (5 Days)

Sprint 4 is designed to be completed in 5 working days, assuming the foundation from Sprints 1-3 is stable.

### Day 1: Push Notification Infrastructure
The first day focuses on the plumbing required to deliver push notifications to both iOS and Android devices using Expo's notification service.

| Task | Description | Backend API / Service |
|------|-------------|-----------------------|
| **Expo Push Setup** | Configure `expo-notifications`. Request user permissions on first login and retrieve the Expo Push Token. | Expo SDK |
| **Token Registration** | Send the device push token to the backend so it can be associated with the user's profile. | `PATCH /api/v1/users/push-token` |
| **Foreground Handling** | Implement listeners to handle notifications received while the app is actively in use (e.g., showing an in-app toast). | N/A |

### Day 2: Notification Center & Deep Linking
Day two builds the UI for users to view their notification history and ensures tapping a notification routes them to the correct screen.

| Task | Description | Backend API / Service |
|------|-------------|-----------------------|
| **Notification Inbox** | Build a dedicated "Notifications" tab showing a historical list of alerts (e.g., "Application Approved"). | `GET /api/v1/notifications` |
| **Deep Linking Configuration** | Configure React Navigation to handle incoming URLs and notification payloads, routing the user directly to the relevant application or lease. | N/A |
| **Backend Trigger Wiring** | Verify the existing `notification-service` correctly triggers Expo Push payloads when application statuses change. | `notification-service` |

### Day 3: Performance Optimization & Design Audit
Day three is dedicated to making the app feel premium and ensuring it perfectly matches the web platform's design system.

| Task | Description | Focus Area |
|------|-------------|------------|
| **Image Caching** | Replace standard `Image` components with `expo-image` for aggressive caching of property photos (served via CloudFront). | Performance |
| **List Optimization** | Audit all `FlashList` implementations (property feed, applications list) to ensure 60fps scrolling performance. | Performance |
| **Design System Audit** | Do a final pass against the `DIGZIO_MOBILE_DESIGN_SPEC`. Ensure exact hex codes (`#0F2D4A` Navy, `#1A9BAD` Teal) and Space Grotesk font weights are used consistently. | UI/UX Polish |

### Day 4: App Store Assets & EAS Configuration
Day four prepares the app for the public.

| Task | Description | Tooling |
|------|-------------|---------|
| **Asset Generation** | Create the iOS/Android app icons, splash screens, and promotional screenshots for the store listings. | Figma / Expo Image Tools |
| **EAS Build Setup** | Configure `eas.json` for production builds. Manage iOS provisioning profiles and Android keystores. | Expo Application Services |
| **Production Build** | Trigger the EAS build process to generate the `.ipa` (iOS) and `.aab` (Android) production binaries. | EAS CLI |

### Day 5: Submission & Beta Launch
The final day is focused on submitting the binaries to the respective app stores.

| Task | Description | Platform |
|------|-------------|----------|
| **TestFlight Distribution** | Upload the `.ipa` to App Store Connect and distribute it to internal testers via TestFlight. | App Store Connect |
| **Google Play Internal Track** | Upload the `.aab` to the Google Play Console and release it to the internal testing track. | Google Play Console |
| **Store Metadata** | Finalize the app descriptions, keywords, privacy policy links, and support URLs for the public store listings. | Both Stores |

---

## 4. Dependencies & Prerequisites

To successfully execute Sprint 4, the following must be true:
- The **Apple Developer Program** and **Google Play Developer** accounts must be active and accessible.
- The `notification-service` must be updated to accept and utilize Expo Push Tokens alongside its existing AWS SES email functionality.
- The `user-service` must have a database column to store the user's current push token.

---

## 5. Expected Outcomes

At the conclusion of Sprint 4, Digzio will have:
1. A fully functional, performant mobile application for both iOS and Android.
2. Real-time push notifications bridging the gap between Provider actions and Student awareness.
3. Production binaries submitted to Apple and Google, ready for public release.
