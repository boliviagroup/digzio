import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, ArrowRight, TrendingUp, Shield, Zap, Calendar, DollarSign, BarChart3 } from "lucide-react";

const features = [
  { icon: DollarSign, title: "Keep 100% of NSFAS Income", body: "Digzio charges providers a small platform fee — never a percentage of your NSFAS income. Every rand of your NSFAS allowance reaches you.", color: "#2ECC71" },
  { icon: Zap, title: "Automated NSFAS Payments", body: "Direct integration with NSFAS payment systems means your disbursements arrive on time, every time. No more chasing payments or manual reconciliation.", color: "#1A9BAD" },
  { icon: Shield, title: "Digital Compliance Management", body: "Your DHET accreditation documentation, safety certificates, and compliance records are managed digitally. Renew, update, and track everything in one place.", color: "#2EC4C4" },
  { icon: Calendar, title: "Holiday Rental Revenue", body: "Monetise vacant rooms during university holidays through Digzio's short-term rental marketplace. Providers earn an average of R18,400 in additional annual revenue.", color: "#F5A623" },
  { icon: BarChart3, title: "Occupancy Analytics", body: "Real-time dashboards show occupancy rates, payment status, and compliance scores. Make data-driven decisions about your property portfolio.", color: "#1A9BAD" },
  { icon: TrendingUp, title: "Verified Student Pipeline", body: "Access a verified pipeline of NSFAS-approved students matched to your property's capacity and location. Fill vacancies faster with qualified tenants.", color: "#2ECC71" },
];

const pricing = [
  {
    name: "Starter",
    price: "R299",
    period: "/month",
    desc: "For individual landlords with 1–5 units",
    features: ["Up to 5 listed units", "Automated NSFAS payments", "Digital compliance management", "Basic occupancy dashboard", "Email support"],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: "R799",
    period: "/month",
    desc: "For growing providers with 6–30 units",
    features: ["Up to 30 listed units", "Everything in Starter", "Holiday rental marketplace access", "Advanced analytics & reporting", "Priority phone support", "Dedicated account manager"],
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large portfolios and property companies",
    features: ["Unlimited units", "Everything in Professional", "Custom integrations", "Multi-property dashboard", "SLA guarantee", "On-site onboarding"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function ForProviders() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-24 overflow-hidden"
        style={{ background: "#0F2D4A" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #1A9BAD 0%, transparent 60%)" }} />
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6" style={{ background: "rgba(26,155,173,0.15)", border: "1px solid rgba(26,155,173,0.3)", color: "#1A9BAD" }}>
                For Accommodation Providers
              </span>
              <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6 leading-tight" style={{ fontWeight: 800 }}>
                Keep every rand.<br />
                <span style={{ color: "#2EC4C4" }}>Automate everything.</span>
              </h1>
              <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
                The only platform that automates your NSFAS payments, manages your compliance, and helps you earn extra income from vacant rooms — all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/list-property">
                  <button className="btn-primary" style={{ padding: "0.875rem 2rem" }}>
                    List Your Property <ArrowRight size={16} />
                  </button>
                </Link>
                <button className="btn-outline-white" style={{ padding: "0.875rem 2rem" }}>
                  View Pricing
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-providers-aNgufVdn6Zy3zY3aHdw7WU.webp"
                alt="Accommodation provider"
                className="w-full rounded-2xl object-cover"
                style={{ height: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key metric */}
      <section style={{ background: "linear-gradient(135deg, #1A9BAD, #2EC4C4)" }} className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: "100%", label: "NSFAS Income Retained" },
              { value: "R18,400", label: "Avg. Holiday Rental Revenue" },
              { value: "3 days", label: "Average Payment Turnaround" },
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
            <span className="section-label">Platform Features</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Everything a provider needs.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Digzio replaces the manual, error-prone processes that cost providers time and money with a fully automated platform.
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

      {/* Holiday rental callout */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="p-10 rounded-2xl" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
              <div className="text-5xl font-800 text-white mb-2" style={{ fontWeight: 800 }}>R18,400</div>
              <div className="text-sm uppercase tracking-wider mb-6" style={{ color: "#1A9BAD" }}>Average Additional Annual Revenue</div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                University rooms sit empty for 16 weeks a year during holidays. Digzio's holiday rental marketplace connects your vacant rooms with short-term travellers, generating income you'd otherwise leave on the table.
              </p>
              <ul className="space-y-3">
                {[
                  "Automated listing on Digzio's short-term marketplace",
                  "Vetted short-term guests only",
                  "Automated check-in and payment processing",
                  "No additional compliance requirements",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <CheckCircle size={14} style={{ color: "#2ECC71", flexShrink: 0, marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="section-label">Holiday Monetisation</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>
                Your rooms earn money even when students are home.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                Most accommodation providers accept that rooms sit empty during June/July and December holidays. Digzio's holiday rental feature turns that downtime into a significant revenue stream — with zero additional work on your part.
              </p>
              <p className="text-gray-500 leading-relaxed">
                We handle the listing, guest vetting, check-in coordination, and payment processing. You simply unlock your calendar and watch the income arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Pricing</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Transparent pricing. No surprises.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A flat monthly fee — never a percentage of your NSFAS income. Your revenue stays yours.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-8"
                style={{
                  background: plan.highlight ? "linear-gradient(135deg, #0F2D4A, #1A4A6B)" : "white",
                  boxShadow: plan.highlight ? "0 20px 60px rgba(15,45,74,0.3)" : "0 4px 20px rgba(15,45,74,0.07)",
                  transform: plan.highlight ? "scale(1.03)" : "scale(1)",
                }}
              >
                {plan.highlight && (
                  <div className="text-xs font-700 uppercase tracking-widest mb-4 px-3 py-1 rounded-full inline-block" style={{ background: "#1A9BAD", color: "white" }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-700 mb-1" style={{ color: plan.highlight ? "white" : "#0F2D4A", fontWeight: 700 }}>{plan.name}</h3>
                <p className="text-sm mb-6" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9BA3AE" }}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-800" style={{ color: plan.highlight ? "white" : "#0F2D4A", fontWeight: 800 }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9BA3AE" }}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : "#4B5563" }}>
                      <CheckCircle size={14} style={{ color: plan.highlight ? "#2EC4C4" : "#2ECC71", flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact">
                  <button
                    className="w-full py-3 rounded-xl text-sm font-700 transition-all"
                    style={{
                      background: plan.highlight ? "linear-gradient(135deg, #1A9BAD, #2EC4C4)" : "transparent",
                      color: plan.highlight ? "white" : "#0F2D4A",
                      border: plan.highlight ? "none" : "2px solid #0F2D4A",
                      fontWeight: 700,
                    }}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
        <div className="container text-center">
          <h2 className="text-4xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Start earning more from your property.
          </h2>
          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join 156 verified providers already using Digzio to automate payments and grow their income.
          </p>
          <Link href="/list-property">
            <button className="btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
              List Your Property <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
