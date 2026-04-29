# Digzio Tech Stack & Mobile Apps — Presentation Content Outline

## Slide 1: Title
**Digzio Technology Overview**
Subtitle: Full-Stack Architecture, Microservices & Mobile Apps (iOS + Android)

---

## Slide 2: Architecture Overview
**A Production-Grade Microservices Platform Running on AWS Cape Town**
- 9 independent services deployed on AWS ECS (Fargate) in af-south-1 (Cape Town)
- Each service containerised with Docker (Node.js 20 Alpine)
- All services behind an Application Load Balancer with HTTPS
- Data stored in TiDB (distributed MySQL-compatible) + Redis caching
- Assets served via AWS CloudFront CDN
- Domain: www.digzio.co.za

---

## Slide 3: Frontend — Web Platform
**React + TypeScript + Vite: A Modern, Responsive Web Application**
- Framework: React 18 + TypeScript
- Build tool: Vite (fast HMR, optimised bundles)
- Styling: TailwindCSS + Radix UI component library
- State: React Query (server state) + Zustand (local state)
- Forms: React Hook Form + Zod validation
- Routing: Wouter (lightweight SPA routing)
- Animations: Framer Motion
- Charts: Recharts
- Served via Node.js/Express static server in Docker container
- Deployed to AWS ECS (digzio-web-frontend)

---

## Slide 4: Backend Microservices
**8 Specialised Node.js Services — Each Independently Deployable**

| Service | Port | Responsibility |
|---------|------|---------------|
| auth-service | 3001 | JWT auth, bcrypt, Redis sessions, rate limiting |
| property-api | 3002 | Property listings, search, NSFAS accreditation |
| application-service | 3003 | Student applications, status tracking |
| image-api | 3004 | S3 upload, Sharp image processing, CloudFront URLs |
| kyc-service | 3005 | KYC document upload, verification workflow |
| lease-service | 3006 | PDF lease generation (pdf-lib), S3 storage |
| notification-service | 3007 | AWS SES email notifications, Redis queuing |
| institution-api | 3008 | University/institution management |

All services: Express.js + Helmet security + CORS + Winston logging

---

## Slide 5: Data & Storage
**TiDB + Redis + AWS S3 + CloudFront — Built for Scale**
- **Primary DB:** TiDB (distributed, MySQL-compatible) — horizontal scaling, ACID transactions
- **Cache:** Redis — JWT session management, rate limiting, API response caching
- **File Storage:** AWS S3 — property images, KYC documents, lease PDFs
- **CDN:** AWS CloudFront — low-latency image delivery across South Africa
- **Email:** AWS SES — transactional emails (applications, KYC updates, lease notifications)

---

## Slide 6: Infrastructure & DevOps
**AWS af-south-1 (Cape Town) — Fully Containerised, Production-Ready**
- **Container Registry:** AWS ECR (9 repositories)
- **Orchestration:** AWS ECS Fargate (serverless containers, no EC2 management)
- **Cluster:** digzio-cluster-prod (9 services running)
- **Load Balancer:** AWS ALB with SSL termination
- **CI/CD:** Docker build → ECR push → ECS force-deploy
- **Runtime:** Node.js 20 Alpine (minimal, secure base image)
- **Region:** af-south-1 (Cape Town) — lowest latency for South African users

---

## Slide 7: Mobile App — React Native (iOS + Android)
**One Codebase, Two Platforms — Built with Expo & React Native**
- Framework: Expo SDK + React Native
- Language: TypeScript
- Navigation: Expo Router (file-based) + React Navigation (native stack + bottom tabs)
- Styling: NativeWind (TailwindCSS for React Native)
- State: TanStack Query (React Query) + Zustand
- Forms: React Hook Form + Zod
- Images: expo-image (optimised)
- Camera/Picker: expo-camera + expo-image-picker (for KYC document upload)
- Secure Storage: expo-secure-store (JWT token storage)
- Performance: Shopify FlashList (high-performance lists), Reanimated + Gesture Handler
- Bundle ID: co.za.digzio.mobile (both iOS and Android)

---

## Slide 8: Mobile Build & Distribution
**EAS Build — Cloud-Based Native Builds for iOS and Android**
- Build Service: Expo Application Services (EAS Build)
- **Android:** APK (internal testing) + AAB (Google Play production)
  - Android APK available NOW: expo.dev/artifacts/eas/8Lc9PW1dPy9huqnEmvM1mV.apk
  - Google Play: Internal track ready (google-play-service-account.json configured)
- **iOS:** Simulator build queued (build ID: 6c4b3de9)
  - Full IPA build pending Apple Developer Program activation ($99/year enrolled)
  - Bundle: co.za.digzio.mobile
  - App Store Connect: developer@digzio.co.za
- **OTA Updates:** Expo EAS Update (push JS updates without app store review)
- **Environments:** development / preview / production profiles

---

## Slide 9: Security Architecture
**Security-First Design Across Every Layer**
- JWT authentication with short-lived tokens + Redis session management
- bcrypt password hashing (auth-service)
- Helmet.js HTTP security headers on all services
- Rate limiting on auth, property, and notification services
- CORS configured per service
- HTTPS enforced via ALB SSL termination
- KYC document verification workflow (identity + proof of registration)
- Secure token storage on mobile (expo-secure-store, not AsyncStorage)
- S3 presigned URLs for private document access (KYC, lease PDFs)

---

## Slide 10: Closing — Built for Scale
**Production-Grade Today. Ready to Scale to 1M Users.**
- Live at www.digzio.co.za — serving real users today
- Android APK available for immediate testing
- iOS build pending Apple Developer activation
- Architecture supports horizontal scaling via ECS Fargate
- Database (TiDB) designed for distributed scale
- CDN ensures fast asset delivery across all 9 SA provinces
- Next: NSFAS direct payment API integration, university SSO, holiday rental module
