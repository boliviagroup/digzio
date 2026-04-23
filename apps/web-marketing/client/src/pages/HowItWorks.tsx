import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, GraduationCap, Building2, University, CheckCircle } from "lucide-react";

const studentJourney = [
  { num: "01", title: "Create Your Profile", body: "Register with your student number, university, and NSFAS approval status. Verification takes under 5 minutes." },
  { num: "02", title: "Browse Verified Listings", body: "Search NSFAS-accredited properties near your campus. Filter by price, distance, amenities, and availability." },
  { num: "03", title: "Apply Online", body: "Submit your application with your NSFAS letter, ID, and proof of registration — entirely online, no physical visits." },
  { num: "04", title: "Sign Your Lease Digitally", body: "Review and sign your lease agreement digitally. No printing, no scanning, no delays." },
  { num: "05", title: "NSFAS Pays Your Provider", body: "Digzio's automated payment system routes your NSFAS allowance directly to your provider on the first day of each month." },
  { num: "06", title: "Move In & Focus on Studies", body: "Receive your move-in checklist, building access details, and 24/7 support contact. Your housing is sorted." },
];

const providerJourney = [
  { num: "01", title: "Register & Verify", body: "Submit your property details, DHET accreditation documents, and identity verification. Our team reviews within 48 hours." },
  { num: "02", title: "List Your Rooms", body: "Create detailed listings with photos, amenities, pricing, and availability. Listings go live after compliance verification." },
  { num: "03", title: "Receive Applications", body: "Review student applications from your provider dashboard. Accept, decline, or request additional documents." },
  { num: "04", title: "Automate Your Payments", body: "NSFAS disbursements are routed directly to your registered bank account on a fixed monthly schedule." },
  { num: "05", title: "Manage Compliance", body: "Your compliance dashboard tracks accreditation expiry dates, safety certificate renewals, and inspection schedules." },
  { num: "06", title: "Earn Holiday Income", body: "List vacant rooms on Digzio's short-term marketplace during university holidays and earn additional revenue." },
];

const techStack = [
  { label: "NSFAS API Integration", desc: "Direct connection to NSFAS payment systems for real-time disbursement processing" },
  { label: "DHET Compliance Engine", desc: "Automated verification against Department of Higher Education and Training standards" },
  { label: "Digital Lease Management", desc: "Legally compliant digital lease generation, signing, and storage" },
  { label: "KYC Verification", desc: "Automated identity and document verification for all platform participants" },
  { label: "Real-Time Dashboards", desc: "Live data visualisation for occupancy, payments, and compliance status" },
  { label: "Automated Reporting", desc: "One-click generation of DHET-compliant institutional reports" },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-24"
        style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}
      >
        <div className="container text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6" style={{ background: "rgba(46,196,196,0.15)", border: "1px solid rgba(46,196,196,0.3)", color: "#2EC4C4" }}>
            How It Works
          </span>
          <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            The complete student housing lifecycle,<br />
            <span style={{ color: "#2EC4C4" }}>automated end-to-end.</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            Digzio connects students, providers, and universities in a single automated ecosystem — eliminating manual processes, payment delays, and compliance gaps.
          </p>
        </div>
      </section>

      {/* Three-sided marketplace overview */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">The Ecosystem</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Three sides. One platform.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Unlike single-sided rental platforms, Digzio is a three-sided marketplace. Every action on one side creates value for the other two.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                label: "Students",
                color: "#1A9BAD",
                points: ["Browse verified listings", "Apply online for free", "Receive NSFAS-funded housing", "24/7 support access"],
                href: "/students",
              },
              {
                icon: Building2,
                label: "Providers",
                color: "#0F2D4A",
                points: ["List DHET-accredited rooms", "Receive automated NSFAS payments", "Manage compliance digitally", "Earn holiday rental income"],
                href: "/providers",
              },
              {
                icon: University,
                label: "Institutions",
                color: "#2EC4C4",
                points: ["Monitor provider compliance", "Access real-time student registry", "Generate DHET reports", "Receive compliance alerts"],
                href: "/institutions",
              },
            ].map((side) => (
              <div key={side.label} className="bg-white p-8 rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${side.color}15` }}>
                  <side.icon size={22} style={{ color: side.color }} />
                </div>
                <h3 className="text-xl font-700 text-gray-900 mb-5" style={{ fontWeight: 700 }}>{side.label}</h3>
                <ul className="space-y-3 mb-6">
                  {side.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} style={{ color: "#2ECC71", flexShrink: 0, marginTop: 2 }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={side.href}>
                  <button className="text-sm font-700 flex items-center gap-1" style={{ color: side.color, fontWeight: 700 }}>
                    Learn more <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student journey */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="mb-16">
            <span className="section-label">Student Journey</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              From search to move-in.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentJourney.map((step) => (
              <div key={step.num} className="p-7 rounded-2xl" style={{ background: "#F5F7FA" }}>
                <div className="text-4xl font-800 mb-4" style={{ color: "#E8ECEF", fontWeight: 800 }}>{step.num}</div>
                <h3 className="font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider journey */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="mb-16">
            <span className="section-label">Provider Journey</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              From listing to automated income.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providerJourney.map((step) => (
              <div key={step.num} className="bg-white p-7 rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                <div className="text-4xl font-800 mb-4" style={{ color: "#E8ECEF", fontWeight: 800 }}>{step.num}</div>
                <h3 className="font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-24" style={{ background: "#0F2D4A" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Technology</span>
            <h2 className="text-4xl font-800 text-white mb-4" style={{ fontWeight: 800 }}>
              Built on robust, secure infrastructure.
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
              Digzio's platform is built on enterprise-grade infrastructure with bank-level security, 99.9% uptime SLA, and full POPIA compliance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((item) => (
              <div key={item.label} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: "#1A9BAD" }} />
                <h3 className="font-700 text-white mb-2" style={{ fontWeight: 700 }}>{item.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #1A9BAD, #2EC4C4)" }}>
        <div className="container text-center">
          <h2 className="text-4xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Ready to get started?
          </h2>
          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.85)" }}>
            Choose your path and join South Africa's student housing ecosystem.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/students">
              <button className="btn-navy" style={{ padding: "0.875rem 2rem" }}>
                I'm a Student
              </button>
            </Link>
            <Link href="/providers">
              <button className="btn-navy" style={{ padding: "0.875rem 2rem" }}>
                I'm a Provider
              </button>
            </Link>
            <Link href="/institutions">
              <button className="btn-navy" style={{ padding: "0.875rem 2rem" }}>
                I'm a University
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
