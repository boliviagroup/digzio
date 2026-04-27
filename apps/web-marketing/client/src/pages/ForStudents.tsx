import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, Search, FileCheck, CreditCard, Home, Shield, Star } from "lucide-react";

const steps = [
  { icon: Search, num: "01", title: "Search Verified Listings", body: "Browse hundreds of NSFAS-accredited properties near your campus. Every listing is verified for safety, compliance, and habitability before it appears on Digzio." },
  { icon: FileCheck, num: "02", title: "Apply in Minutes", body: "Complete your application entirely online. Upload your NSFAS approval letter, ID, and proof of registration — no physical visits required." },
  { icon: CreditCard, num: "03", title: "NSFAS Pays Directly", body: "Your NSFAS allowance is disbursed directly to your provider through Digzio's automated payment system. No delays, no manual transfers." },
  { icon: Home, num: "04", title: "Move In with Confidence", body: "Receive your digital lease, move-in checklist, and 24/7 support access. Your housing is sorted before the semester starts." },
];

const faqs = [
  { q: "Is Digzio free for students?", a: "Yes. Digzio is completely free for students. There are no application fees, no listing fees, and no hidden charges. The platform is funded by a small service fee paid by accommodation providers." },
  { q: "Do I need NSFAS funding to use Digzio?", a: "No. Digzio supports all student payer types — NSFAS-funded, private-paying, and mixed. If you're paying privately, you can still use Digzio to find verified, safe accommodation." },
  { q: "How do I know a property is safe and compliant?", a: "Every property listed on Digzio has been verified against DHET accreditation standards. We check safety certificates, habitability conditions, and compliance documentation before any property goes live." },
  { q: "What happens if my NSFAS payment is late?", a: "Digzio's automated payment system has a 99.8% on-time disbursement rate. In the rare event of a delay, our support team works directly with NSFAS on your behalf to resolve it." },
  { q: "Can I apply to multiple properties?", a: "Yes. You can browse and apply to multiple properties simultaneously. Once you accept an offer and sign your digital lease, your other applications are automatically withdrawn." },
];

export default function ForStudents() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-24 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}
      >
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6" style={{ background: "rgba(46,196,196,0.15)", border: "1px solid rgba(46,196,196,0.3)", color: "#2EC4C4" }}>
              For Students
            </span>
            <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6 leading-tight" style={{ fontWeight: 800 }}>
              Find your place.<br />
              <span style={{ color: "#2EC4C4" }}>Focus on your future.</span>
            </h1>
            <p className="text-xl mb-10 max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
              Browse verified, NSFAS-accredited accommodation near your campus. Apply online, get paid on time, and move in with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/search">
                <button className="btn-primary" style={{ padding: "0.875rem 2rem" }}>
                  Find Accommodation <ArrowRight size={16} />
                </button>
              </Link>
              <Link href="/how-it-works">
                <button className="btn-outline-white" style={{ padding: "0.875rem 2rem" }}>
                  How NSFAS Payments Work
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-4">
          {[
            { value: "R0", label: "Application Fee" },
            { value: "99.8%", label: "Payment Success" },
            { value: "2,847+", label: "Students Housed" },
          ].map((s) => (
            <div key={s.label} className="px-6 py-4 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
              <div className="text-2xl font-800 text-white" style={{ fontWeight: 800 }}>{s.value}</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Image + intro */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-students-e7LbVBCgXXKPx4F7HrJkAF.webp"
                alt="Student moving into accommodation"
                className="w-full rounded-2xl object-cover"
                style={{ height: 420, boxShadow: "0 20px 60px rgba(15,45,74,0.15)" }}
              />
            </div>
            <div>
              <span className="section-label">Your Housing Journey</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>
                Safe, verified housing. No stress, no surprises.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Finding student accommodation in South Africa shouldn't be a source of anxiety. Digzio verifies every property against DHET accreditation standards so you only see safe, compliant listings. And because we integrate directly with NSFAS, your allowance reaches your provider on time — every time.
              </p>
              <ul className="space-y-3">
                {[
                  "Every listing is DHET-accredited and safety-verified",
                  "Apply entirely online — no physical visits required",
                  "NSFAS payments automated with 99.8% success rate",
                  "Digital lease signing and move-in support",
                  "24/7 student support team",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle size={16} style={{ color: "#2ECC71", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">The Process</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              From search to move-in in 4 steps.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px" style={{ background: "linear-gradient(to right, #1A9BAD, transparent)", zIndex: 0 }} />
                )}
                <div className="bg-white p-7 rounded-2xl relative z-10" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                  <div className="text-4xl font-800 mb-4" style={{ color: "#E8ECEF", fontWeight: 800 }}>{step.num}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(26,155,173,0.1)" }}>
                    <step.icon size={18} style={{ color: "#1A9BAD" }} />
                  </div>
                  <h3 className="font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Student Safety</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Your safety is non-negotiable.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Every property on Digzio passes our five-point verification before it's listed. We check so you don't have to.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: Shield, label: "DHET Accreditation", desc: "Verified against official government standards" },
              { icon: CheckCircle, label: "Safety Inspection", desc: "Fire, electrical, and structural checks" },
              { icon: Star, label: "Habitability Rating", desc: "Minimum standards for student living" },
              { icon: FileCheck, label: "Provider KYC", desc: "Every provider is identity-verified" },
              { icon: Home, label: "Lease Compliance", desc: "All leases reviewed against NSFAS requirements" },
            ].map((item) => (
              <div key={item.label} className="text-center p-6 rounded-2xl" style={{ background: "#F5F7FA" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(26,155,173,0.1)" }}>
                  <item.icon size={20} style={{ color: "#1A9BAD" }} />
                </div>
                <h4 className="font-700 text-gray-900 text-sm mb-2" style={{ fontWeight: 700 }}>{item.label}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
            <span className="section-label">FAQ</span>
            <h2 className="text-4xl font-800 text-gray-900" style={{ fontWeight: 800 }}>
              Student questions, answered.
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-7 rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.06)" }}>
                <h3 className="font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
        <div className="container text-center">
          <h2 className="text-4xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Your room is waiting.
          </h2>
          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join 2,847 students who found verified housing through Digzio. Zero fees. Zero stress.
          </p>
          <Link href="/search">
            <button className="btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
              Find My Accommodation <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
