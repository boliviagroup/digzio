# Digzio DNS Topology and GoDaddy Integration Guide

This document defines the complete DNS and subdomain routing strategy for the Digzio platform. Since the primary domain (`digzio.co.za`) is registered and hosted on GoDaddy, this guide outlines exactly how to integrate GoDaddy with AWS Route53 to ensure seamless routing across the marketing website, the application portals, and the backend APIs.

## 1. Subdomain Topology

The platform is split into three distinct environments, each requiring its own subdomain and routing rules.

| Subdomain | Purpose | Hosted On | Routing Destination |
|---|---|---|---|
| `www.digzio.co.za` | Marketing Website | AWS S3 + CloudFront | CloudFront Distribution A |
| `app.digzio.co.za` | Student & Provider Portals | AWS S3 + CloudFront | CloudFront Distribution B |
| `api.digzio.co.za` | Backend Microservices | AWS Fargate + API Gateway | API Gateway Custom Domain |

**Why separate CloudFront distributions?**
The marketing website (`www`) is heavily cached at the edge to ensure instant load times for SEO and user acquisition. The application portal (`app`) is dynamic and requires cache-bypassing headers to ensure users always see real-time data (e.g., application statuses, chat messages).

## 2. GoDaddy to AWS Route53 Migration Strategy

To manage the complex routing required for the AWS infrastructure (specifically alias records for CloudFront and API Gateway), DNS management must be delegated from GoDaddy to AWS Route53. 

**Important:** The domain registration remains with GoDaddy. You will continue to pay GoDaddy for the domain name. Only the *traffic direction* (DNS resolution) is handed over to AWS.

### Step-by-Step Migration Process

1. **Create Hosted Zone in AWS:**
   In the AWS Route53 console, create a Public Hosted Zone for `digzio.co.za`. AWS will generate four unique Name Servers (NS records), e.g., `ns-123.awsdns-45.com`.

2. **Update Nameservers in GoDaddy:**
   Log into the GoDaddy Domain Control Center. Under the DNS Management page for `digzio.co.za`, change the Nameservers from "Default" to "Custom". Enter the four AWS NS records provided in Step 1.

3. **Verify Propagation:**
   DNS propagation can take between 1 to 48 hours. Use a tool like `whatsmydns.net` to confirm that queries for `digzio.co.za` are now resolving to the AWS Name Servers.

## 3. Cross-Origin Resource Sharing (CORS) Configuration

Because the frontend applications (`www` and `app`) are hosted on different subdomains than the backend (`api`), strict CORS rules must be enforced at the AWS API Gateway level to prevent unauthorized access.

### API Gateway CORS Rules
- **Allowed Origins:** `https://www.digzio.co.za`, `https://app.digzio.co.za`
- **Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers:** `Content-Type`, `Authorization`, `X-Requested-With`
- **Allow Credentials:** `true` (Critical for cross-subdomain cookies)

## 4. SSL/TLS Certificate Management

AWS Certificate Manager (ACM) will automatically provision and renew free SSL certificates for all three subdomains. Because DNS is managed by Route53 (following the migration in Section 2), ACM can use DNS validation to issue the certificates instantly without manual intervention.

- Certificate 1: `*.digzio.co.za` (Covers `www`, `app`, and `api`)
- Region Requirement: Certificates for CloudFront distributions (`www` and `app`) **must** be requested in the `us-east-1` (N. Virginia) region, regardless of where the backend infrastructure is hosted. The API Gateway certificate can be requested in the local region (`af-south-1`).
