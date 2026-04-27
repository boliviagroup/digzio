# Digzio Platform Architecture Summary

**Author:** Manus AI  
**Date:** April 2026  

This document provides a comprehensive overview of the end-to-end architecture of the Digzio platform. Designed to support the South African student housing market, Digzio facilitates seamless interactions between students, property providers, and educational institutions. The architecture emphasizes scalability, security, and modularity, leveraging a modern cloud-native stack deployed on AWS.

## 1. High-Level Architecture Overview

The Digzio platform is built on a microservices architecture, separating the frontend user experience from backend business logic. All components are hosted on Amazon Web Services (AWS), specifically within the `af-south-1` (Cape Town) region to ensure low latency and data sovereignty compliance for South African users.

The system is broadly divided into three tiers:
- **Client Tier:** A responsive web application accessed via browsers.
- **Application Tier:** A suite of specialized Node.js microservices running in Docker containers.
- **Data Tier:** A centralized relational database equipped with geospatial capabilities.

Traffic enters the system through an AWS Application Load Balancer (ALB), which intelligently routes requests either to the frontend container or directly to the appropriate backend microservice based on the URL path.

## 2. Frontend and Delivery Layer

The frontend is a Single Page Application (SPA) designed to provide distinct, role-based workflows for Students, Providers, and Institutions.

### 2.1 Technology Stack
The application is built using **React** with **TypeScript** for type safety and robust component design. Styling is handled by **Tailwind CSS**, enabling rapid UI development and ensuring responsiveness across mobile and desktop devices.

### 2.2 Serving and Proxy Strategy
The React application is served by a lightweight **Node.js/Express server**. This server not only delivers the static assets but also acts as a reverse proxy for API calls. By proxying requests (e.g., routing `/api/*` to the backend), the architecture elegantly bypasses Cross-Origin Resource Sharing (CORS) issues and prevents mixed-content blocking in modern browsers.

### 2.3 Deployment
The frontend is containerized using Docker and deployed as a service on **AWS ECS Fargate**. It sits behind the ALB, which handles SSL termination (HTTPS via AWS Certificate Manager) and forwards traffic to the frontend containers. The domain (`www.digzio.co.za`) resolves to this ALB, providing a secure, public-facing entry point.

## 3. Backend Microservices Architecture

To ensure maintainability and allow independent scaling of features, the backend is decomposed into eight distinct microservices. Each service is built with **Node.js** and **Express**, and they communicate with the shared data layer and each other via standard RESTful APIs and JSON Web Tokens (JWT).

### 3.1 Core Microservices

| Service Name | Primary Responsibility |
| :--- | :--- |
| **Auth API** | Manages user registration, login, JWT issuance, and role-based access control. |
| **Property API** | Handles property listings, room availability, and executes complex geospatial queries to find properties near universities. |
| **Application API** | Manages the end-to-end tenant application lifecycle, from initial inquiry to approval. |
| **Lease API** | Generates legally binding PDF lease agreements and tracks signature statuses. |
| **KYC API** | Verifies student identities, including integration checks for NSFAS (National Student Financial Aid Scheme) funding status. |
| **Institution API** | Provides endpoints for universities to verify student enrollment and accredit specific properties. |
| **Image API** | Handles secure uploading, processing, and serving of property images and user documents. |
| **Notification API** | Manages asynchronous communication, triggering transactional emails (via AWS SES) and in-app alerts. |

### 3.2 Compute and Orchestration
All microservices are containerized and orchestrated using **Amazon Elastic Container Service (ECS)**. Digzio utilizes the **AWS Fargate** launch type, which provides serverless compute for containers. This eliminates the need to provision or manage underlying EC2 instances, allowing the infrastructure to scale automatically based on demand.

## 4. Data Layer and Storage

The data layer is designed to be a robust, single source of truth, supporting both transactional integrity and advanced spatial queries.

### 4.1 Relational Database
The primary datastore is **Amazon RDS running PostgreSQL 15**. PostgreSQL was chosen for its reliability, ACID compliance, and strong support for JSON data types, which is useful for storing flexible metadata.

### 4.2 Geospatial Capabilities
Crucially, the RDS instance utilizes the **PostGIS** extension. This enables the Property API to perform efficient location-based queries, such as finding all accredited properties within a specific radius of a university campus.

### 4.3 Object Storage and Hot-Patching
**Amazon S3** is utilized for two primary purposes:
1. **Asset Storage:** Storing user-uploaded images, KYC documents, and generated PDF leases.
2. **Hot-Patching:** The architecture employs a novel hot-patching strategy. Backend routes can be updated by uploading new scripts to S3. During container initialization, an init script fetches the latest route files from S3. This allows for rapid deployment of critical fixes without requiring a full Docker image rebuild and ECR push.

## 5. Security and Networking

Security is integrated at multiple layers of the architecture:

- **Network Isolation:** All ECS tasks and the RDS database reside within private subnets in an AWS Virtual Private Cloud (VPC). They are not directly accessible from the public internet.
- **Ingress Control:** The Application Load Balancer (ALB) is the sole public ingress point. It resides in public subnets, terminates SSL/TLS connections, and securely routes traffic to the private subnets.
- **Authentication:** All API endpoints (except public routes like login) require a valid JWT, ensuring that only authenticated users can access sensitive data.
- **Authorization:** Role-based access control (RBAC) is enforced at the API level, ensuring Students, Providers, and Institutions can only perform actions permitted for their specific roles.

## 6. Conclusion

The Digzio platform architecture represents a modern, scalable, and highly secure approach to application design. By leveraging AWS managed services like ECS Fargate and RDS, the operational overhead is minimized. The microservices approach ensures that the platform can evolve rapidly, adding new features or scaling specific components as the user base in the South African student housing market grows.
