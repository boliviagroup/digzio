# Digzio Platform — Monorepo

> **South Africa's first fully compliant, NSFAS-integrated student housing marketplace.**

---

## Repository Structure

```
digzio/
├── apps/
│   ├── web-marketing/          # Public marketing website (React + Vite + TypeScript)
│   ├── web-provider/           # Provider portal (React)
│   ├── web-student/            # Student portal (React)
│   └── web-admin/              # Admin dashboard (React)
├── backend/
│   ├── services/
│   │   ├── auth/               # OAuth 2.0 / OIDC authentication service
│   │   ├── property/           # Property listing & image repository service
│   │   ├── application/        # Student application & lease management
│   │   ├── payment/            # Stripe / PayU / NSFAS payment service
│   │   ├── notification/       # SendGrid / Twilio notification service
│   │   ├── compliance/         # POPIA / NSFAS compliance engine
│   │   └── analytics/          # Dashboard KPIs & reporting engine
│   ├── shared/                 # Shared models, middleware, utilities
│   └── migrations/             # Database migration scripts
├── docs/
│   ├── specs/                  # Full Software Engineering Specification Family (12 docs)
│   ├── migrations/             # SQL migration files
│   └── diagrams/               # Architecture & ER diagrams
├── infrastructure/
│   ├── terraform/              # AWS infrastructure-as-code (VPC, RDS, Redis, S3, CDN)
│   └── docker/                 # Container configurations
└── scripts/                    # Developer utility scripts
```

---

## Getting Started

### Prerequisites
- Node.js >= 22
- pnpm >= 9
- PostgreSQL 14+ with PostGIS extension
- Redis 7+

### Run the Marketing Website
```bash
cd apps/web-marketing
pnpm install
pnpm dev
```

---

## Documentation

All engineering specifications are in `docs/specs/`:

| Document | File |
|---|---|
| Master Specification Family (12 docs) | `Digzio_Master_Specification_Family.md` |
| Platform Specification v1.1 | `Digzio_Platform_Specification.md` |
| Production Sprint Plan | `Digzio_Production_Sprint_Plan.md` |

Database schema migration: `docs/migrations/digzio_001_initial_schema.sql`

---

## Architecture

![System Architecture](docs/diagrams/digzio_architecture.png)

![ER Diagram](docs/diagrams/digzio_er_diagram.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Backend | Node.js, Express / Fastify (microservices) |
| Database | PostgreSQL 14 + PostGIS |
| Cache | Redis 7 |
| Storage | AWS S3 + CloudFront CDN |
| Auth | OAuth 2.0 / OIDC, Onfido KYC |
| Payments | Stripe, PayU, NSFAS API |
| Notifications | SendGrid, Twilio |
| Infrastructure | AWS (VPC, RDS, ElastiCache, API Gateway, WAF) |
| IaC | Terraform |

---

## Compliance

This platform is built to comply with **POPIA**, **NSFAS accreditation rules**, **DHET norms**, and **PCI DSS** for payment processing.

---

*Version 1.0.0 — Initial Repository Setup*
