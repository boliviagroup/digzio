import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken, submitKyc } from "@/lib/api";
import {
  Home, Clock, CheckCircle, XCircle, FileText, MapPin,
  DollarSign, Calendar, ArrowRight, Loader2, AlertCircle,
  RefreshCw, Search, BadgeCheck, User, X, ShieldCheck,
  AlertTriangle, Plus, ChevronRight
} from "lucide-react";

interface Application {
  application_id: string;
  property_id: string;
  property_title: string;
  city: string;
  province: string;
  base_price_monthly: number;
  address_line_1: string;
  status: string;
  applied_at: string;
  updated_at: string;
  provider_notes?: string;
}

interface Incident {
  incident_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address_text?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  SUBMITTED:      { label: "Submitted",       color: "#1A9BAD", bg: "rgba(26,155,173,0.1)",   icon: Clock },
  PENDING_NSFAS:  { label: "Pending NSFAS",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   icon: Clock },
  APPROVED:       { label: "Approved",         color: "#10B981", bg: "rgba(16,185,129,0.1)",   icon: CheckCircle },
  REJECTED:       { label: "Rejected",         color: "#EF4444", bg: "rgba(239,68,68,0.1)",    icon: XCircle },
  LEASE_SIGNED:   { label: "Lease Signed",     color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   icon: FileText },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  medium:   { label: "Medium",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  high:     { label: "High",     color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  critical: { label: "Critical", color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
};

const INCIDENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Open",        color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  in_progress: { label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  resolved:    { label: "Resolved",    color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  closed:      { label: "Closed",      color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700"
      style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}
    >
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

// ── KYC Modal ────────────────────────────────────────────────────────────────
function KycModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    id_number: "",
    id_type: "SA_ID",
    date_of_birth: "",
    institution_name: "",
    student_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id_number || !form.date_of_birth) {
      setError("ID number and date of birth are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitKyc(form);
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "KYC submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
            <BadgeCheck size={20} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <h3 className="font-700 text-gray-900" style={{ fontWeight: 700 }}>KYC Verification</h3>
            <p className="text-xs text-gray-400">Verify your student identity</p>
          </div>
        </div>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#10B981" }} />
            <p className="font-700 text-gray-800" style={{ fontWeight: 700 }}>Submitted successfully!</p>
            <p className="text-sm text-gray-500 mt-1">Your KYC is under review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.06)", color: "#EF4444" }}>
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>ID Type</label>
              <select
                value={form.id_type}
                onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-teal-400"
              >
                <option value="SA_ID">South African ID</option>
                <option value="PASSPORT">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>ID Number *</label>
              <input
                type="text"
                value={form.id_number}
                onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))}
                placeholder="Enter your ID number"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Date of Birth *</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Institution Name</label>
              <input
                type="text"
                value={form.institution_name}
                onChange={e => setForm(f => ({ ...f, institution_name: e.target.value }))}
                placeholder="e.g. University of Pretoria"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Student Number</label>
              <input
                type="text"
                value={form.student_number}
                onChange={e => setForm(f => ({ ...f, student_number: e.target.value }))}
                placeholder="Your student number"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-teal-400"
              />
            </div>
            <p className="text-xs text-gray-400">
              Your information is encrypted and used only for identity verification. We do not share your data with third parties.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-600 border transition-colors"
                style={{ border: "1px solid #E5E7EB", color: "#6B7280", fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-700 flex items-center justify-center gap-2 transition-all"
                style={{ background: submitting ? "#D1D5DB" : "#F59E0B", color: "white", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit KYC"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Report Incident Modal ────────────────────────────────────────────────────
function ReportIncidentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "safety",
    severity: "medium",
    address_text: "",
    latitude: "",
    longitude: "",
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function getLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Please enter coordinates manually or allow location access.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.description || !form.latitude || !form.longitude) {
      setError("Title, description, and location are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit incident");
      }
      setDone(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg max-h-screen overflow-y-auto" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)", borderRadius: "1.25rem 1.25rem 0 0" }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#EF4444" }} />
              </div>
              <div>
                <h3 className="font-700 text-gray-900" style={{ fontWeight: 700 }}>Report an Incident</h3>
                <p className="text-xs text-gray-400">Help keep your community safe</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          {done ? (
            <div className="text-center py-8">
              <CheckCircle size={44} className="mx-auto mb-3" style={{ color: "#10B981" }} />
              <p className="font-700 text-gray-800 text-lg" style={{ fontWeight: 700 }}>Incident Reported!</p>
              <p className="text-sm text-gray-500 mt-1">Your report has been submitted and the admin team has been alerted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.06)", color: "#EF4444" }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Incident Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief title of the incident"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-red-400"
                  >
                    <option value="safety">Safety</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="noise">Noise</option>
                    <option value="theft">Theft</option>
                    <option value="harassment">Harassment</option>
                    <option value="fire">Fire</option>
                    <option value="flooding">Flooding</option>
                    <option value="power">Power Outage</option>
                    <option value="water">Water Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Severity *</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-red-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what happened in detail..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-red-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-600 text-gray-600 mb-1.5" style={{ fontWeight: 600 }}>Location *</label>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating}
                  className="w-full py-2.5 rounded-xl text-sm font-600 flex items-center justify-center gap-2 mb-2 transition-all"
                  style={{ background: form.latitude ? "rgba(16,185,129,0.08)" : "rgba(26,155,173,0.08)", color: form.latitude ? "#10B981" : "#1A9BAD", border: `1px solid ${form.latitude ? "rgba(16,185,129,0.2)" : "rgba(26,155,173,0.2)"}`, fontWeight: 600 }}
                >
                  {locating ? <><Loader2 size={14} className="animate-spin" /> Locating…</> : form.latitude ? <><CheckCircle size={14} /> Location captured ({parseFloat(form.latitude).toFixed(3)}, {parseFloat(form.longitude).toFixed(3)})</> : <><MapPin size={14} /> Use My Current Location</>}
                </button>
                <input
                  type="text"
                  value={form.address_text}
                  onChange={e => setForm(f => ({ ...f, address_text: e.target.value }))}
                  placeholder="Address or landmark (optional)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-red-400"
                />
                {!form.latitude && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                      placeholder="Latitude (e.g. -25.7461)"
                      className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-red-400"
                    />
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                      placeholder="Longitude (e.g. 28.1881)"
                      className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-red-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-600 border transition-colors"
                  style={{ border: "1px solid #E5E7EB", color: "#6B7280", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-700 flex items-center justify-center gap-2 transition-all"
                  style={{ background: submitting ? "#D1D5DB" : "#EF4444", color: "white", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><AlertTriangle size={14} /> Submit Report</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"applications" | "incidents">("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycOpen, setKycOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    fetchApplications();
    fetchKycStatus();
    fetchIncidents();
  }, [isAuthenticated]);

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/v1/applications/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function fetchKycStatus() {
    try {
      const token = getStoredToken();
      const res = await fetch("/api/v1/kyc/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKycStatus(data.kyc_status || null);
      }
    } catch {
      // non-critical
    }
  }

  async function fetchIncidents() {
    setIncidentsLoading(true);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/v1/incidents?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch {
      // non-critical
    } finally {
      setIncidentsLoading(false);
    }
  }

  function handleKycSuccess() {
    setKycStatus("PENDING");
  }

  function handleIncidentSuccess() {
    fetchIncidents();
  }

  const effectiveKycStatus = kycStatus || user?.kyc_status || "NOT_STARTED";
  const kycVerified = effectiveKycStatus === "VERIFIED" || effectiveKycStatus === "APPROVED";
  const kycPending = effectiveKycStatus === "PENDING";

  const stats = {
    total: applications.length,
    approved: applications.filter((a) => a.status === "APPROVED" || a.status === "LEASE_SIGNED").length,
    pending: applications.filter((a) => a.status === "SUBMITTED" || a.status === "PENDING_NSFAS").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* KYC Modal */}
      {kycOpen && (
        <KycModal
          onClose={() => setKycOpen(false)}
          onSuccess={handleKycSuccess}
        />
      )}

      {/* Report Incident Modal */}
      {reportOpen && (
        <ReportIncidentModal
          onClose={() => setReportOpen(false)}
          onSuccess={handleIncidentSuccess}
        />
      )}

      {/* Header */}
      <div className="pt-24 pb-8" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(26,155,173,0.2)" }}>
                  <User size={20} style={{ color: "#1A9BAD" }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Welcome back</p>
                  <h1 className="text-2xl font-800 text-white" style={{ fontWeight: 800 }}>
                    {user?.first_name} {user?.last_name}
                  </h1>
                </div>
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Student Dashboard — track your accommodation and report incidents
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
                style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 600 }}
              >
                <AlertTriangle size={14} /> Report Incident
              </button>
              <button
                onClick={fetchApplications}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <Link href="/search">
                <button className="btn-primary flex items-center gap-2 text-sm" style={{ padding: "0.5rem 1.25rem" }}>
                  <Search size={14} /> Find Properties
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applications", value: stats.total, color: "#1A9BAD", icon: FileText },
            { label: "Approved / Signed", value: stats.approved, color: "#10B981", icon: CheckCircle },
            { label: "Pending Review",    value: stats.pending,  color: "#F59E0B", icon: Clock },
            { label: "Incidents Reported", value: incidents.length, color: "#EF4444", icon: AlertTriangle },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400 font-600" style={{ fontWeight: 600 }}>{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-3xl font-800" style={{ color: s.color, fontWeight: 800 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* KYC Banner */}
        {!kycVerified && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-4 flex-wrap" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <BadgeCheck size={20} style={{ color: "#F59E0B" }} />
            <div className="flex-1">
              {kycPending ? (
                <>
                  <p className="text-sm font-700" style={{ color: "#92400E", fontWeight: 700 }}>KYC verification under review</p>
                  <p className="text-xs" style={{ color: "#B45309" }}>Your documents have been submitted and are being reviewed.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-700" style={{ color: "#92400E", fontWeight: 700 }}>Complete your KYC verification</p>
                  <p className="text-xs" style={{ color: "#B45309" }}>Providers require KYC verification before approving applications.</p>
                </>
              )}
            </div>
            {!kycPending && (
              <button
                onClick={() => setKycOpen(true)}
                className="text-xs px-4 py-2 rounded-lg font-700 flex items-center gap-1.5"
                style={{ background: "#F59E0B", color: "white", fontWeight: 700 }}
              >
                Verify Now <ArrowRight size={12} />
              </button>
            )}
            {kycPending && (
              <span className="text-xs px-3 py-1.5 rounded-lg font-600" style={{ background: "rgba(245,158,11,0.15)", color: "#92400E", fontWeight: 600 }}>
                Under Review
              </span>
            )}
          </div>
        )}

        {/* KYC Verified Banner */}
        {kycVerified && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <ShieldCheck size={20} style={{ color: "#10B981" }} />
            <div>
              <p className="text-sm font-700" style={{ color: "#065F46", fontWeight: 700 }}>KYC Verified</p>
              <p className="text-xs" style={{ color: "#047857" }}>Your identity has been verified.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "rgba(15,45,74,0.06)" }}>
          {[
            { id: "applications", label: "My Applications", icon: FileText },
            { id: "incidents", label: "My Incidents", icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
              style={{
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#0F2D4A" : "#6B7280",
                fontWeight: 600,
                boxShadow: activeTab === tab.id ? "0 1px 4px rgba(15,45,74,0.1)" : "none",
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-700" style={{ fontWeight: 700, color: "#0F2D4A" }}>My Applications</h2>
              <span className="text-sm text-gray-400">{applications.length} total</span>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin" style={{ color: "#1A9BAD" }} />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 p-6 m-6 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertCircle size={18} style={{ color: "#EF4444" }} />
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={fetchApplications} className="ml-auto text-xs px-3 py-1.5 rounded-lg" style={{ background: "#EF4444", color: "white" }}>Retry</button>
              </div>
            )}

            {!loading && !error && applications.length === 0 && (
              <div className="text-center py-16">
                <Home size={40} className="mx-auto mb-4" style={{ color: "#D1D5DB" }} />
                <p className="text-gray-500 font-600" style={{ fontWeight: 600 }}>No applications yet</p>
                <p className="text-sm text-gray-400 mb-6">Start browsing verified properties near your campus.</p>
                <Link href="/search">
                  <button className="btn-primary text-sm" style={{ padding: "0.625rem 1.5rem" }}>
                    Browse Properties <ArrowRight size={14} className="inline ml-1" />
                  </button>
                </Link>
              </div>
            )}

            {!loading && !error && applications.length > 0 && (
              <div className="divide-y divide-gray-50">
                {applications.map((app) => (
                  <div key={app.application_id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-700 text-gray-900 truncate" style={{ fontWeight: 700 }}>{app.property_title}</h3>
                          <StatusBadge status={app.status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} /> {app.address_line_1}, {app.city}, {app.province}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={13} /> R{Number(app.base_price_monthly).toLocaleString()}/month
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} /> Applied {new Date(app.applied_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {app.provider_notes && (
                          <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: "rgba(26,155,173,0.06)", color: "#0F2D4A" }}>
                            <span className="font-700" style={{ fontWeight: 700 }}>Provider note: </span>{app.provider_notes}
                          </div>
                        )}
                      </div>
                      <Link href={`/search`}>
                        <button className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all" style={{ background: "rgba(26,155,173,0.08)", color: "#1A9BAD", fontWeight: 600 }}>
                          View Property <ArrowRight size={12} />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === "incidents" && (
          <div className="bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-700" style={{ fontWeight: 700, color: "#0F2D4A" }}>My Incident Reports</h2>
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-600 transition-all"
                style={{ background: "#EF4444", color: "white", fontWeight: 600 }}
              >
                <Plus size={14} /> Report New
              </button>
            </div>

            {incidentsLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin" style={{ color: "#EF4444" }} />
              </div>
            )}

            {!incidentsLoading && incidents.length === 0 && (
              <div className="text-center py-16">
                <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: "#D1D5DB" }} />
                <p className="text-gray-500 font-600" style={{ fontWeight: 600 }}>No incidents reported yet</p>
                <p className="text-sm text-gray-400 mb-6">Use the button above to report a safety or maintenance issue.</p>
                <button
                  onClick={() => setReportOpen(true)}
                  className="btn-primary text-sm flex items-center gap-2 mx-auto"
                  style={{ padding: "0.625rem 1.5rem" }}
                >
                  <AlertTriangle size={14} /> Report an Incident
                </button>
              </div>
            )}

            {!incidentsLoading && incidents.length > 0 && (
              <div className="divide-y divide-gray-50">
                {incidents.map((inc) => {
                  const sevCfg = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.medium;
                  const stCfg = INCIDENT_STATUS_CONFIG[inc.status] || INCIDENT_STATUS_CONFIG.open;
                  return (
                    <div key={inc.incident_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-700 text-gray-900 truncate" style={{ fontWeight: 700 }}>{inc.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600" style={{ background: sevCfg.bg, color: sevCfg.color, fontWeight: 600 }}>
                              {sevCfg.label}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-600" style={{ background: stCfg.bg, color: stCfg.color, fontWeight: 600 }}>
                              {stCfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{inc.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                            <span className="capitalize px-2 py-0.5 rounded-md" style={{ background: "rgba(15,45,74,0.06)", color: "#0F2D4A" }}>{inc.category}</span>
                            {inc.address_text && <span className="flex items-center gap-1"><MapPin size={11} /> {inc.address_text}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {new Date(inc.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
