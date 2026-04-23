import { useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  defaultRole?: "STUDENT" | "PROVIDER" | "INSTITUTION";
}

export default function AuthModal({ open, onClose, defaultTab = "login", defaultRole = "STUDENT" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [role, setRole] = useState<"STUDENT" | "PROVIDER" | "INSTITUTION">(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  if (!open) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email: regEmail,
        password: regPassword,
        first_name: firstName,
        last_name: lastName,
        phone_number: regPhone || undefined,
        role,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 25px 60px rgba(15,45,74,0.25)" }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 100%)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,155,173,0.3)" }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="10" width="18" height="3" rx="0.5" fill="white" />
                <polygon points="11,2 20,10 2,10" fill="white" />
                <rect x="5" y="13" width="12" height="7" rx="0.5" fill="white" />
                <rect x="8" y="16" width="6" height="4" rx="0.5" fill="#1A9BAD" />
              </svg>
            </div>
            <span className="text-white font-600 text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Digzio</span>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }}>
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className="flex-1 py-2 rounded-md text-sm font-600 transition-all"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: tab === t ? "#fff" : "transparent",
                  color: tab === t ? "#0F2D4A" : "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                }}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                  style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                  onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-lg border text-sm outline-none transition-all"
                    style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-600 text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: loading ? "#9CA3AF" : "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign In"}
              </button>
              <p className="text-center text-sm" style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif" }}>
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("register")} style={{ color: "#1A9BAD", fontWeight: 600 }}>
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["STUDENT", "PROVIDER", "INSTITUTION"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="py-2.5 px-3 rounded-lg text-xs font-600 border transition-all"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        borderColor: role === r ? "#1A9BAD" : "#E5E7EB",
                        background: role === r ? "rgba(26,155,173,0.08)" : "#fff",
                        color: role === r ? "#1A9BAD" : "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      {r === "STUDENT" ? "Student" : r === "PROVIDER" ? "Provider" : "Institution"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Siphiwe"
                    className="w-full px-3 py-3 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Mokoena"
                    className="w-full px-3 py-3 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                  onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Phone Number <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+27 82 123 4567"
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                  onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>
              <div>
                <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontFamily: "'Space Grotesk', sans-serif" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 pr-12 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "#E5E7EB", fontFamily: "'Space Grotesk', sans-serif" }}
                    onFocus={(e) => (e.target.style.borderColor = "#1A9BAD")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-600 text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: loading ? "#9CA3AF" : "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : "Create Account"}
              </button>
              <p className="text-center text-sm" style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif" }}>
                Already have an account?{" "}
                <button type="button" onClick={() => setTab("login")} style={{ color: "#1A9BAD", fontWeight: 600 }}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
