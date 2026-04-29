# Digzio Mobile App — Design System Specification

**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Mobile Application (iOS & Android)

---

## 1. Design Philosophy

The Digzio mobile application must serve as a pixel-faithful, native extension of the existing web platform (`www.digzio.co.za`). The design language is characterized by a modern, trustworthy aesthetic tailored for the South African student housing market. It relies on a strong typographic hierarchy, a distinct Navy and Teal color palette, and clean, card-based layouts.

This document outlines the specific design tokens and component structures required to replicate the web experience in React Native using NativeWind (Tailwind CSS).

---

## 2. Color Palette

The color system is the primary driver of Digzio's brand identity. The mobile app must use these exact hex codes to ensure continuity.

### 2.1 Primary Brand Colors
| Token Name | Hex Code | Usage |
|------------|----------|-------|
| **Navy** | `#0F2D4A` | Primary text, headers, primary navigation backgrounds, active states. |
| **Teal** | `#1A9BAD` | Primary buttons, active links, primary icons, progress indicators. |
| **Cyan** | `#2EC4C4` | Gradients (paired with Teal), secondary accents, hover states. |

### 2.2 Semantic & Feedback Colors
| Token Name | Hex Code | Usage |
|------------|----------|-------|
| **Green (Success)** | `#10B981` | Approved applications, verified KYC, NSFAS verified badges. |
| **Amber (Warning)** | `#F59E0B` | Pending reviews, warnings, incomplete actions. |
| **Red (Error)** | `#EF4444` | Rejected applications, errors, destructive actions. |
| **Coral** | `#E05A4E` | Secondary warning or specific promotional highlights. |

### 2.3 Neutral & Background Colors
| Token Name | Hex Code | Usage |
|------------|----------|-------|
| **Off-White** | `#F5F7FA` | App background, secondary container backgrounds. |
| **Muted Grey** | `#E8ECEF` | Borders, inactive tabs, disabled states. |
| **Charcoal** | `#2C3E50` | Secondary text, body copy, subtitles. |
| **White** | `#FFFFFF` | Card backgrounds, modal backgrounds, primary button text. |

### 2.4 Gradients
- **Primary Gradient:** `linear-gradient(135deg, #1A9BAD, #2EC4C4)` — Used for primary call-to-action buttons.
- **Hero Gradient:** `linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 40%, #1A9BAD 100%)` — Used for major header backgrounds (e.g., Auth screens, Profile headers).

---

## 3. Typography

The web platform exclusively uses **Space Grotesk** for both headings and body text. To replicate this on mobile, the Space Grotesk font family must be loaded into the Expo project and applied globally.

### 3.1 Font Family
- **Primary Font:** Space Grotesk (sans-serif)

### 3.2 Font Weights
The design system relies heavily on bold, structural typography.
- **Regular:** `400` (Standard body text)
- **Semi-Bold:** `600` (Subtitles, list items, secondary buttons)
- **Bold:** `700` (Primary buttons, card titles, section headers)
- **Extra-Bold:** `800` (Hero headers, major numbers/stats)

### 3.3 Text Hierarchy (React Native Mapping)
| Element | Font Size | Font Weight | Color |
|---------|-----------|-------------|-------|
| **H1 (Hero)** | `text-4xl` (36px) | `800` | Navy (`#0F2D4A`) |
| **H2 (Section)** | `text-2xl` (24px) | `800` | Navy (`#0F2D4A`) |
| **H3 (Card Title)** | `text-lg` (18px) | `700` | Navy (`#0F2D4A`) |
| **Body (Standard)** | `text-base` (16px) | `400` | Charcoal (`#2C3E50`) |
| **Body (Small)** | `text-sm` (14px) | `400` / `600` | Charcoal / Gray-500 |
| **Label / Badge** | `text-xs` (12px) | `700` | Varies (e.g., Teal, Green) |

*Note: Section labels often use `text-xs`, `font-700`, `tracking-widest` (letter-spacing: 0.15em), and uppercase styling.*

---

## 4. UI Components & Layout

### 4.1 Buttons
Buttons are a critical interaction point and must match the web exactly.

- **Primary Button (`btn-primary`):**
  - Background: Teal to Cyan gradient.
  - Text: White, `font-700`, `text-sm`.
  - Border Radius: `rounded-md` (6px - 8px).
  - Padding: `py-3 px-6`.
- **Navy Button (`btn-navy`):**
  - Background: Navy (`#0F2D4A`).
  - Text: White, `font-700`, `text-sm`.
  - Border Radius: `rounded-md`.
- **Outline Button (`btn-outline`):**
  - Background: Transparent.
  - Border: 2px solid Muted Grey or Navy.
  - Text: Navy, `font-700`.

### 4.2 Cards and Containers
The Digzio interface relies on clean, separated cards to display information (properties, applications, stats).

- **Background:** White (`#FFFFFF`).
- **Border Radius:** `rounded-xl` (12px) or `rounded-2xl` (16px) for larger containers.
- **Shadow:** Subtle elevation. Use `shadow-sm` or `shadow-md` in NativeWind (e.g., `0 4px 12px rgba(15, 45, 74, 0.08)`).
- **Padding:** Generous internal padding, typically `p-4` or `p-6`.

### 4.3 Status Badges
Badges are used extensively to indicate application status, KYC status, and NSFAS verification. They follow a strict pattern:
- **Background:** 10% to 15% opacity of the semantic color.
- **Text:** 100% opacity of the semantic color, `font-700`, `text-xs`.
- **Border Radius:** `rounded-full`.
- **Example (NSFAS Verified):** Background `rgba(16,185,129,0.1)`, Text `#10B981`.

### 4.4 Spacing & Layout
- **Global Background:** The main app background behind cards should be Off-White (`#F5F7FA`).
- **Margins:** Standardize on 16px (`m-4`) or 24px (`m-6`) between major vertical sections.
- **Safe Areas:** Ensure `SafeAreaView` is used to prevent content from bleeding into the notch or bottom home indicator on modern devices.

---

## 5. Implementation Notes for React Native

To achieve this exact look in React Native using Expo and NativeWind:

1. **Font Loading:** Use `expo-font` to load `SpaceGrotesk-Regular`, `SpaceGrotesk-SemiBold`, `SpaceGrotesk-Bold`, and `SpaceGrotesk-ExtraBold`. Set Space Grotesk as the default font family in the NativeWind configuration.
2. **Tailwind Config:** Extend the `tailwind.config.js` in the mobile project with the exact hex codes listed in Section 2.
3. **Gradients:** Use `expo-linear-gradient` for all primary buttons and hero headers, mapping the exact color stops from the CSS tokens.

By adhering strictly to these specifications, the mobile application will feel like a natural, native extension of the Digzio web platform.
