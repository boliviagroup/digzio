import { Link } from "wouter";
import { Mail, Phone, MapPin, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "#0F2D4A" }} className="text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1A9BAD, #2EC4C4)" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="10" width="18" height="3" rx="0.5" fill="white" />
                  <polygon points="11,2 20,10 2,10" fill="white" />
                  <rect x="5" y="13" width="12" height="7" rx="0.5" fill="white" />
                  <rect x="8" y="16" width="6" height="4" rx="0.5" fill="#0F2D4A" />
                  <line x1="20" y1="10" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
                  <circle cx="20" cy="17" r="1.2" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-light" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Digzio
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              South Africa's first complete student housing ecosystem. Where students belong.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  onClick={() => {}}
                >
                  <Icon size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-700 uppercase tracking-widest mb-5" style={{ color: "#1A9BAD", fontFamily: "'Space Grotesk', sans-serif" }}>
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { label: "For Students", href: "/students" },
                { label: "For Providers", href: "/providers" },
                { label: "For Institutions", href: "/institutions" },
                { label: "How It Works", href: "/how-it-works" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-700 uppercase tracking-widest mb-5" style={{ color: "#1A9BAD", fontFamily: "'Space Grotesk', sans-serif" }}>
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: "About Digzio", href: "/about" },
                { label: "Contact Us", href: "/contact" },
                { label: "Privacy Policy", href: "/contact" },
                { label: "Terms of Service", href: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-700 uppercase tracking-widest mb-5" style={{ color: "#1A9BAD", fontFamily: "'Space Grotesk', sans-serif" }}>
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={15} style={{ color: "#1A9BAD", marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>hello@digzio.co.za</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={15} style={{ color: "#1A9BAD", marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>+27 (0) 10 000 0000</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} style={{ color: "#1A9BAD", marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Johannesburg, South Africa</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}>
            © 2026 Digzio (Pty) Ltd. All rights reserved. Registered in South Africa.
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#2ECC71" }}
            />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Space Grotesk', sans-serif" }}>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
