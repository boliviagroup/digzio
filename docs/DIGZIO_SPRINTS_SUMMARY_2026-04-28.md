# Digzio Platform — Comprehensive Sprints Summary
**Date:** 2026-04-28  
**Author:** Manus AI  
**Project:** Digzio Student Accommodation Platform

---

## 1. Executive Summary

This document summarizes the comprehensive development and deployment efforts across multiple sprints to build the Digzio student accommodation platform. The platform is now fully operational in the production environment on AWS (`af-south-1`), featuring a robust microservices architecture, secure authentication, role-based dashboards, automated email notifications, and a complete end-to-end student application workflow.

The system connects students, property providers, and institutions, ensuring compliance with the Policy on the Minimum Norms and Standards for Student Housing at Public Universities (POSA) and integrating NSFAS (National Student Financial Aid Scheme) verification workflows.

---

## 2. Infrastructure & Architecture (Sprint 1)

The foundational sprint focused on establishing a secure, scalable, and automated cloud environment using Infrastructure as Code (Terraform) and GitHub Actions.

### 2.1 AWS Infrastructure Provisioning
The entire infrastructure was provisioned on AWS in the `af-south-1` (Cape Town) region:
- **Networking:** A Virtual Private Cloud (VPC) with public and private subnets, NAT gateways, and secure routing.
- **Compute:** Amazon Elastic Container Service (ECS) using Fargate for serverless container orchestration.
- **Database:** Amazon RDS running PostgreSQL 15 with the PostGIS extension enabled for geospatial queries (e.g., finding properties near campuses).
- **Caching:** Amazon ElastiCache (Redis) for session management and fast data retrieval.
- **Storage & CDN:** Amazon S3 for storing user-uploaded images and documents, distributed globally via Amazon CloudFront.
- **Load Balancing:** An Application Load Balancer (ALB) acting as the single public ingress point, handling SSL/TLS termination and routing traffic to the appropriate microservices.

### 2.2 CI/CD Pipelines
Automated CI/CD pipelines were established using GitHub Actions:
- **Backend Pipeline:** Builds Docker images for all 8 microservices, pushes them to Amazon Elastic Container Registry (ECR), and updates the ECS task definitions.
- **Frontend Pipeline:** Builds the React/TypeScript frontend application, containerizes it, and deploys it to ECS.

---

## 3. Backend Microservices (Sprints 2 & 3)

The backend was architected as a suite of independent, purpose-built microservices using Node.js and Express, communicating via REST APIs and secured with JSON Web Tokens (JWT).

### 3.1 Core Services Developed
| Service Name | Primary Responsibility |
| :--- | :--- |
| **Auth Service** | Manages user registration, login, JWT issuance, and role-based access control (Admin, Provider, Student, Institution). |
| **Property API** | Handles property listings, room availability, and executes complex geospatial queries. Includes POSA compliance endpoints. |
| **Application Service** | Manages the end-to-end tenant application lifecycle, from initial inquiry to approval and lease signing. |
| **Lease Service** | Generates legally binding PDF lease agreements and tracks signature statuses. |
| **KYC Service** | Verifies student identities and processes document uploads. |
| **Institution API** | Provides endpoints for universities to verify student enrollment and manage accredited properties. |
| **Image API** | Handles secure uploading, processing, and serving of property images and user documents. |
| **Notification Service** | Manages asynchronous communication, triggering transactional emails via AWS Simple Email Service (SES). |

### 3.2 Key Backend Features
- **Hot-Patching Mechanism:** A novel startup script allows backend routes to be updated dynamically from GitHub commits during container initialization, enabling rapid bug fixes without full image rebuilds.
- **AWS SES Integration:** Replaced the initial SendGrid implementation with AWS SES for reliable, production-grade email delivery.
- **Database Seeding:** Created comprehensive SQL migration and seed scripts to populate the database with realistic demo data (users, properties, institutions, and applications).

---

## 4. Frontend Web Application (Sprint 3.5 & 4)

The frontend is a responsive, modern web application built with React, TypeScript, and Tailwind CSS. It is served by a lightweight Express server that acts as a reverse proxy to prevent Cross-Origin Resource Sharing (CORS) and mixed-content issues.

### 4.1 User Dashboards
- **Student Dashboard:** Allows students to track application statuses (Submitted, Pending NSFAS, Approved, Rejected), view property details, and complete KYC verification via a secure modal.
- **Provider Dashboard:** A comprehensive management interface for property owners. Features include:
  - **Overview:** High-level statistics on total students, NSFAS verified counts, and estimated revenue.
  - **Applications Tab:** Review incoming applications, view student KYC status, and update application states (e.g., Approve, Reject).
  - **POSA Compliance Tab:** Generates POSA-compliant occupancy lists and allows CSV downloads for institutional reporting.
- **Admin Dashboard:** A restricted area for platform administrators to oversee users, properties, and overall system health.

### 4.2 Property Discovery
- **Search Interface:** A dynamic search page allowing students to filter properties by location, price, type, and NSFAS accreditation status.
- **Interactive Map:** Visual property discovery utilizing the geospatial data provided by the Property API.

### 4.3 Integration Features
- **Ntumu Button:** Integrated a prominent "Ntumu" button in the navigation bar, linking directly to the Roomza AP submission page (`https://ap.digzio.co.za`).

---

## 5. Workflows & Compliance (Sprint 5 & Final Polish)

The final sprints focused on hardening the business logic, ensuring regulatory compliance, and verifying end-to-end workflows.

### 5.1 POSA Compliance Module
Developed a robust module to ensure properties meet the Department of Higher Education and Training's standards.
- Added detailed POSA fields to the database schema (e.g., room sizes, ablution ratios, internet access).
- Created endpoints for providers to update POSA details and generate compliance reports.
- Implemented dynamic tenant column detection to handle varied student profile schemas.

### 5.2 End-to-End Application Flow
The core user journey was fully realized and tested:
1. **Discovery:** Student searches for and selects a property.
2. **KYC:** Student completes identity verification via the dashboard modal.
3. **Application:** Student submits an application.
4. **Provider Review:** Provider reviews the application, checking KYC and NSFAS status.
5. **Approval:** Provider approves the application.
6. **Notification:** The system automatically triggers an AWS SES email notifying the student of the approval.

### 5.3 Final Fixes & Deployments
- **Email Routing:** Updated demo student accounts to use unique, plus-addressed emails (e.g., `siphiwe+student2@digzio.co.za`) to satisfy database unique constraints while routing all test emails to a single SES-verified inbox.
- **KYC UI Fix:** Replaced a broken navigation link with a fully functional, integrated KYC verification modal on the Student Dashboard.
- **Role Validation:** Fixed case-sensitivity issues in role-checking middleware to ensure reliable access control.

---

## 6. Current Platform Status

As of April 28, 2026, the Digzio platform is **LIVE** and fully functional in the production environment.

- **URL:** [https://www.digzio.co.za](https://www.digzio.co.za)
- **ECS Services:** All 9 services (8 backend + 1 frontend) are running in a steady state.
- **Data:** 22 properties are correctly linked to providers, with no orphaned records.
- **Notifications:** AWS SES is actively delivering transactional emails.

### Demo Access
- **Provider:** `demo.provider@digzio.co.za` / `Demo1234!`
- **Student:** `siphiwe@digzio.co.za` (and variants like `siphiwe+student2@digzio.co.za`) / `Demo1234!`

---

## 7. References
[1] [Digzio Platform](https://www.digzio.co.za)
