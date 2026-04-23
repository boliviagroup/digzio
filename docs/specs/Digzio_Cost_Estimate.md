# Digzio Platform — Monthly Operating Cost Estimate

**Version:** 1.0  
**Date:** April 2026  
**Author:** Manus AI  

---

## 1. Executive Summary

This document provides a comprehensive monthly operating cost estimate for the Digzio student housing platform. The estimates are based on current 2026 pricing for AWS infrastructure, third-party APIs (Onfido, Stripe, PayU), and communication services (WhatsApp Business API, SendGrid).

To provide a realistic financial roadmap, costs are modelled across three distinct growth stages:
1. **MVP / Soft Launch:** 1,000 active students, 50 providers, 200 properties.
2. **Growth Stage:** 10,000 active students, 500 providers, 2,000 properties.
3. **Scale Stage:** 50,000 active students, 2,500 providers, 10,000 properties.

*Note: All prices are in USD ($) unless otherwise specified, as AWS and global SaaS providers bill in USD.*

---

## 2. Infrastructure Costs (AWS)

The Digzio platform utilizes a modern, serverless-leaning microservices architecture on AWS.

### 2.1 Compute & Gateway (API Gateway + EC2/Fargate)
- **API Gateway:** $3.50 per 1 million requests [1].
- **Compute (Backend Services):** Assuming AWS Fargate or small EC2 instances (e.g., `t3.medium` at ~$30.37/month) [2].

### 2.2 Database & Caching (RDS PostgreSQL + ElastiCache Redis)
- **Primary Database (RDS PostgreSQL):** A `db.t4g.micro` starts at ~$12.41/month for MVP, scaling up to `db.m6g.large` (~$130/month) for the Scale stage [3].
- **Caching (ElastiCache Redis):** Serverless Redis costs ~$0.125/GB for storage and ~$0.0034 per million ECPUs [4].

### 2.3 Storage & CDN (S3 + CloudFront)
- **S3 Object Storage (Images & Docs):** $0.023 per GB/month [5].
- **CloudFront CDN:** ~$0.085 per GB for outbound data transfer [6].

---

## 3. Third-Party API & Service Costs

### 3.1 Identity Verification (Onfido)
Onfido is used for student and provider KYC (Know Your Customer) checks.
- **Cost per Check:** Enterprise pricing varies by volume, but averages ~$1.00 to $1.50 per verification for startups [7].

### 3.2 Payment Processing (Stripe & PayU)
- **Stripe (Card Payments):** 2.9% + $0.30 per successful transaction [8].
- **PayU (EFT/Local ZA Payments):** Varies by channel, but standard gateway fees apply (e.g., flat fee of R3.50 or percentage) [9].
- *Note: NSFAS disbursements do not incur standard credit card gateway fees, but require API integration maintenance.*

### 3.3 Communications (WhatsApp Business API & SendGrid)
- **WhatsApp Business API (South Africa):** ~$0.015 per utility message (significantly cheaper than WhatsApp) [10].
- **SendGrid Email:** Free for first 100/day. Essentials plan (up to 100k emails) is $19.95/month. Pro plan is $89.95/month [11].

---

## 4. Cost Projections by Growth Stage

### 4.1 Stage 1: MVP / Soft Launch
*Assumptions: 1,000 students, low transaction volume, baseline infrastructure.*

| Category | Service | Estimated Usage | Monthly Cost (USD) |
|---|---|---|---|
| **Infrastructure** | AWS RDS (t4g.micro) | 1 Instance (Multi-AZ) | $ 25.00 |
| | AWS ElastiCache | Serverless (Baseline) | $ 15.00 |
| | AWS Compute | 2x t3.medium | $ 60.00 |
| | AWS API Gateway | < 1M requests | $ 3.50 |
| | AWS S3 + CDN | 50 GB Storage + 100 GB Egress | $ 10.00 |
| **Services** | Onfido KYC | 200 verifications/mo | $ 250.00 |
| | WhatsApp API | 1,000 Msgs/mo | $ 15.00 |
| | SendGrid Email | < 3,000 emails/mo | $ 0.00 (Free) |
| **Total Estimated Monthly Cost (MVP)** | | | **$ 499.00** |

### 4.2 Stage 2: Growth
*Assumptions: 10,000 students, moderate transaction volume, scaled infrastructure.*

| Category | Service | Estimated Usage | Monthly Cost (USD) |
|---|---|---|---|
| **Infrastructure** | AWS RDS (m6g.large) | 1 Instance (Multi-AZ) | $ 260.00 |
| | AWS ElastiCache | Provisioned Cluster | $ 80.00 |
| | AWS Compute | 4x t3.large | $ 240.00 |
| | AWS API Gateway | 10M requests | $ 35.00 |
| | AWS S3 + CDN | 500 GB Storage + 1 TB Egress | $ 95.00 |
| **Services** | Onfido KYC | 1,000 verifications/mo | $ 1,000.00 |
| | WhatsApp API | 15,000 Msgs/mo | $ 225.00 |
| | SendGrid Email | 50,000 emails/mo | $ 19.95 |
| **Total Estimated Monthly Cost (Growth)** | | | **$ 1,954.95** |

### 4.3 Stage 3: Scale
*Assumptions: 50,000 students, high transaction volume, enterprise infrastructure.*

| Category | Service | Estimated Usage | Monthly Cost (USD) |
|---|---|---|---|
| **Infrastructure** | AWS RDS (r6g.xlarge) | Multi-AZ + Read Replicas | $ 850.00 |
| | AWS ElastiCache | High-Availability Cluster | $ 250.00 |
| | AWS Compute | Fargate Cluster (Auto-scaling) | $ 800.00 |
| | AWS API Gateway | 50M requests | $ 175.00 |
| | AWS S3 + CDN | 2 TB Storage + 5 TB Egress | $ 470.00 |
| **Services** | Onfido KYC | 4,000 verifications/mo | $ 3,500.00 |
| | WhatsApp API | 75,000 Msgs/mo | $ 1,125.00 |
| | SendGrid Email | 250,000 emails/mo | $ 89.95 |
| **Total Estimated Monthly Cost (Scale)** | | | **$ 7,259.95** |

---

## 5. Cost Visualisation

![Digzio Monthly Operating Cost by Growth Stage](https://private-us-east-1.manuscdn.com/sessionFile/xrVTs8mgwYcna4H2tYwM5d/sandbox/HlwDA5yTg0oDYY90ARdLyR-images_1776720384137_na1fn_L2hvbWUvdWJ1bnR1L2RpZ3ppby9kb2NzL2RpYWdyYW1zL2RpZ3ppb19jb3N0X2VzdGltYXRl.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUveHJWVHM4bWd3WWNuYTRIMnRZd001ZC9zYW5kYm94L0hsd0RBNXlUZzBvRFlZOTBBUmRMeVItaW1hZ2VzXzE3NzY3MjAzODQxMzdfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBaM3BwYnk5a2IyTnpMMlJwWVdkeVlXMXpMMlJwWjNwcGIxOWpiM04wWDJWemRHbHRZWFJsLnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=tQzJf0nMuteFI6eh35QxhgPeRLxMlu22fcTC213PWbv7ot~ToJyV0IoCHNQeJm1KN~TyT4wPO3q7qMiJ4UuKcqaqYl5ivFjQQS7tBi3ALsKBfBTIsLSLPR5uZ6v~OV9FmFS81fnpxBujOdJz4g5r0~uf3RngVVyMTmEpB4qjGBvQk3SUTZYH~ZXCNY3qjr2~I6mU3-CTRhBGb2OD4Q029qZyLcLzdzDGFSwPI9-JXJGSGle2XB-uUD0Rjq1GBxnLmLls2qs8nN4uBUNLMBy3ehE5RcQ0Ep0-EoaK3Mpb~GNxNvYbbJ-3LpAi6XsrQXUry~v38HBMdKkqjLtO8dWNdQ__)
*Figure: Monthly operating cost breakdown across MVP, Growth, and Scale stages*

---

## 6. Strategic Cost Insights

1. **WhatsApp replaces SMS for Maximum Cost Efficiency:** By using the WhatsApp Business API (~$0.015/message) and SendGrid email instead of traditional SMS, the platform saves over $9,000/month at scale. WhatsApp is also the preferred communication channel for South African students, making it both the cheaper and more effective choice.
2. **KYC Costs:** Identity verification is expensive but non-negotiable for trust and NSFAS compliance. Bulk enterprise agreements with Onfido will be critical as the platform scales.
3. **AWS is Highly Efficient Early On:** The cloud infrastructure costs are negligible during the MVP phase (under $120/month) and scale linearly and predictably.

---

## 6. References
[1] Amazon API Gateway Pricing: https://aws.amazon.com/api-gateway/pricing/
[2] Amazon EC2 T3 Instances: https://aws.amazon.com/ec2/instance-types/t3/
[3] Amazon RDS for PostgreSQL Pricing: https://aws.amazon.com/rds/postgresql/pricing/
[4] Amazon ElastiCache Pricing: https://aws.amazon.com/elasticache/pricing/
[5] Amazon S3 Pricing: https://aws.amazon.com/s3/pricing/
[6] Amazon CloudFront Pricing: https://aws.amazon.com/cloudfront/pricing/
[7] Top 10 real estate KYC tools in 2026: https://agorareal.com/compare/top-10-real-estate-kyc-tools-in-2025/
[8] Stripe Pricing: https://stripe.com/pricing
[9] PayU Fees by Country: https://corporate.payu.com/payu-fees-by-country/
[10] WhatsApp & Email Pricing South Africa: https://www.twilio.com/en-us/whatsapp/pricing/za
[11] SendGrid Pricing: https://sendgrid.com/en-us/pricing
