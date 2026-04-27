import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty } from "@/lib/api";
import {
  Home, MapPin, Bed, DollarSign, FileText, CheckCircle,
  AlertCircle, Loader2, ArrowRight, Building2, Shield
} from "lucide-react";

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "Free State", "North West", "Northern Cape",
];

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "ROOM", label: "Room / Bedsit" },
  { value: "STUDENT_RESIDENCE", label: "Student Residence" },
];

export default function ListProperty() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    postal_code: "",
    property_type: "",
    total_beds: "",
    available_beds: "",
    base_price_monthly: "",
    is_nsfas_accredited: false,
    lat: "",
    lng: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }
    if (user?.role !== "PROVIDER") {
      setError("Only provider accounts can list properties. Please sign in with a provider account.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createProperty({
        title: form.title,
        description: form.description,
        address_line_1: form.address_line_1,
        address_line_2: form.address_line_2 || undefined,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        property_type: form.property_type,
        total_beds: parseInt(form.total_beds),
        available_beds: form.available_beds ? parseInt(form.available_beds) : parseInt(form.total_beds),
        base_price_monthly: parseFloat(form.base_price_monthly),
        is_nsfas_accredited: form.is_nsfas_accredited,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = {
    border: "1.5px solid #E5E7EB",
    fontFamily: "'Space Grotesk', sans-serif",
    background: "#fff",
  };
  const labelClass = "block text-sm font-600 mb-1.5";
  const labelStyle = { color: "#374151", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 };

  if (success) {
    return (
      <div className="min-h-screen" style={{ background: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full text-center p-10 rounded-2xl" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(15,45,74,0.10)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(26,155,173,0.1)" }}>
              <CheckCircle size={32} style={{ color: "#1A9BAD" }} />
            </div>
            <h2 className="text-2xl font-800 mb-3" style={{ color: "#0F2D4A", fontWeight: 800 }}>Listing Submitted!</h2>
            <p className="mb-6 text-sm" style={{ color: "#6B7280" }}>
              Your property has been submitted as a <strong>Draft</strong>. You can manage it and activate it from your Provider Dashboard.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/dashboard/provider")}
                className="w-full py-3 rounded-xl text-sm font-600 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 600 }}
              >
                <Building2 size={16} /> Go to Provider Dashboard
              </button>
              <button
                onClick={() => { setSuccess(false); setForm({ title: "", description: "", address_line_1: "", address_line_2: "", city: "", province: "", postal_code: "", property_type: "", total_beds: "", available_beds: "", base_price_monthly: "", is_nsfas_accredited: false, lat: "", lng: "" }); }}
                className="w-full py-3 rounded-xl text-sm font-600"
                style={{ border: "1.5px solid #E5E7EB", color: "#374151", fontWeight: 600 }}
              >
                List Another Property
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-10 px-4" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Home size={14} style={{ color: "#1A9BAD" }} />
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>For Providers</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-800 text-white mb-3" style={{ fontWeight: 800 }}>
            List Your Property
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
            Reach thousands of verified students. Your listing goes live after review.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {!isAuthenticated && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-8" style={{ background: "rgba(26,155,173,0.08)", border: "1px solid rgba(26,155,173,0.2)" }}>
            <AlertCircle size={18} style={{ color: "#1A9BAD", marginTop: 2 }} />
            <div>
              <p className="text-sm font-600" style={{ color: "#0F2D4A", fontWeight: 600 }}>Sign in required</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                You need a <strong>Provider account</strong> to list a property.{" "}
                <button onClick={() => setAuthOpen(true)} className="underline" style={{ color: "#1A9BAD" }}>Sign in or register</button>
              </p>
            </div>
          </div>
        )}

        {user && user.role !== "PROVIDER" && (
          <div className="flex items-start gap-3 p-4 rounded-xl mb-8" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={18} style={{ color: "#EF4444", marginTop: 2 }} />
            <p className="text-sm" style={{ color: "#374151" }}>
              Only <strong>Provider accounts</strong> can list properties. You are currently signed in as a <strong>{user.role}</strong>.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <div className="p-6 rounded-2xl" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <FileText size={18} style={{ color: "#1A9BAD" }} />
              <h2 className="text-base font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>Property Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={labelStyle}>Property Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Modern 2-Bedroom Apartment near UCT" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} required rows={4} placeholder="Describe your property — amenities, nearby universities, house rules..." className={inputClass} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>Property Type *</label>
                  <select name="property_type" value={form.property_type} onChange={handleChange} required className={inputClass} style={inputStyle}>
                    <option value="">Select type...</option>
                    {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Monthly Rent (ZAR) *</label>
                  <div className="relative">
                    <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                    <input name="base_price_monthly" value={form.base_price_monthly} onChange={handleChange} required type="number" min="0" placeholder="3500" className={inputClass} style={{ ...inputStyle, paddingLeft: "2.25rem" }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>Total Beds *</label>
                  <div className="relative">
                    <Bed size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                    <input name="total_beds" value={form.total_beds} onChange={handleChange} required type="number" min="1" placeholder="4" className={inputClass} style={{ ...inputStyle, paddingLeft: "2.25rem" }} />
                  </div>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Available Beds</label>
                  <div className="relative">
                    <Bed size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                    <input name="available_beds" value={form.available_beds} onChange={handleChange} type="number" min="0" placeholder="Same as total if all available" className={inputClass} style={{ ...inputStyle, paddingLeft: "2.25rem" }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: "rgba(26,155,173,0.06)", border: "1.5px solid rgba(26,155,173,0.15)" }} onClick={() => setForm((p) => ({ ...p, is_nsfas_accredited: !p.is_nsfas_accredited }))}>
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: form.is_nsfas_accredited ? "#1A9BAD" : "#fff", border: form.is_nsfas_accredited ? "none" : "1.5px solid #D1D5DB" }}>
                  {form.is_nsfas_accredited && <CheckCircle size={14} color="#fff" />}
                </div>
                <div>
                  <p className="text-sm font-600" style={{ color: "#0F2D4A", fontWeight: 600 }}>NSFAS Accredited</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>This property meets DHET/NSFAS accreditation standards</p>
                </div>
                <Shield size={18} style={{ color: "#1A9BAD", marginLeft: "auto" }} />
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="p-6 rounded-2xl" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <MapPin size={18} style={{ color: "#1A9BAD" }} />
              <h2 className="text-base font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>Location</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={labelStyle}>Street Address *</label>
                <input name="address_line_1" value={form.address_line_1} onChange={handleChange} required placeholder="123 Main Street" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Address Line 2</label>
                <input name="address_line_2" value={form.address_line_2} onChange={handleChange} placeholder="Apartment, suite, unit (optional)" className={inputClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>City *</label>
                  <input name="city" value={form.city} onChange={handleChange} required placeholder="Cape Town" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Province *</label>
                  <select name="province" value={form.province} onChange={handleChange} required className={inputClass} style={inputStyle}>
                    <option value="">Select...</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Postal Code *</label>
                  <input name="postal_code" value={form.postal_code} onChange={handleChange} required placeholder="8001" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={labelStyle}>Latitude <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
                  <input name="lat" value={form.lat} onChange={handleChange} type="number" step="any" placeholder="-33.9249" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Longitude <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
                  <input name="lng" value={form.lng} onChange={handleChange} type="number" step="any" placeholder="18.4241" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Latitude and longitude improve search accuracy. You can find them by right-clicking your property on Google Maps.</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={18} style={{ color: "#EF4444", marginTop: 2 }} />
              <p className="text-sm" style={{ color: "#374151" }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-base font-700 flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #0F2D4A, #1A9BAD)",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <>Submit Listing <ArrowRight size={18} /></>}
          </button>
          <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
            Your listing will be saved as a Draft. Activate it from your Provider Dashboard to make it visible to students.
          </p>
        </form>
      </div>

      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab="register" />
    </div>
  );
}
