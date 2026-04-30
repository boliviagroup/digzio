import { useState, useEffect } from "react";
import { Shield, X, ChevronDown, ChevronUp } from "lucide-react";

const COOKIE_KEY = "digzio_cookie_consent";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored) {
      // Slight delay so page loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (analyticsVal: boolean, marketingVal: boolean) => {
    const consent: ConsentState = {
      necessary: true,
      analytics: analyticsVal,
      marketing: marketingVal,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const acceptAll = () => save(true, true);
  const rejectAll = () => save(false, false);
  const saveCustom = () => save(analytics, marketing);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0B1E2D 0%, #0D2535 100%)",
        borderTop: "1px solid rgba(26,155,173,0.35)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.45)",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
          <div
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(26,155,173,0.15)",
              border: "1px solid rgba(26,155,173,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={18} color="#1A9BAD" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.01em" }}>
                Your Privacy &amp; Cookie Preferences
              </h2>
              <button
                onClick={rejectAll}
                aria-label="Close and reject non-essential cookies"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.4)", lineHeight: 1 }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
              Digzio uses cookies in accordance with the{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>Protection of Personal Information Act (POPIA)</strong>{" "}
              and the{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>Electronic Communications and Transactions Act (ECTA)</strong>.
              We only collect data you consent to. Necessary cookies are required for the platform to function.
            </p>
          </div>
        </div>

        {/* Expandable cookie details */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#1A9BAD",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 0",
            marginBottom: expanded ? 12 : 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide cookie details" : "Manage cookie preferences"}
        </button>

        {expanded && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {/* Necessary */}
            <div style={categoryStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={categoryTitle}>Necessary</span>
                <span style={alwaysOnBadge}>Always on</span>
              </div>
              <p style={categoryDesc}>
                Session management, authentication, and security. Required for the platform to operate. Cannot be disabled.
              </p>
            </div>

            {/* Analytics */}
            <div style={categoryStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={categoryTitle}>Analytics</span>
                <Toggle value={analytics} onChange={setAnalytics} />
              </div>
              <p style={categoryDesc}>
                Anonymised usage data (page views, search queries) to improve platform performance. No personal identifiers stored.
              </p>
            </div>

            {/* Marketing */}
            <div style={categoryStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={categoryTitle}>Marketing</span>
                <Toggle value={marketing} onChange={setMarketing} />
              </div>
              <p style={categoryDesc}>
                Personalised housing recommendations and relevant communications. You can withdraw consent at any time.
              </p>
            </div>
          </div>
        )}

        {/* Action row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginTop: expanded ? 0 : 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", flex: "1 1 200px" }}>
            You may withdraw or change consent at any time via our{" "}
            <a href="/contact" style={{ color: "#1A9BAD", textDecoration: "underline" }}>
              Privacy Policy
            </a>
            . Data is processed by Digzio (Pty) Ltd, Johannesburg, South Africa.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {expanded && (
              <button onClick={saveCustom} style={btnSecondary}>
                Save preferences
              </button>
            )}
            <button onClick={rejectAll} style={btnSecondary}>
              Reject non-essential
            </button>
            <button onClick={acceptAll} style={btnPrimary}>
              Accept all cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small toggle switch ──────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        position: "relative",
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        background: value ? "#1A9BAD" : "rgba(255,255,255,0.15)",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: value ? 19 : 3,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#ffffff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ── Style constants ──────────────────────────────────────────────────────────
const categoryStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "12px 14px",
};

const categoryTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#ffffff",
};

const categoryDesc: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "rgba(255,255,255,0.55)",
  lineHeight: 1.5,
};

const alwaysOnBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#2ECC71",
  background: "rgba(46,204,113,0.12)",
  border: "1px solid rgba(46,204,113,0.25)",
  borderRadius: 20,
  padding: "2px 8px",
};

const btnPrimary: React.CSSProperties = {
  background: "#1A9BAD",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif",
  whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.8)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif",
  whiteSpace: "nowrap",
};
