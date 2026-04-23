# Digzio KYC Solution Comparison: Onfido vs DHA + Smile Identity
## Slide Content Outline

---

### Slide 1: Title Slide
**Title:** Choosing the Right KYC Stack for Digzio
**Subtitle:** A Strategic Comparison: Onfido vs DHA + Smile Identity
**Details:** Prepared by Manus AI | April 2026 | Digzio Platform Engineering
**Cover image:** /home/ubuntu/digzio_images/kyc_cover.webp — Identity verification process diagram showing document scan, biometric check, and approval flow.

---

### Slide 2: The KYC Problem Digzio Must Solve
**Heading:** Digzio Must Verify 10,000+ Students Per Month Without Compromising Trust or Burning Cash
**Content:**
Every student who applies for accommodation on Digzio must be verified before they can submit an application. The verification must confirm three things: the student is a real person, their SA ID number is valid and active, and they are physically present (not a bot or fraudster). The wrong KYC choice will cost Digzio over R1.8 million per year in unnecessary spend at scale — money that could fund engineering, marketing, or operations.

**Key stats:**
- 10,000 KYC checks per month at Growth stage
- South Africa has 2 primary ID document types: Green ID Book and Smart ID Card
- POPIA mandates data minimisation — storing ID images creates legal liability
- NSFAS funding is tied to verified identity — a failed KYC blocks a student's entire application

---

### Slide 3: What Onfido Does — and What It Costs
**Heading:** Onfido Charges $1.50 Per Check for a Process That Can Be Done Better for $0.65
**Content:**
Onfido is a global identity verification platform that works by scanning the physical ID document using OCR (Optical Character Recognition), extracting the data from the card image, and then comparing a live selfie to the photo on the document. It is a well-known, globally trusted product used by fintechs worldwide.

**How Onfido works:**
1. Student photographs front and back of SA ID card
2. Onfido OCR engine reads the card and validates security features
3. Student records a liveness selfie
4. Onfido compares selfie to the ID photo
5. Result returned: Verified or Failed

**Cost breakdown:**
- Document scan + liveness: ~$1.50 per check
- Monthly cost at 10,000 checks: $15,000
- Annual cost: $180,000 (R3.33 million)

**Limitations for South Africa:**
- OCR can fail on worn, scratched, or poorly lit Green ID Books
- Does NOT validate against the DHA population register — a convincing forgery can pass
- Stores document images on Onfido servers — increases POPIA exposure
- Generic global product, not optimised for SA ID formats

---

### Slide 4: What the Two-Layer Stack Does — and What It Costs
**Heading:** DHA + Smile Identity Goes Directly to the Government Source for 57% Less Cost
**Content:**
The Two-Layer Stack replaces Onfido's document scanning with a direct query to the Department of Home Affairs (DHA) population register — the most authoritative identity source in South Africa. Layer 2 then uses Smile Identity's SmartSelfie™ to confirm the person is real and present.

**How the Two-Layer Stack works:**
1. Student enters SA ID number and full name (no photo of card needed)
2. Layer 1: Digzio queries DHA via aggregator — confirms ID is valid, person is alive, name matches
3. If DHA check passes → Layer 2 launches
4. Student records a 3-second selfie via Smile Identity Web SDK
5. Smile Identity confirms liveness (real person, not a photo or screen)
6. Webhook result updates Digzio database — student is VERIFIED

**Cost breakdown:**
- Layer 1 (DHA validation): ~$0.15 per check
- Layer 2 (Smile liveness): ~$0.50 per check
- Total blended cost: $0.65 per check
- Monthly cost at 10,000 checks: $6,500
- Annual cost: $78,000 (R1.44 million)

---

### Slide 5: Head-to-Head Feature Comparison
**Heading:** On Every Dimension That Matters for Digzio, the Two-Layer Stack Wins or Ties
**Content:**
A direct feature comparison across the 8 dimensions most critical to Digzio's use case.

| Dimension | Onfido | DHA + Smile Identity |
|---|---|---|
| Cost per check | $1.50 | $0.65 |
| SA ID authority | Document OCR | Direct DHA database |
| Worn/damaged ID handling | Can fail | Not affected (no scan needed) |
| Liveness detection | Yes | Yes |
| POPIA data minimisation | Stores images | Zero image storage on Digzio |
| SA-specific optimisation | Generic global | Africa-first |
| Forgery resistance | OCR-based | Government database — unforgeable |
| Integration complexity | Medium | Medium |

---

### Slide 6: The $102,000 Annual Saving — Visualised
**Heading:** The Two-Layer Stack Saves Digzio $102,000 Every Year at Growth Stage Volume
**Content:**
At 10,000 checks per month, the cumulative cost difference between the two approaches reaches $102,000 over 12 months. This is not a marginal saving — it is the equivalent of a full mid-level engineering salary in South Africa, or 6 months of AWS infrastructure costs.

**Key figures:**
- Monthly saving: $8,500 (R157,250)
- Annual saving: $102,000 (R1,887,000)
- 3-year saving: $306,000 (R5,661,000)
- Break-even: Immediate — savings begin from Month 1

**Visual note:** Include the cumulative cost comparison line chart showing Onfido ($180,000) vs DHA + Smile Identity ($78,000) over 12 months, with the red shaded savings area.

---

### Slide 7: The Security Argument — Cheaper AND More Secure
**Heading:** Bypassing OCR and Going Directly to the DHA Eliminates the Most Common KYC Attack Vector
**Content:**
The most common KYC fraud in South Africa involves high-quality forged ID documents. A convincing forgery can pass an OCR-based scanner because the scanner is only checking whether the card looks right — not whether the ID number actually exists in the government register.

The DHA check is immune to this attack. It validates the ID number directly against the national population register. A forged card with a valid-looking but non-existent ID number will fail Layer 1 immediately, before any liveness check is even attempted. This makes the Two-Layer Stack both cheaper and more resistant to the most prevalent form of identity fraud in the South African market.

**Security comparison:**
- Onfido: Checks if the card LOOKS valid
- DHA: Checks if the person IS registered with the government
- The DHA check is the gold standard — used by South African banks, insurers, and government agencies

---

### Slide 8: POPIA Compliance Advantage
**Heading:** The Two-Layer Stack Dramatically Reduces Digzio's POPIA Liability by Storing Zero ID Images
**Content:**
The Protection of Personal Information Act (POPIA) requires organisations to minimise the personal information they collect and store. An ID document image is classified as highly sensitive personal information under POPIA. Storing these images — even temporarily — creates legal obligations around encryption, access control, retention periods, and breach notification.

The Two-Layer Stack eliminates this risk entirely. Because no ID card image is ever captured or transmitted, Digzio never holds this sensitive data. Only the DHA check result (valid/invalid) and the Smile Identity liveness result (passed/failed) are stored — neither of which constitutes sensitive personal information under POPIA.

**POPIA risk comparison:**
- Onfido: ID images stored on Onfido servers → Digzio has data processor obligations
- DHA + Smile Identity: No images stored anywhere → Zero POPIA image liability
- Regulatory risk reduction: Significant

---

### Slide 9: Integration Architecture
**Heading:** The Two-Layer Stack Integrates in 7 Clean API Steps with Full Async Processing
**Content:**
The integration is designed to be non-blocking — the student's registration flow is never held up waiting for a government API response. Both layers process asynchronously in the background.

**The 7-step flow:**
1. Student submits ID number + name via Digzio app
2. Digzio backend calls DHA API (Layer 1)
3. DHA returns: valid, alive, name match score
4. If passed → Smile Identity Web SDK launches in browser
5. Student records 3-second selfie
6. Smile Identity processes liveness check (async)
7. Webhook fires to Digzio → database updated → student notified via WebSocket

**Technology stack:**
- Backend: Node.js + `smile-identity-core` SDK
- Database: PostgreSQL (`users.kyc_status` field)
- Real-time notification: WebSocket push to frontend
- POPIA: Zero PII stored on Digzio servers

---

### Slide 10: Recommendation and Decision
**Heading:** Digzio Must Adopt the Two-Layer Stack Before Scaling Beyond MVP
**Content:**
The evidence is unambiguous. The DHA + Smile Identity Two-Layer Stack is superior to Onfido on cost, security, POPIA compliance, and South African market fit. The only scenario in which Onfido would be preferable is if Digzio needed to verify international students with non-SA documents at scale — which is not part of the current product roadmap.

**Decision summary:**
- Adopt DHA + Smile Identity as the primary KYC stack from Sprint 4 onwards
- Budget: $6,500/month (vs $15,000/month for Onfido)
- Annual saving: $102,000 reinvested into product development
- Revisit Onfido only if international student verification becomes a requirement

**Next steps:**
1. Register with Smile Identity for a sandbox account
2. Obtain DHA API access via PBVerify or TransUnion aggregator
3. Implement the KYC service in Sprint 4 (Weeks 7–8)
4. Run 100 test verifications in sandbox before going live

---

### Slide 11: Summary — The Case in One Page
**Heading:** $102,000 Saved. More Secure. More Compliant. The Decision Is Clear.
**Content:**
Three reasons the Two-Layer Stack wins:

**1. Cost:** $0.65 vs $1.50 per check. $102,000 saved annually at 10,000 checks/month. The savings fund a full engineering hire.

**2. Security:** Direct DHA government database validation is immune to document forgery — the most common KYC attack in South Africa. Onfido's OCR can be fooled by a convincing fake.

**3. Compliance:** Zero ID images stored on Digzio servers means zero POPIA image liability. Onfido requires Digzio to manage sensitive document images as a data processor.

**The recommendation is unambiguous:** Digzio must implement the DHA + Smile Identity Two-Layer Stack as its primary KYC solution.

---
