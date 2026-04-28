# Digzio Mobile App

React Native (Expo) mobile application for the Digzio student accommodation platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 51 + React Native |
| Language | TypeScript |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Styling | NativeWind (Tailwind CSS for RN) + StyleSheet |
| State | Zustand + AsyncStorage (JWT persistence) |
| HTTP | Axios (connected to live AWS microservices) |
| Images | expo-image (CloudFront CDN caching) |
| Fonts | Space Grotesk (matches web platform exactly) |
| Gradients | expo-linear-gradient |
| Camera | expo-camera + expo-image-picker |
| Build | EAS Build (Expo Application Services) |

## Design System

The mobile app is a pixel-faithful replica of the Digzio web platform at [www.digzio.co.za](https://www.digzio.co.za).

### Color Palette

```
Navy:    #0F2D4A  — Headers, titles, primary text
Teal:    #1A9BAD  — Buttons, links, accent
Cyan:    #2EC4C4  — Gradient end, highlights
Green:   #10B981  — Approved, verified, success
Amber:   #F59E0B  — Pending, warning
Red:     #EF4444  — Rejected, error
White:   #FFFFFF  — Card backgrounds
Off-White: #F5F7FA — App background
```

### Typography

All screens use **Space Grotesk** exclusively:
- Regular (400) — body text
- SemiBold (600) — subtitles, labels
- Bold (700) — card titles, buttons
- ExtraBold (800) — hero stats, screen titles

## Project Structure

```
digzio-mobile/
├── App.tsx                          # Entry point, font loading, navigation
├── app.json                         # Expo config (bundle ID, icons, splash)
├── eas.json                         # EAS Build config (dev/preview/production)
├── tailwind.config.js               # NativeWind config with Digzio tokens
├── assets/
│   └── fonts/                       # Space Grotesk font files (5 weights)
└── src/
    ├── theme/index.ts               # Design tokens (colors, spacing, shadows)
    ├── services/api.ts              # Axios API client → live AWS backend
    ├── hooks/useAuth.ts             # Zustand auth store + JWT management
    ├── navigation/index.tsx         # App navigator (auth + role-based tabs)
    ├── components/
    │   └── common/
    │       ├── Button.tsx           # Primary/Navy/Outline button variants
    │       ├── Input.tsx            # Labelled text input with error state
    │       └── StatusBadge.tsx      # Application/KYC status badge
    └── screens/
        ├── auth/
        │   ├── LoginScreen.tsx      # Login → auth-service JWT
        │   └── RegisterScreen.tsx   # Register (Provider or Student)
        ├── provider/
        │   ├── ProviderDashboardScreen.tsx     # Overview stats + POSA summary
        │   ├── ProviderPortfolioScreen.tsx     # Property list with status
        │   ├── PropertyDetailProviderScreen.tsx # Full property view + edit
        │   ├── ProviderApplicationsScreen.tsx  # Applications inbox + filters
        │   └── ApplicationDetailScreen.tsx     # Approve/Reject/NSFAS/Lease
        └── student/
            ├── StudentDashboardScreen.tsx      # KYC banner + app tracker
            ├── PropertyFeedScreen.tsx          # Property list with search/filter
            ├── PropertyDetailStudentScreen.tsx # Property detail + Apply Now
            └── MyApplicationsScreen.tsx        # Application history + progress
```

## Backend API Endpoints

All requests go to `https://www.digzio.co.za` via the AWS ALB.

| Service | Base Path | Key Endpoints |
|---------|-----------|---------------|
| Auth | `/api/v1/auth` | `POST /login`, `POST /register`, `GET /me` |
| Properties | `/api/v1/properties` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id` |
| Applications | `/api/v1/applications` | `POST /`, `GET /my`, `GET /provider`, `PATCH /:id/status` |
| KYC | `/api/v1/kyc` | `POST /submit`, `GET /status` |
| Images | `/api/v1/images` | `POST /upload` |
| Leases | `/api/v1/leases` | `GET /my`, `GET /provider` |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm or npm
- Expo CLI: `npm install -g expo`
- EAS CLI: `npm install -g eas-cli`
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio + emulator

### Installation

```bash
cd apps/mobile/digzio-mobile

# Install dependencies
npm install

# Download Space Grotesk fonts
# Place in assets/fonts/:
# SpaceGrotesk-Regular.ttf
# SpaceGrotesk-Medium.ttf
# SpaceGrotesk-SemiBold.ttf
# SpaceGrotesk-Bold.ttf
# SpaceGrotesk-ExtraBold.ttf
# Download from: https://fonts.google.com/specimen/Space+Grotesk

# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

### EAS Build (Production)

```bash
# Login to Expo account
eas login

# Configure project (first time)
eas build:configure

# Build for internal testing (APK + iOS simulator)
eas build --profile preview --platform all

# Build for production (App Bundle + IPA)
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Provider | `demo.provider@digzio.co.za` | `Demo1234!` |
| Student | `siphiwe@digzio.co.za` | `Demo1234!` |

## Environment Variables

The app uses `EXPO_PUBLIC_API_URL` (set in `eas.json`):

```
EXPO_PUBLIC_API_URL=https://www.digzio.co.za
```

For local development against a different backend, create `.env.local`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Sprint History

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 1 | Project scaffold, design tokens, auth screens | ✅ Complete |
| Sprint 2 | Provider Dashboard, Portfolio, Property Detail | ✅ Complete |
| Sprint 3 | Applications inbox, Approve/Reject/NSFAS/Lease | ✅ Complete |
| Sprint 4 | Student feed, Property detail, Apply flow | ✅ Complete |
| Sprint 5 | Push notifications, EAS build, App Store submission | 🔜 Planned |
