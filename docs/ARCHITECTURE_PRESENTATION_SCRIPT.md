# Digzio Platform Architecture — Presentation Script

**Author:** Manus AI  
**Target Audience:** Investors, Technical Stakeholders  
**Estimated Duration:** 10–12 Minutes  

---

## Slide 1: Title Slide
**Visual:** Digzio Logo, "Platform Architecture Overview", Presenter Name.

**Speaker Notes:**
"Good morning, everyone. Thank you for joining me today. I’m excited to walk you through the technical foundation of Digzio—our cloud-native student housing platform designed specifically for the South African market. 

Today, we’ll look under the hood at how we’ve built a highly scalable, secure, and modular system that connects students, property providers, and educational institutions in a seamless digital ecosystem. We’ll cover everything from the user-facing frontend down to the data layer and AWS infrastructure."

---

## Slide 2: High-Level Architecture Overview
**Visual:** A three-tier diagram showing Client (Browser), Application (AWS ECS), and Data (Amazon RDS/S3) with an Application Load Balancer in the middle.

**Speaker Notes:**
"Let’s start with the big picture. Digzio is built on a modern microservices architecture, hosted entirely on Amazon Web Services (AWS) in the Cape Town region to ensure data sovereignty and ultra-low latency for our users.

Our architecture is split into three core tiers:
1. **The Client Tier:** A responsive web application.
2. **The Application Tier:** A suite of specialized Node.js microservices running in Docker containers.
3. **The Data Tier:** A centralized relational database equipped with advanced geospatial capabilities.

Traffic enters through a single, secure gateway—the AWS Application Load Balancer—which intelligently routes requests to the right service."

---

## Slide 3: Frontend & Delivery Layer
**Visual:** Diagram showing React SPA → Node.js Express Proxy → AWS ALB.

**Speaker Notes:**
"Moving to the frontend, our goal was to deliver a frictionless experience across three distinct user journeys: Students, Providers, and Institutions.

We built the application using **React and TypeScript**, styled with **Tailwind CSS** for rapid, responsive design. 

Crucially, the React app is served by a lightweight Node.js/Express server that acts as a reverse proxy. This means when the frontend needs to talk to the backend APIs, it routes through the proxy first. This elegantly solves Cross-Origin Resource Sharing (CORS) issues and ensures we never run into mixed-content blocks in modern browsers. The entire frontend is containerized and deployed on AWS ECS Fargate."

---

## Slide 4: Backend Microservices Architecture
**Visual:** Diagram showing the 8 microservices (Auth, Property, Application, Lease, KYC, Institution, Image, Notification) connected to the ALB.

**Speaker Notes:**
"At the heart of Digzio is our Application Tier. To ensure we can scale features independently and maintain a clean codebase, we’ve decomposed the backend into **eight distinct microservices**.

For example:
- The **Auth API** handles all security, logins, and role-based access.
- The **Property API** manages listings and complex location searches.
- The **KYC and Institution APIs** handle student verification and university integrations.
- The **Lease API** automatically generates legally binding PDF agreements.

Each service is built with Node.js and Express, communicating securely via standard RESTful APIs and JSON Web Tokens."

---

## Slide 5: Compute & Orchestration (AWS Fargate)
**Visual:** AWS ECS Fargate logo, showing serverless container scaling.

**Speaker Notes:**
"Managing infrastructure can be a massive overhead, which is why we adopted a serverless compute model.

All eight microservices, plus the frontend, are orchestrated using **Amazon Elastic Container Service (ECS)** with the **AWS Fargate** launch type. 

Fargate means we don’t provision or manage any underlying servers. We simply package our code into Docker containers, define the CPU and memory requirements, and AWS handles the rest. This allows Digzio to scale automatically based on traffic spikes—like during the busy university enrollment season—without us paying for idle servers during quiet periods."

---

## Slide 6: Data Layer & Storage
**Visual:** Amazon RDS (PostgreSQL) + PostGIS logo, alongside Amazon S3.

**Speaker Notes:**
"Data is our most critical asset. Our primary datastore is **Amazon RDS running PostgreSQL 15**. It provides the transactional integrity required for financial and lease data.

What makes our data layer special is the integration of the **PostGIS** extension. This gives our database advanced geospatial capabilities, allowing the Property API to execute complex, hyper-local queries—such as finding all accredited student housing within a 2-kilometer radius of the University of Cape Town campus.

For unstructured data, we use **Amazon S3**. This stores user-uploaded images, KYC documents, and the generated PDF leases."

---

## Slide 7: Security & Networking
**Visual:** VPC diagram showing public subnets (ALB) and private subnets (ECS, RDS).

**Speaker Notes:**
"Security is non-negotiable, especially when handling student identities and lease agreements. We’ve integrated security at every layer:

1. **Network Isolation:** Our database and all microservices live inside private subnets within an AWS Virtual Private Cloud. They are completely invisible to the public internet.
2. **Ingress Control:** The Application Load Balancer is the only public entry point, enforcing HTTPS and TLS 1.3 encryption.
3. **Authentication & Authorization:** Every API endpoint requires a valid JWT, and strict Role-Based Access Control ensures a student can never access provider-level functions.

We also use a novel hot-patching strategy via S3, allowing us to deploy critical security fixes to API routes instantly without rebuilding full Docker images."

---

## Slide 8: Conclusion & Live Demo
**Visual:** Digzio logo, URL: https://www.digzio.co.za, "Ready for Scale".

**Speaker Notes:**
"To summarize, the Digzio architecture represents a modern, highly secure, and immensely scalable foundation. By leveraging AWS managed services, we’ve minimized operational overhead while maximizing performance and reliability.

We are not just building an app; we’ve built an enterprise-grade platform ready to handle the entire South African student housing market.

The platform is fully live right now. I invite you to visit **digzio.co.za** to see it in action. Thank you, and I’m happy to take any technical questions."
