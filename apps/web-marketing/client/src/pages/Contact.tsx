import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, GraduationCap, Building2, University, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const contactChannels = [
  {
    icon: GraduationCap,
    label: "Students",
    email: "students@digzio.co.za",
    desc: "Housing applications, NSFAS payment queries, and general student support.",
    color: "#1A9BAD",
  },
  {
    icon: Building2,
    label: "Providers",
    email: "providers@digzio.co.za",
    desc: "Onboarding, compliance questions, payment issues, and partnership enquiries.",
    color: "#0F2D4A",
  },
  {
    icon: University,
    label: "Institutions",
    email: "institutions@digzio.co.za",
    desc: "Demo requests, integration support, and institutional partnership discussions.",
    color: "#2EC4C4",
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", audience: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitted(true);
    toast.success("Message sent! We'll be in touch within 1 business day.");
  };

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
            Contact Us
          </span>
          <h1 className="text-5xl lg:text-6xl font-800 text-white mb-6" style={{ fontWeight: 800 }}>
            We're here to help.
          </h1>
          <p className="text-xl max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.75)" }}>
            Whether you're a student, provider, or institution — our team responds within 1 business day.
          </p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="py-24" style={{ background: "#F5F7FA" }}>
        <div className="container">
          <div className="text-center mb-16">
            <span className="section-label">Dedicated Support</span>
            <h2 className="text-4xl font-800 text-gray-900 mb-4" style={{ fontWeight: 800 }}>
              The right team for your query.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {contactChannels.map((ch) => (
              <div key={ch.label} className="bg-white p-8 rounded-2xl" style={{ boxShadow: "0 4px 20px rgba(15,45,74,0.07)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${ch.color}15` }}>
                  <ch.icon size={22} style={{ color: ch.color }} />
                </div>
                <h3 className="font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>{ch.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{ch.desc}</p>
                <a
                  href={`mailto:${ch.email}`}
                  className="text-sm font-700 flex items-center gap-2"
                  style={{ color: ch.color, fontWeight: 700 }}
                >
                  <Mail size={14} />
                  {ch.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form + info */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <span className="section-label">Send a Message</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-8" style={{ fontWeight: 800 }}>
                Get in touch.
              </h2>

              {submitted ? (
                <div className="p-10 rounded-2xl text-center" style={{ background: "#F5F7FA" }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(46,204,113,0.1)" }}>
                    <CheckCircle size={32} style={{ color: "#2ECC71" }} />
                  </div>
                  <h3 className="text-xl font-700 text-gray-900 mb-2" style={{ fontWeight: 700 }}>Message received!</h3>
                  <p className="text-gray-500">We'll respond within 1 business day. Check your email for a confirmation.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-700 text-gray-700 mb-2" style={{ fontWeight: 700 }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all"
                        style={{ background: "#F5F7FA", border: "1.5px solid #E8ECEF" }}
                        onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                        onBlur={(e) => (e.target.style.borderColor = "#E8ECEF")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-700 text-gray-700 mb-2" style={{ fontWeight: 700 }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all"
                        style={{ background: "#F5F7FA", border: "1.5px solid #E8ECEF" }}
                        onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                        onBlur={(e) => (e.target.style.borderColor = "#E8ECEF")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-700 text-gray-700 mb-2" style={{ fontWeight: 700 }}>
                      I am a...
                    </label>
                    <select
                      value={form.audience}
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all"
                      style={{ background: "#F5F7FA", border: "1.5px solid #E8ECEF" }}
                    >
                      <option value="">Select your role</option>
                      <option value="student">Student</option>
                      <option value="provider">Accommodation Provider</option>
                      <option value="institution">University / Institution</option>
                      <option value="investor">Investor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-700 text-gray-700 mb-2" style={{ fontWeight: 700 }}>
                      Message *
                    </label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help you?"
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none transition-all resize-none"
                      style={{ background: "#F5F7FA", border: "1.5px solid #E8ECEF" }}
                      onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                      onBlur={(e) => (e.target.style.borderColor = "#E8ECEF")}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center" style={{ padding: "0.875rem" }}>
                    Send Message <Send size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <div>
              <span className="section-label">Contact Information</span>
              <h2 className="text-4xl font-800 text-gray-900 mb-8" style={{ fontWeight: 800 }}>
                Find us.
              </h2>

              <div className="space-y-6 mb-10">
                {[
                  { icon: Mail, label: "General Enquiries", value: "hello@digzio.co.za" },
                  { icon: Phone, label: "Phone", value: "+27 (0) 10 000 0000" },
                  { icon: MapPin, label: "Address", value: "Johannesburg, Gauteng, South Africa" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,155,173,0.1)" }}>
                      <item.icon size={18} style={{ color: "#1A9BAD" }} />
                    </div>
                    <div>
                      <div className="text-xs font-700 uppercase tracking-wider text-gray-400 mb-1">{item.label}</div>
                      <div className="text-gray-900 font-500">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
                <h3 className="font-700 text-white mb-3" style={{ fontWeight: 700 }}>Response Times</h3>
                <div className="space-y-3">
                  {[
                    { type: "Student Support", time: "Within 4 hours" },
                    { type: "Provider Onboarding", time: "Within 1 business day" },
                    { type: "Institutional Demos", time: "Within 2 business days" },
                    { type: "Press & Media", time: "Within 1 business day" },
                  ].map((r) => (
                    <div key={r.type} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{r.type}</span>
                      <span className="text-sm font-700" style={{ color: "#2EC4C4", fontWeight: 700 }}>{r.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
