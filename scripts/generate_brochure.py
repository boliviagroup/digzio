#!/usr/bin/env python3
"""Generate the Digzio platform brochure PDF."""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import KeepTogether
import os

OUTPUT_PATH = "/home/ubuntu/digzio/apps/web-marketing/client/public/digzio-brochure.pdf"
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

# ── Colours ──────────────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#0F2D4A")
TEAL    = colors.HexColor("#1A9BAD")
TEAL2   = colors.HexColor("#2EC4C4")
LIGHT   = colors.HexColor("#F5F7FA")
GREY    = colors.HexColor("#6B7280")
WHITE   = colors.white
ORANGE  = colors.HexColor("#F5A623")
GREEN   = colors.HexColor("#10B981")

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=16*mm, bottomMargin=16*mm,
    title="Digzio Platform Brochure",
    author="Digzio",
)

W = A4[0] - 36*mm  # usable width

styles = getSampleStyleSheet()

def style(name, **kwargs):
    return ParagraphStyle(name, **kwargs)

H1 = style("H1", fontSize=28, leading=34, textColor=WHITE, fontName="Helvetica-Bold", alignment=TA_LEFT)
H2 = style("H2", fontSize=18, leading=24, textColor=NAVY, fontName="Helvetica-Bold", alignment=TA_LEFT)
H3 = style("H3", fontSize=13, leading=17, textColor=NAVY, fontName="Helvetica-Bold", alignment=TA_LEFT)
BODY = style("BODY", fontSize=9.5, leading=14, textColor=GREY, fontName="Helvetica", alignment=TA_LEFT)
BODY_W = style("BODY_W", fontSize=9.5, leading=14, textColor=WHITE, fontName="Helvetica", alignment=TA_LEFT)
LABEL = style("LABEL", fontSize=8, leading=11, textColor=TEAL, fontName="Helvetica-Bold", alignment=TA_LEFT, spaceAfter=2)
SMALL = style("SMALL", fontSize=8, leading=11, textColor=GREY, fontName="Helvetica", alignment=TA_LEFT)
STAT_NUM = style("STAT_NUM", fontSize=22, leading=26, textColor=TEAL, fontName="Helvetica-Bold", alignment=TA_CENTER)
STAT_LBL = style("STAT_LBL", fontSize=8, leading=11, textColor=GREY, fontName="Helvetica", alignment=TA_CENTER)
FOOTER_S = style("FOOTER_S", fontSize=8, leading=11, textColor=GREY, fontName="Helvetica", alignment=TA_CENTER)

story = []

# ── COVER BANNER ─────────────────────────────────────────────────────────────
cover_data = [[
    Paragraph("<b>DIGZIO</b>", style("cov_title", fontSize=32, leading=38, textColor=WHITE, fontName="Helvetica-Bold")),
]]
cover_table = Table(cover_data, colWidths=[W])
cover_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), NAVY),
    ("TOPPADDING",    (0,0), (-1,-1), 18),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING",   (0,0), (-1,-1), 14),
    ("RIGHTPADDING",  (0,0), (-1,-1), 14),
    ("ROUNDEDCORNERS", (0,0), (-1,-1), [8,8,0,0]),
]))
story.append(cover_table)

sub_data = [[
    Paragraph("The Student Accommodation Platform for South Africa", style("sub", fontSize=13, leading=17, textColor=TEAL2, fontName="Helvetica-Bold")),
]]
sub_table = Table(sub_data, colWidths=[W])
sub_table.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), NAVY),
    ("TOPPADDING",    (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 14),
    ("LEFTPADDING",   (0,0), (-1,-1), 14),
    ("RIGHTPADDING",  (0,0), (-1,-1), 14),
    ("ROUNDEDCORNERS", (0,0), (-1,-1), [0,0,8,8]),
]))
story.append(sub_table)
story.append(Spacer(1, 10*mm))

# ── INTRO ─────────────────────────────────────────────────────────────────────
story.append(Paragraph("ABOUT DIGZIO", LABEL))
story.append(Paragraph(
    "<b>Digzio</b> is South Africa's dedicated student accommodation platform — connecting verified students with NSFAS-accredited providers, "
    "automating POSA compliance submissions, and giving universities real-time occupancy visibility. "
    "From lease generation to monthly POSA Excel submissions, Digzio handles the full accommodation lifecycle in one place.",
    BODY))
story.append(Spacer(1, 8*mm))

# ── STATS ROW ─────────────────────────────────────────────────────────────────
stats = [
    ("2,400+", "Verified Students"),
    ("156",    "Accredited Providers"),
    ("12",     "Partner Universities"),
    ("R18,400","Avg. Provider Revenue"),
]
stat_cells = [[Paragraph(v, STAT_NUM), Paragraph(l, STAT_LBL)] for v, l in stats]
stat_row = [cell for pair in stat_cells for cell in pair]  # flatten

# Build as a 4-column table (each stat = 2 rows: number + label)
stat_data = [
    [Paragraph(v, STAT_NUM) for v, _ in stats],
    [Paragraph(l, STAT_LBL) for _, l in stats],
]
stat_table = Table(stat_data, colWidths=[W/4]*4)
stat_table.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), LIGHT),
    ("TOPPADDING",    (0,0), (-1,-1), 10),
    ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ("RIGHTPADDING",  (0,0), (-1,-1), 6),
    ("ALIGN",         (0,0), (-1,-1), "CENTER"),
    ("ROUNDEDCORNERS",(0,0), (-1,-1), [8,8,8,8]),
]))
story.append(stat_table)
story.append(Spacer(1, 8*mm))

# ── WHO WE SERVE ──────────────────────────────────────────────────────────────
story.append(Paragraph("WHO WE SERVE", LABEL))
story.append(Spacer(1, 3*mm))

audience_data = [
    [
        Paragraph("<b>Students</b>", H3),
        Paragraph("<b>Providers</b>", H3),
        Paragraph("<b>Universities</b>", H3),
    ],
    [
        Paragraph(
            "Search NSFAS-accredited accommodation, complete digital lease signing, track payment status, "
            "and manage POSA profile data — all from one dashboard.",
            SMALL),
        Paragraph(
            "List properties, manage tenant applications, generate UJ-format POSA occupancy lists, "
            "create invoices, and track NSFAS payment submissions monthly.",
            SMALL),
        Paragraph(
            "Monitor off-campus accommodation compliance in real time, verify POSA submissions, "
            "and access DHET-ready occupancy reports without manual data collection.",
            SMALL),
    ],
]
aud_col = W / 3 - 3*mm
audience_table = Table(audience_data, colWidths=[aud_col, aud_col, aud_col], spaceBefore=0, spaceAfter=0)
audience_table.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), WHITE),
    ("BOX",           (0,0), (0,-1), 0.5, TEAL),
    ("BOX",           (1,0), (1,-1), 0.5, TEAL),
    ("BOX",           (2,0), (2,-1), 0.5, TEAL),
    ("TOPPADDING",    (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("ROUNDEDCORNERS",(0,0), (-1,-1), [6,6,6,6]),
    ("LINEAFTER",     (0,0), (1,-1), 0.5, LIGHT),
]))
story.append(audience_table)
story.append(Spacer(1, 8*mm))

# ── POSA COMPLIANCE MODULE ────────────────────────────────────────────────────
story.append(HRFlowable(width=W, thickness=0.5, color=LIGHT, spaceAfter=6))
story.append(Paragraph("POSA COMPLIANCE MODULE", LABEL))
story.append(Paragraph(
    "Digzio's POSA (Private Off-campus Student Accommodation) module is built specifically for the UJ POSA programme "
    "and is designed to be extended to any South African university. Providers can:",
    BODY))
story.append(Spacer(1, 4*mm))

posa_features = [
    ("Monthly Occupancy List", "Auto-generate the UJ-prescribed Excel occupancy list with all required fields (POSA Code, Student Number, Gender, Year of Study, Qualification, Funding Type) — ready to email to posadocuments@uj.ac.za."),
    ("NSFAS Status Tracking",  "Cross-reference each student against the NSFAS funded list. Instantly see who is Verified, Pending, or Not on List before submission."),
    ("Contract Management",    "Generate, distribute, and track digital lease agreements per student. Download individual PDFs or a full ZIP package for submission."),
    ("Invoice Generation",     "Create per-student invoices with banking details, lease period, and total amount. Generate all invoices in one click."),
    ("Submission Checklist",   "A live checklist shows exactly what is ready and what is blocking submission — Occupancy List, Contracts, Invoices, NSFAS Verification, and Banking Details."),
    ("Submission History",     "Track past monthly submissions with amounts and status (Submitted / Overdue / Pending) for full audit trail."),
]

for title, body in posa_features:
    feat_data = [[
        Paragraph(f"<b>{title}</b>", style("ft", fontSize=9.5, leading=13, textColor=NAVY, fontName="Helvetica-Bold")),
        Paragraph(body, SMALL),
    ]]
    feat_table = Table(feat_data, colWidths=[45*mm, W - 45*mm])
    feat_table.setStyle(TableStyle([
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("LINEBELOW",     (0,0), (-1,-1), 0.3, LIGHT),
    ]))
    story.append(feat_table)

story.append(Spacer(1, 8*mm))

# ── KEY FEATURES ─────────────────────────────────────────────────────────────
story.append(HRFlowable(width=W, thickness=0.5, color=LIGHT, spaceAfter=6))
story.append(Paragraph("PLATFORM FEATURES", LABEL))
story.append(Spacer(1, 3*mm))

features = [
    ("Digital Lease Signing",      "Legally binding lease agreements generated and signed digitally — no printing required."),
    ("NSFAS Payment Automation",   "Automated NSFAS disbursement tracking and AP payment processing through the Fundi system."),
    ("KYC Verification",           "Student identity verification with ID number, student number, and NSFAS status cross-check."),
    ("Property Listings",          "Searchable, filterable property marketplace with NSFAS accreditation badges and real-time availability."),
    ("Holiday Rental Revenue",     "Providers can monetise vacant rooms during university holidays through Digzio's short-term rental marketplace."),
    ("University Compliance Dash", "Real-time compliance dashboards for university housing offices — DHET-ready occupancy reports without manual data collection."),
    ("Multi-Role Platform",        "Separate dashboards for Students, Providers, Universities, and Digzio Admin — each with role-specific tools."),
    ("Secure & Cloud-Native",      "Hosted on AWS (Cape Town region) with end-to-end encryption, JWT authentication, and role-based access control."),
]

feat_rows = []
for i in range(0, len(features), 2):
    left = features[i]
    right = features[i+1] if i+1 < len(features) else ("", "")
    feat_rows.append([
        Paragraph(f"<b>{left[0]}</b><br/><font size=8 color='#6B7280'>{left[1]}</font>",
                  style("fr", fontSize=9.5, leading=13, textColor=NAVY, fontName="Helvetica-Bold")),
        Paragraph(f"<b>{right[0]}</b><br/><font size=8 color='#6B7280'>{right[1]}</font>",
                  style("fr2", fontSize=9.5, leading=13, textColor=NAVY, fontName="Helvetica-Bold")) if right[0] else Paragraph("", BODY),
    ])

feat_table2 = Table(feat_rows, colWidths=[W/2 - 3*mm, W/2 - 3*mm], spaceBefore=0, spaceAfter=0)
feat_table2.setStyle(TableStyle([
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("BACKGROUND",    (0,0), (-1,-1), LIGHT),
    ("LINEBELOW",     (0,0), (-1,-1), 0.3, WHITE),
    ("LINEAFTER",     (0,0), (-2,-1), 0.3, WHITE),
    ("ROUNDEDCORNERS",(0,0), (-1,-1), [6,6,6,6]),
]))
story.append(feat_table2)
story.append(Spacer(1, 8*mm))

# ── CTA / CONTACT ─────────────────────────────────────────────────────────────
cta_data = [[
    Paragraph(
        "<b>Get Started with Digzio</b><br/>"
        "<font size=9 color='#2EC4C4'>www.digzio.co.za</font><br/><br/>"
        "<font size=8.5 color='rgba(255,255,255,0.75)'>List your property · Request a demo · Partner with us</font>",
        style("cta", fontSize=13, leading=18, textColor=WHITE, fontName="Helvetica-Bold")),
    Paragraph(
        "<b>Contact</b><br/>"
        "<font size=8.5 color='rgba(255,255,255,0.75)'>hello@digzio.co.za</font><br/><br/>"
        "<b>POSA Submissions</b><br/>"
        "<font size=8.5 color='rgba(255,255,255,0.75)'>posadocuments@uj.ac.za</font>",
        style("cta2", fontSize=9.5, leading=14, textColor=WHITE, fontName="Helvetica-Bold")),
]]
cta_table = Table(cta_data, colWidths=[W*0.6, W*0.4])
cta_table.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,-1), NAVY),
    ("TOPPADDING",    (0,0), (-1,-1), 16),
    ("BOTTOMPADDING", (0,0), (-1,-1), 16),
    ("LEFTPADDING",   (0,0), (-1,-1), 16),
    ("RIGHTPADDING",  (0,0), (-1,-1), 16),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("LINEAFTER",     (0,0), (0,-1), 0.5, TEAL),
    ("ROUNDEDCORNERS",(0,0), (-1,-1), [8,8,8,8]),
]))
story.append(cta_table)
story.append(Spacer(1, 5*mm))
story.append(Paragraph("© 2026 Digzio · All rights reserved · Registered in South Africa", FOOTER_S))

doc.build(story)
print(f"Brochure generated: {OUTPUT_PATH}")
