# Digzio Onboarding Checklist and Readiness Guide

This document outlines the required accounts, credentials, and third-party services that must be provisioned by the Digzio team before development (Phase 1) can commence. 

As per the Manus-Optimized Sprint Plan, the critical path is no longer writing code—it is securing external dependencies and providing the necessary access.

## 1. AWS Cloud Infrastructure

Digzio's entire backend and infrastructure run on Amazon Web Services (AWS). To begin Phase 1 (Infrastructure & Core Engine), the following must be set up:

### AWS Account Setup
The Digzio organization must create a dedicated AWS account. It is highly recommended to use AWS Organizations if multiple environments (Staging, Production) will eventually require separate billing accounts.

**Required Action:**
Create an AWS Account and provide programmatic access via an IAM User with `AdministratorAccess` (or a strictly scoped role for Terraform provisioning).

**Credentials Needed:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- Default Region: `af-south-1` (Cape Town)

### Domain Name and DNS
The platform requires a primary domain name (e.g., `digzio.co.za`). 

**Required Action:**
Register the domain name through a registrar (e.g., Xneelo, GoDaddy, Route53). If not using Route53 as the registrar, you must be prepared to update the Nameservers to point to AWS Route53 once the Hosted Zone is created in Phase 1.

**Credentials Needed:**
- Access to the Domain Registrar portal (or delegate DNS management to AWS Route53).

## 2. Identity and Verification (KYC)

As determined in the KYC Cost Comparison, Digzio will use a Two-Layer Stack for identity verification: the Department of Home Affairs (DHA) API and Smile Identity.

### DHA API Aggregator
To verify South African ID numbers directly against the population register, an aggregator is required (e.g., PBVerify, Smile Identity Basic KYC, or direct DHA access if available).

**Required Action:**
Register for a merchant account with the chosen DHA aggregator.

**Credentials Needed:**
- API Key / Merchant ID
- API Secret

### Smile Identity
Smile Identity handles the biometric liveness check (the 3-second selfie video).

**Required Action:**
Create a Smile Identity Portal account and generate production/sandbox API keys.

**Credentials Needed:**
- `SMILE_PARTNER_ID`
- `SMILE_API_KEY`

## 3. Communications

Digzio uses WhatsApp and Email for all transactional notifications, completely replacing Twilio SMS to save costs.

### WhatsApp Business API
Used for critical alerts (e.g., "Application Accepted", "KYC Verified").

**Required Action:**
Register for a Meta Developer account, set up a WhatsApp Business Account (WABA), and verify the Digzio business entity. Alternatively, use a BSP (Business Solution Provider) like MessageBird or Infobip.

**Credentials Needed:**
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN` (Permanent or System User token)

### SendGrid (Email)
Used for secondary notifications, password resets, and marketing.

**Required Action:**
Create a Twilio SendGrid account and verify the sending domain (e.g., `notifications@digzio.co.za`) via DNS records.

**Credentials Needed:**
- `SENDGRID_API_KEY`

## 4. Financial and Integrations

### NSFAS API
The core moat of Digzio is the automated NSFAS funding check.

**Required Action:**
Secure the formal partnership and API access from NSFAS or the relevant DHET integration partner.

**Credentials Needed:**
- mTLS Client Certificates (`.pem` / `.key`)
- NSFAS API Base URL
- Authentication Tokens/Credentials

### Payment Gateway (Future Sprint)
While not strictly required for Phase 1, setting up the payment gateway early is recommended. PayU or Stripe (if supported for the specific transaction flow) are the primary candidates.

**Required Action:**
Create a merchant account with the chosen payment gateway and complete FICA/KYC verification for the Digzio business.

**Credentials Needed:**
- Merchant ID
- Public Key
- Secret Key

## Summary of Immediate Blockers

To start **Phase 1 (Days 1–5)**, the following are absolute hard blockers:
1. **AWS Credentials** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. **Domain Name** registered and accessible.

Please confirm once the AWS account is created and the IAM credentials are ready to be securely transmitted.
