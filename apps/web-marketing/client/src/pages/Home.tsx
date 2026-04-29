import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  GraduationCap, Building2, University, ArrowRight,
  CheckCircle, Shield, Zap, TrendingUp, Star, ChevronRight,
  AlertTriangle, BarChart3, Users, Home as HomeIcon
} from "lucide-react";

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCounter(value, 2000, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="text-4xl lg:text-5xl font-800 mb-2" style={{ color: "#1A9BAD", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-500 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Grotesk', sans-serif" }}>
        {label}
      </div>
    </div>
  );
}

const audiences = [
  {
    icon: GraduationCap,
    label: "Students",
    headline: "Find verified housing. Get paid on time.",
    body: "Browse NSFAS-accredited properties, apply in minutes, and never worry about payment delays again. Zero application fees.",
    href: "/students",
    color: "#1A9BAD",
    features: ["Zero application fees", "NSFAS-accredited listings", "Instant payment confirmation"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-students-e7LbVBCgXXKPx4F7HrJkAF.webp",
  },
  {
    icon: Building2,
    label: "Providers",
    headline: "Keep 100% of your NSFAS income.",
    body: "Automated NSFAS payments, digital compliance management, and holiday rental monetisation — all in one platform.",
    href: "/providers",
    color: "#0F2D4A",
    features: ["100% NSFAS income retained", "Automated compliance", "Holiday rental revenue"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-providers-aNgufVdn6Zy3zY3aHdw7WU.webp",
  },
  {
    icon: University,
    label: "Institutions",
    headline: "Real-time compliance. Zero admin burden.",
    body: "Live dashboards, automated DHET reporting, and verified provider networks — built for university housing offices.",
    href: "/institutions",
    color: "#2EC4C4",
    features: ["Live compliance dashboards", "DHET-ready reporting", "Verified provider network"],
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-institutions-VGvYQKyfJNE8fdNda6Fgoh.webp",
  },
];

const howSteps = [
  { num: "01", title: "Register & Verify", body: "Students, providers, and institutions create verified accounts in minutes. Our automated KYC checks every party." },
  { num: "02", title: "Match & Apply", body: "Students browse NSFAS-accredited listings near their campus. Apply directly through the platform — no paperwork." },
  { num: "03", title: "Automate Payments", body: "NSFAS disbursements flow directly to providers. No delays, no disputes, 99.8% success rate." },
  { num: "04", title: "Stay Compliant", body: "Real-time compliance monitoring keeps providers accredited and institutions audit-ready — automatically." },
];

const testimonials = [
  {
    quote: "Digzio changed everything. I found a verified room near campus and my NSFAS payment went through on the first day of term.",
    name: "Thandi M.",
    role: "NSFAS Student, University of Johannesburg",
    rating: 5,
  },
  {
    quote: "I used to spend weeks chasing NSFAS payments. Now it's automated. I've also earned extra income letting rooms over the holidays.",
    name: "Sipho K.",
    role: "Accommodation Provider, Pretoria",
    rating: 5,
  },
  {
    quote: "The compliance dashboard alone is worth it. Our housing office went from manual spreadsheets to real-time verified data.",
    name: "Dr. Nomvula D.",
    role: "Student Housing Manager, UNISA",
    rating: 5,
  },
];

export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663470886350/cvNq5xSzzmuMPczzcFbzQY/digzio-hero-XhLHQYPAxUsmfNhs4LiRjK.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,45,74,0.92) 0%, rgba(15,45,74,0.75) 50%, rgba(26,155,173,0.5) 100%)" }} />

        <div className="container relative z-10 pt-24 pb-20">
          <div className="max-w-3xl">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-700 uppercase tracking-widest mb-8"
              style={{
                background: "rgba(26,155,173,0.2)",
                border: "1px solid rgba(26,155,173,0.4)",
                color: "#2EC4C4",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              South Africa's First Complete Student Housing Ecosystem
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-800 text-white leading-tight mb-6"
              style={{
                fontWeight: 800,
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(30px)",
                transition: "all 0.7s ease 0.1s",
              }}
            >
              Where students
              <br />
              <span style={{ color: "#2EC4C4" }}>belong.</span>
            </h1>

            <p
              className="text-base lg:text-xl leading-relaxed mb-8 max-w-xl"
              style={{
                color: "rgba(255,255,255,0.8)",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(30px)",
                transition: "all 0.7s ease 0.2s",
              }}
            >
              Connecting students, accommodation providers, and universities through automated NSFAS payments, compliance verification, and smart housing management.
            </p>

            <div
              className="flex flex-wrap gap-4"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(30px)",
                transition: "all 0.7s ease 0.3s",
              }}
            >
              <Link href="/students">
                <button className="btn-primary">
                  Find Housing <ArrowRight size={16} />
                </button>
              </Link>
              <Link href="/providers">
                <button className="btn-outline-white">
                  List Your Property
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-white text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/40 animate-pulse" />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#0F2D4A" }} className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <StatCard value={2847} suffix="+" label="Students Housed" delay={0} />
            <StatCard value={156} suffix="+" label="Verified Providers" delay={100} />
            <StatCard value={23} suffix="" label="Partner Universities" delay={200} />
            <StatCard value={99} suffix=".8%" label="NSFAS Success Rate" delay={300} />
          </div>
        </div>
      </section>

      {/* ── THREE AUDIENCES ── */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Who We Serve</span>
            <h2 className="text-4xl lg:text-5xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              One platform. Three audiences.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Digzio is the only platform that connects all three sides of the student housing market in a single, automated ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {audiences.map((aud) => (
              <div
                key={aud.label}
                className="bg-white rounded-2xl overflow-hidden card-hover"
                style={{ boxShadow: "0 4px 24px rgba(15,45,74,0.08)" }}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img src={aud.image} alt={aud.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,45,74,0.7) 0%, transparent 60%)" }} />
                  <div
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-wider text-white"
                    style={{ background: aud.color }}
                  >
                    <aud.icon size={13} />
                    {aud.label}
                  </div>
                </div>

                <div className="p-7">
                  <h3 className="text-xl font-800 text-gray-900 mb-3" style={{ fontWeight: 800 }}>{aud.headline}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{aud.body}</p>

                  <ul className="space-y-2 mb-6">
                    {aud.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} style={{ color: "#2ECC71", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={aud.href}>
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-700 text-white transition-all hover:opacity-90"
                      style={{ background: aud.color, fontWeight: 700 }}
                    >
                      Learn More <ChevronRight size={15} />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">How It Works</span>
              <h2 className="text-4xl lg:text-5xl font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>
                The complete student housing lifecycle, automated.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                From property discovery to NSFAS payment disbursement, Digzio handles every step of the student housing journey — eliminating manual processes and payment delays for all three parties.
              </p>
              <Link href="/how-it-works">
                <button className="btn-primary">
                  See How It Works <ArrowRight size={16} />
                </button>
              </Link>
            </div>

            <div className="space-y-0">
              {howSteps.map((step, i) => (
                <div
                  key={step.num}
                  className="flex gap-6 py-6"
                  style={{ borderBottom: i < howSteps.length - 1 ? "1px solid #E8ECEF" : "none" }}
                >
                  <div
                    className="text-3xl font-800 flex-shrink-0 w-12"
                    style={{ color: "#E8ECEF", fontWeight: 800, lineHeight: 1 }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-700 text-gray-900 mb-1" style={{ fontWeight: 700 }}>{step.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY DIGZIO ── */}
      <section className="py-24" style={{ background: "#0F2D4A" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Why Digzio</span>
            <h2 className="text-4xl lg:text-5xl font-800 text-white mb-4" style={{ fontWeight: 800 }}>
              Built for South Africa's reality.
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
              We didn't build a generic housing platform and adapt it. Digzio was designed from the ground up for the NSFAS ecosystem, South African compliance requirements, and the real challenges students face.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "NSFAS Automation", body: "Direct integration with NSFAS payment systems. 99.8% disbursement success rate. Providers receive funds on time, every time.", color: "#1A9BAD" },
              { icon: CheckCircle, title: "Compliance Verification", body: "Every property is verified against DHET accreditation standards before listing. Students only see compliant, safe accommodation.", color: "#2ECC71" },
              { icon: Zap, title: "Zero Application Fees", body: "Students pay nothing to apply. No hidden charges, no admin fees. The platform is free for the people who need it most.", color: "#2EC4C4" },
              { icon: TrendingUp, title: "Holiday Monetisation", body: "Providers earn extra income by listing vacant rooms as short-term rentals during university holidays. Average R18,400 additional revenue.", color: "#F5A623" },
              { icon: Building2, title: "Digital Compliance", body: "Automated compliance monitoring replaces manual paperwork. Providers stay accredited without the admin burden.", color: "#1A9BAD" },
              { icon: University, title: "Institutional Reporting", body: "Real-time dashboards and automated DHET reporting give university housing offices complete visibility and audit readiness.", color: "#2EC4C4" },
            ].map((feat) => (
              <div
                key={feat.title}
                className="p-7 rounded-2xl card-hover"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${feat.color}20` }}
                >
                  <feat.icon size={20} style={{ color: feat.color }} />
                </div>
                <h3 className="font-700 text-white mb-2" style={{ fontWeight: 700 }}>{feat.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET INSIGHTS ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Market Insights</span>
            <h2 className="text-4xl lg:text-5xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              The opportunity is undeniable.
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              South Africa's student housing crisis is structural — and Digzio is built to solve it.
              The data below is sourced from IFC/World Bank, DHET, and NSFAS (2025).
            </p>
          </div>

          {/* ── 4 Key Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Users, value: "2.4M", trend: "+4.2% YoY", label: "Tertiary Students", sub: "Universities + TVET + Private HEIs", color: "#1A9BAD" },
              { icon: HomeIcon, value: "212K", trend: "+3.1% YoY", label: "Beds Available", sub: "PBSA + on-campus combined", color: "#0F2D4A" },
              { icon: AlertTriangle, value: "500K+", trend: "Growing annually", label: "Bed Shortage", sub: "Projected 781K by 2025", color: "#E74C3C" },
              { icon: BarChart3, value: "R4.27bn", trend: "2025/2026", label: "NSFAS Disbursement", sub: "Annual allocation to students", color: "#2EC4C4" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl"
                style={{ background: "#F5F7FA", border: "1px solid #E8ECEF" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${stat.color}18` }}
                  >
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs font-600 px-2 py-1 rounded-full" style={{ background: `${stat.color}15`, color: stat.color, fontWeight: 600 }}>
                    {stat.trend}
                  </span>
                </div>
                <div className="text-3xl font-800 mb-1" style={{ color: "#0F2D4A", fontWeight: 800 }}>{stat.value}</div>
                <div className="font-700 text-gray-800 text-sm mb-1" style={{ fontWeight: 700 }}>{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Crisis Banner + Key Indicators ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Crisis Banner */}
            <div
              className="p-8 rounded-2xl flex flex-col justify-between"
              style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 100%)", minHeight: "280px" }}
            >
              <div>
                <span
                  className="inline-block text-xs font-700 uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{ background: "rgba(231,76,60,0.2)", color: "#E74C3C", fontWeight: 700 }}
                >
                  National Housing Crisis
                </span>
                <h3 className="text-3xl font-800 text-white mb-3" style={{ fontWeight: 800 }}>500,000+ Bed Deficit</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Only 250,000 beds exist for 2.8 million tertiary students. South Africa's on-campus
                  coverage rate is just 20% — against a global average of 50%. The gap will reach
                  781,000 beds by 2025 as enrolments grow toward the NDP target of 1.6 million by 2030.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[
                  { label: "Beds Available", val: "250K", color: "#2EC4C4" },
                  { label: "Beds Needed", val: "750K+", color: "#E74C3C" },
                  { label: "Coverage Rate", val: "20%", color: "#F5A623" },
                  { label: "Global Average", val: "50%", color: "#2ECC71" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                    <span className="text-sm font-700" style={{ color: item.color, fontWeight: 700 }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Market Indicators */}
            <div
              className="p-8 rounded-2xl"
              style={{ background: "#F5F7FA", border: "1px solid #E8ECEF" }}
            >
              <h3 className="font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>Key Market Indicators</h3>
              <div className="space-y-4">
                {[
                  { label: "On-campus coverage", sub: "Global avg: 50%", val: "20%", color: "#E74C3C" },
                  { label: "NSFAS-funded students", sub: "811K students (2025)", val: "42%", color: "#1A9BAD" },
                  { label: "PBSA investment yield", sub: "Gross annual return", val: "15–20%", color: "#2ECC71" },
                  { label: "NSFAS metro cap", sub: "R4,333/month max", val: "R52K/yr", color: "#0F2D4A" },
                  { label: "Female students", sub: "Safety is top priority", val: "54.7%", color: "#2EC4C4" },
                  { label: "Formal PBSA operators", sub: "Top 10 hold 51,844 beds", val: "42", color: "#F5A623" },
                ].map((ind) => (
                  <div key={ind.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #E8ECEF" }}>
                    <div>
                      <div className="text-sm font-600 text-gray-800" style={{ fontWeight: 600 }}>{ind.label}</div>
                      <div className="text-xs text-gray-400">{ind.sub}</div>
                    </div>
                    <span className="text-base font-800" style={{ color: ind.color, fontWeight: 800 }}>{ind.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Strategic Insight ── */}
          <div
            className="p-8 rounded-2xl flex gap-5 items-start"
            style={{ background: "linear-gradient(135deg, rgba(26,155,173,0.08) 0%, rgba(46,196,196,0.08) 100%)", border: "1px solid rgba(26,155,173,0.2)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: "rgba(26,155,173,0.15)" }}
            >
              <TrendingUp size={18} style={{ color: "#1A9BAD" }} />
            </div>
            <div>
              <div className="font-800 text-gray-900 mb-2" style={{ fontWeight: 800 }}>Strategic Insight: The Market Is Structurally Broken</div>
              <p className="text-sm text-gray-600 leading-relaxed">
                South Africa's student housing crisis is not cyclical — it is structural. With 500,000+ beds missing,
                only 20% on-campus coverage, and enrollment growing toward 1.6 million by 2030, the gap will widen
                without deliberate intervention. No single platform currently aggregates supply, integrates NSFAS, or
                provides quality transparency. <strong style={{ color: "#0F2D4A" }}>This is Digzio's core market opportunity.</strong>
              </p>
              <p className="text-xs text-gray-400 mt-3">Data: IFC / World Bank (2021), DHET (2023), NSFAS (2025)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Testimonials</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              Trusted by students, providers, and universities.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl"
                style={{ boxShadow: "0 4px 24px rgba(15,45,74,0.07)" }}
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#F5A623" style={{ color: "#F5A623" }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-700"
                    style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", fontWeight: 700 }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-700 text-gray-900 text-sm" style={{ fontWeight: 700 }}>{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 50%, #1A9BAD 100%)" }}
      >
        <div className="container text-center">
          <h2 className="text-4xl lg:text-5xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Ready to find your place?
          </h2>
          <p className="text-xl mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join 2,847 students, 156 providers, and 23 universities already on Digzio.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/students">
              <button className="btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
                I'm a Student <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/providers">
              <button className="btn-outline-white" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
                I'm a Provider
              </button>
            </Link>
            <Link href="/institutions">
              <button className="btn-outline-white" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
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
