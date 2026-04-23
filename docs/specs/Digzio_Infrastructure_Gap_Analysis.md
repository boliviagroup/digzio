# Digzio Infrastructure & Website-to-App Gap Analysis

This document provides a comprehensive audit of the current Digzio infrastructure and specification documents, specifically evaluating the integration between the marketing website (`www.digzio.co.za`) and the core application portals (`app.digzio.co.za`). 

The goal of this analysis is to identify and document all architectural, design, and infrastructural gaps before any application code is written, ensuring a seamless, unified user experience across the entire Digzio ecosystem.

## 1. Domain & Routing Architecture Gaps

Currently, the specifications mention AWS CloudFront and API Gateway, but they lack explicit DNS routing rules to separate marketing traffic from application traffic while maintaining a unified domain structure.

### Identified Gaps
- **Missing Subdomain Strategy:** The specifications do not explicitly define the subdomain structure (e.g., `www.digzio.co.za` for marketing, `app.digzio.co.za` for the student/provider portals, and `api.digzio.co.za` for the backend).
- **CDN Separation:** The marketing website (static React/Vite) and the application portals (dynamic React) require separate AWS CloudFront distributions with different caching behaviors. Marketing pages should be heavily cached at the edge, while application pages must bypass cache for dynamic data.
- **Cross-Origin Resource Sharing (CORS):** The API Gateway is specified, but CORS rules allowing `www.digzio.co.za` and `app.digzio.co.za` to communicate securely with `api.digzio.co.za` are not defined in the Terraform infrastructure plan.

### Required Actions
- Update the **System Architecture Document** to explicitly define the Route53 DNS topology.
- Define strict CORS policies in the API Gateway Terraform configuration.
- Specify two distinct CloudFront distributions with appropriate cache policies.

## 2. Design System & Branding Gaps

A review of the existing marketing website code reveals a highly polished design system using TailwindCSS, specific brand colors (Navy, Teal, Cyan, Coral), and the "Space Grotesk" font family.

### Identified Gaps
- **Isolated Component Library:** The marketing website has a robust UI component library (buttons, cards, dialogs) located in `apps/web-marketing/src/components/ui/`. However, there is no shared package or monorepo workspace setup to allow the Student App and Provider App to reuse these exact components.
- **Brand Token Duplication:** The Tailwind configuration (`tailwind.config.ts`) and CSS variables (`index.css`) are currently locked inside the marketing folder. If the apps are built separately, developers will manually copy these, leading to inevitable UI drift and an inconsistent "look and feel."

### Required Actions
- Refactor the repository into a true **PNPM Workspace / Monorepo**.
- Extract the Tailwind configuration, CSS variables, and UI components into a shared package (e.g., `@digzio/ui`).
- Ensure all future apps (`web-student`, `web-provider`) import components directly from this shared package to guarantee 100% visual consistency.

## 3. Authentication & Navigation Gaps

The transition from a visitor reading the marketing website to an authenticated user inside the application must be frictionless.

### Identified Gaps
- **Broken CTA Links:** The marketing website currently has "Get Started" buttons that link to a generic `/contact` page rather than routing the user to the application's authentication flow (e.g., `https://app.digzio.co.za/register`).
- **Single Sign-On (SSO) / Session Sharing:** If a user logs in via the marketing website, the session token (JWT) must be securely passed to the application subdomain. The current Auth Specification (Sprint 2) stores tokens in `HttpOnly` cookies, but does not specify the `Domain` attribute required for cross-subdomain authentication (e.g., `Domain=.digzio.co.za`).

### Required Actions
- Update the **Auth Service Specification** to ensure cookies are set with `Domain=.digzio.co.za` so that sessions persist across `www` and `app` subdomains.
- Update the marketing website's navigation and Call-to-Action (CTA) buttons to point directly to the application's registration and login routes.

## 4. Summary of Pre-Build Requirements

Before executing Sprint 1 (Infrastructure) or writing any application code, the following architectural updates must be made to the repository:

| Gap Area | Required Fix | Owner |
|---|---|---|
| **Infrastructure** | Define Route53 subdomains and API Gateway CORS rules for cross-origin communication. | DevOps / Manus |
| **Design System** | Extract the marketing UI components into a shared `@digzio/ui` monorepo package. | Frontend / Manus |
| **Authentication** | Configure Auth cookies for cross-subdomain sharing (`Domain=.digzio.co.za`). | Backend / Manus |
| **Routing** | Update marketing website CTA buttons to point to the application portal. | Frontend / Manus |

By addressing these gaps now, we guarantee that when the apps are built, they will look identical to the website and communicate securely across the AWS infrastructure.
