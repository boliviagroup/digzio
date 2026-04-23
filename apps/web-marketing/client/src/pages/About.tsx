import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Target, Eye, Heart } from "lucide-react";

const values = [
  { icon: Target, title: "Student-First", body: "Every product decision starts with one question: does this make life better for a South African student? If not, we don't build it." },
  { icon: Eye, title: "Radical Transparency", body: "We publish our NSFAS success rates, compliance scores, and platform uptime publicly. Accountability is not optional." },
  { icon: Heart, title: "Systemic Impact", body: "We're not solving a convenience problem. We're addressing a structural failure in South Africa's student housing system. That demands urgency." },
];

const milestones = [
  { year: "2023", title: "Founded", desc: "Digzio founded in Johannesburg after the founding team experienced the student housing crisis firsthand." },
  { year: "2023", title: "First Pilot", desc: "Launched a 50-student pilot with 3 providers at the University of Johannesburg. 100% NSFAS payment success rate." },
  { year: "2024", title: "Series A", desc: "Raised seed funding. Expanded to 5 universities and 40 verified providers across Gauteng." },
  { year: "2025", title: "National Expansion", desc: "Reached 23 partner universities, 156 verified providers, and 2,847 students housed. Launched holiday rental feature." },
  { year: "2026", title: "R2.1M Revenue", desc: "Crossed R2.1M in platform revenue. Preparing for Series A to fund national scale and TVET college expansion." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative pt-32 pb-24"
        style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}
      >
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6" style={{ background: "rgba(46,196,196,0.15)", border: "1px solid rgba(46,196,196,0.3)", color: "#2EC4C4" }}>
              About Digzio
            </span>
            <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6 leading-tight" style={{ fontWeight: 800 }}>
              We're solving South Africa's<br />
              <span style={{ color: "#2EC4C4" }}>student housing crisis.</span>
            </h1>
            <p className="text-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
              Every year, hundreds of thousands of South African students struggle to find safe, affordable, NSFAS-funded accommodation. Digzio exists to change that — permanently.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="section-label">Our Mission</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-6" style={{ fontWeight: 800 }}>
                Every student deserves a safe place to learn.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-6">
                South Africa has over 1 million university students, more than 400,000 of whom receive NSFAS funding. Yet the student housing system is broken: accreditation is manual and inconsistent, NSFAS payments are delayed, and students are forced into unsafe, unverified accommodation.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Digzio is the infrastructure layer that the student housing ecosystem has always needed. By automating NSFAS payments, digitising compliance, and connecting all three parties in a single platform, we eliminate the systemic failures that have plagued student housing for decades.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "2,847+", label: "Students Housed" },
                  { value: "R2.1M", label: "Platform Revenue" },
                  { value: "23", label: "Partner Universities" },
                  { value: "99.8%", label: "Payment Success" },
                ].map((s) => (
                  <div key={s.label} className="p-5 rounded-xl" style={{ background: "#F5F7FA" }}>
                    <div className="text-3xl font-800 mb-1" style={{ color: "#1A9BAD", fontWeight: 800 }}>{s.value}</div>
                    <div className="text-xs uppercase tracking-wider text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 rounded-2xl" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
              <h3 className="text-2xl font-700 text-white mb-6" style={{ fontWeight: 700 }}>Our Vision</h3>
              <p className="leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
                A South Africa where no student's academic journey is derailed by a housing crisis. Where every NSFAS-funded student lives in verified, safe accommodation. Where providers are paid on time and institutions are always compliant.
              </p>
              <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
                By 2030, we aim to be the infrastructure layer for every student housing transaction in South Africa — serving 500,000 students, 5,000 providers, and every accredited university and TVET college in the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Our Values</span>
            <h2 className="text-4xl font-800 text-gray-900" style={{ fontWeight: 800 }}>
              What we stand for.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="bg-white p-8 rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(26,155,173,0.1)" }}>
                  <v.icon size={22} style={{ color: "#1A9BAD" }} />
                </div>
                <h3 className="text-xl font-700 text-gray-900 mb-3" style={{ fontWeight: 700 }}>{v.title}</h3>
                <p className="text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white">
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
            <span className="section-label">Our Journey</span>
            <h2 className="text-4xl font-800 text-gray-900" style={{ fontWeight: 800 }}>
              From pilot to platform.
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px" style={{ background: "#E8ECEF" }} />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-8 relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-xs font-700"
                    style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "white", fontWeight: 700 }}
                  >
                    {m.year.slice(2)}
                  </div>
                  <div className="pb-2">
                    <div className="text-xs font-700 uppercase tracking-wider mb-1" style={{ color: "#1A9BAD" }}>{m.year}</div>
                    <h3 className="font-700 text-gray-900 mb-1" style={{ fontWeight: 700 }}>{m.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
        <div className="container text-center">
          <h2 className="text-4xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            Join the mission.
          </h2>
          <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
            Whether you're a student, provider, or institution — there's a place for you in the Digzio ecosystem.
          </p>
          <Link href="/contact">
            <button className="btn-primary" style={{ padding: "0.875rem 2.5rem", fontSize: "1rem" }}>
              Get in Touch <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
