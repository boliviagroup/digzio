import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, BarChart3, Shield, FileCheck, Bell, Users, Globe } from "lucide-react";

const features = [
  { icon: BarChart3, title: "Real-Time Compliance Dashboard", body: "Monitor every accredited provider in your network with live compliance scores, expiry alerts, and audit-ready documentation — all in one view.", color: "#1A9BAD" },
  { icon: FileCheck, title: "Automated DHET Reporting", body: "Generate DHET-compliant reports at the click of a button. Digzio automatically compiles occupancy data, compliance status, and payment records into submission-ready formats.", color: "#2ECC71" },
  { icon: Bell, title: "Compliance Alerts", body: "Receive automated alerts when a provider's accreditation is due for renewal, when a safety certificate expires, or when a compliance threshold is breached.", color: "#F5A623" },
  { icon: Users, title: "Student Housing Registry", body: "Maintain a verified, real-time registry of all students in off-campus accommodation. Know exactly where your students are living and whether their housing meets standards.", color: "#2EC4C4" },
  { icon: Shield, title: "Provider Verification Network", body: "Access Digzio's pre-verified provider network. Every provider has passed identity checks, property inspections, and DHET accreditation verification before joining.", color: "#1A9BAD" },
  { icon: Globe, title: "Multi-Campus Management", body: "Manage housing compliance across multiple campuses from a single institutional dashboard. Ideal for universities with distributed student populations.", color: "#2EC4C4" },
];

export default function ForInstitutions() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 50%, #1A9BAD 100%)" }}
      >
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6" style={{ background: "rgba(46,196,196,0.15)", border: "1px solid rgba(46,196,196,0.3)", color: "#2EC4C4" }}>
                For Universities &amp; Institutions
              </span>
              <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6 leading-tight" style={{ fontWeight: 800 }}>
                Compliance, automated.<br />
                <span style={{ color: "#2EC4C4" }}>Students, protected.</span>
              </h1>
              <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
                Real-time compliance dashboards, automated DHET reporting, and a verified provider network — built for university housing offices.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <button className="btn-primary" style={{ padding: "0.875rem 2rem" }}>
                    Request a Demo <ArrowRight size={16} />
                  </button>
                </Link>
                <a href="/digzio-brochure.pdf" download="Digzio-Platform-Brochure.pdf">
                  <button className="btn-outline-white" style={{ padding: "0.875rem 2rem" }}>
                    Download Brochure
                  </button>
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-institutions-VGvYQKyfJNE8fdNda6Fgoh.webp"
                alt="University compliance dashboard"
                className="w-full rounded-2xl object-cover"
                style={{ height: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#1A9BAD" }} className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: "23", label: "Partner Universities" },
              { value: "100%", label: "DHET Report Accuracy" },
              { value: "Zero", label: "Manual Compliance Admin" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-800 mb-2" style={{ fontWeight: 800 }}>{s.value}</div>
                <div className="text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.8)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Platform Capabilities</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Built for institutional compliance.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Digzio gives housing offices the tools to meet their DHET obligations, protect students, and manage off-campus accommodation at scale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat) => (
              <div key={feat.title} className="bg-white p-8 rounded-2xl card-hover" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${feat.color}18` }}>
                  <feat.icon size={22} style={{ color: feat.color }} />
                </div>
                <h3 className="font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance narrative */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">Regulatory Compliance</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>
                DHET compliance is a legal obligation. Digzio makes it effortless.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Under DHET regulations, universities are responsible for ensuring that NSFAS-funded students live in accredited, safe accommodation. Manual compliance management — spreadsheets, physical inspections, paper records — is no longer adequate at scale.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Digzio's institutional platform automates the entire compliance lifecycle: from provider accreditation verification to real-time monitoring to automated DHET report generation. Your housing office stays compliant without the administrative burden.
              </p>
              <ul className="space-y-3">
                {[
                  "Automated provider accreditation verification",
                  "Real-time compliance monitoring and alerts",
                  "One-click DHET report generation",
                  "Audit-ready documentation archive",
                  "Student housing registry with live status",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle size={16} style={{ color: "#2ECC71", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-10 rounded-2xl" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
              <h3 className="text-xl font-700 text-white mb-6" style={{ fontWeight: 700 }}>Compliance Dashboard Preview</h3>
              <div className="space-y-4">
                {[
                  { label: "Accredited Providers", value: "156", status: "green", pct: 94 },
                  { label: "Compliance Score", value: "97.2%", status: "green", pct: 97 },
                  { label: "Pending Renewals", value: "8", status: "amber", pct: 15 },
                  { label: "DHET Reports Filed", value: "12/12", status: "green", pct: 100 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{row.label}</span>
                      <span className="text-sm font-700 text-white" style={{ fontWeight: 700 }}>{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${row.pct}%`,
                          background: row.status === "green" ? "#2ECC71" : "#F5A623",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
        <div className="container text-center">
          <h2 className="text-4xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Ready to automate your compliance?
          </h2>
          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join 23 partner universities already using Digzio to protect students and meet DHET obligations.
          </p>
          <Link href="/contact">
            <button className="btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
              Request a Demo <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
