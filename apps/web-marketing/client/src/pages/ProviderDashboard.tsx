import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/lib/api";
import {
  Home, Clock, CheckCircle, XCircle, FileText, MapPin,
  DollarSign, Calendar, ArrowRight, Loader2, AlertCircle,
  RefreshCw, Users, Building2, User, BadgeCheck, Filter,
  ChevronDown, Phone, Mail, Download, ClipboardList, Settings
} from "lucide-react";

interface ProviderApplication {
  application_id: string;
  status: string;
  applied_at: string;
  updated_at: string;
  provider_notes?: string;
  property_id: string;
  property_title: string;
  city: string;
  province: string;
  student_id: string;
  first_name: string;
  last_name: string;
  student_email: string;
  student_phone?: string;
  kyc_status: string;
}

interface ProviderProperty {
  property_id: string;
  title: string;
  city: string;
  province: string;
  base_price_monthly: number;
  status: string;
  total_beds: number;
  available_beds: number;
  application_count: number;
  posa_code?: string;
  posa_institution?: string;
}

interface PosaOccupant {
  row_number: number;
  surname: string;
  first_name: string;
  id_number: string;
  student_number: string;
  gender: string;
  year_of_study: string;
  qualification: string;
  campus: string;
  type_of_funding: string;
  nsfas_status: string;
  monthly_rent: number;
  lease_start: string;
  lease_end: string;
  next_of_kin_phone: string;
  email: string;
  phone: string;
}

interface PosaData {
  property: {
    property_id: string;
    title: string;
    address: string;
    total_beds: number;
    posa_code: string;
    posa_institution: string;
    is_nsfas_accredited: boolean;
  };
  month: string;
  occupancy_list: PosaOccupant[];
  total_occupants: number;
  generated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  SUBMITTED:      { label: "Submitted",       color: "#1A9BAD", bg: "rgba(26,155,173,0.1)",   icon: Clock },
  PENDING_NSFAS:  { label: "Pending NSFAS",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   icon: Clock },
  APPROVED:       { label: "Approved",         color: "#10B981", bg: "rgba(16,185,129,0.1)",   icon: CheckCircle },
  REJECTED:       { label: "Rejected",         color: "#EF4444", bg: "rgba(239,68,68,0.1)",    icon: XCircle },
  LEASE_SIGNED:   { label: "Lease Signed",     color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   icon: FileText },
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

export default function ProviderDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [properties, setProperties] = useState<ProviderProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [propertyFilter, setPropertyFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "properties" | "posa">("applications");

  // POSA state
  const [selectedPosaProperty, setSelectedPosaProperty] = useState<string>("");
  const [posaMonth, setPosaMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [posaData, setPosaData] = useState<PosaData | null>(null);
  const [posaLoading, setPosaLoading] = useState(false);
  const [posaError, setPosaError] = useState<string | null>(null);
  const [posaSaving, setPosaSaving] = useState(false);
  const [posaCodeEdit, setPosaCodeEdit] = useState<{ code: string; institution: string }>({ code: "", institution: "" });

  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    fetchData();
  }, [isAuthenticated]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const token = getStoredToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [appsRes, propsRes] = await Promise.all([
        fetch("/api/v1/applications/provider", { headers }),
        fetch("/api/v1/properties/my", { headers }),
      ]);
      if (!appsRes.ok) throw new Error("Failed to fetch applications");
      if (!propsRes.ok) throw new Error("Failed to fetch properties");
      const appsData = await appsRes.json();
      const propsData = await propsRes.json();
      setApplications(appsData.applications || []);
      setProperties(propsData.properties || []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(applicationId: string, newStatus: string, notes?: string) {
    setUpdatingId(applicationId);
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/v1/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, provider_notes: notes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setApplications((prev) =>
        prev.map((a) => a.application_id === applicationId ? { ...a, status: newStatus, provider_notes: notes || a.provider_notes } : a)
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function generatePosa() {
    if (!selectedPosaProperty) return;
    setPosaLoading(true);
    setPosaError(null);
    setPosaData(null);
    try {
      const token = getStoredToken();
      const res = await fetch(
        `/api/v1/institutions/posa/generate?property_id=${selectedPosaProperty}&month=${posaMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate POSA list");
      }
      const data = await res.json();
      setPosaData(data);
      // Pre-fill POSA code editor
      setPosaCodeEdit({
        code: data.property.posa_code || "",
        institution: data.property.posa_institution || ""
      });
    } catch (e: any) {
      setPosaError(e.message);
    } finally {
      setPosaLoading(false);
    }
  }

  async function savePosaCode() {
    if (!selectedPosaProperty) return;
    setPosaSaving(true);
    try {
      const token = getStoredToken();
      await fetch(`/api/v1/institutions/posa/property/${selectedPosaProperty}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ posa_code: posaCodeEdit.code, posa_institution: posaCodeEdit.institution }),
      });
      // Refresh data
      await generatePosa();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPosaSaving(false);
    }
  }

  function downloadPosaCsv() {
    if (!posaData) return;
    const headers = [
      "No.", "Surname", "First Name", "ID Number", "Student Number",
      "Gender", "Year of Study", "Qualification", "Campus",
      "Type of Funding", "NSFAS Status", "Monthly Rent (R)",
      "Lease Start", "Lease End", "Next of Kin Phone", "Email"
    ];
    const rows = posaData.occupancy_list.map(o => [
      o.row_number, o.surname, o.first_name, o.id_number, o.student_number,
      o.gender, o.year_of_study, o.qualification, o.campus,
      o.type_of_funding, o.nsfas_status, o.monthly_rent,
      o.lease_start, o.lease_end, o.next_of_kin_phone, o.email
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `POSA_Occupancy_${posaData.property.title.replace(/\s+/g, "_")}_${posaData.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredApps = applications.filter((a) => {
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (propertyFilter !== "ALL" && a.property_id !== propertyFilter) return false;
    return true;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => ["SUBMITTED", "PENDING_NSFAS"].includes(a.status)).length,
    approved: applications.filter((a) => ["APPROVED", "LEASE_SIGNED"].includes(a.status)).length,
    properties: properties.length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F7FA", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A4A6B)" }}>
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(26,155,173,0.2)" }}>
                  <Building2 size={20} style={{ color: "#1A9BAD" }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Provider Portal</p>
                  <h1 className="text-2xl font-800 text-white" style={{ fontWeight: 800 }}>
                    {user?.first_name} {user?.last_name}
                  </h1>
                </div>
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Manage your properties, review tenant applications, and generate POSA compliance reports
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applications", value: stats.total,      color: "#1A9BAD", icon: FileText },
            { label: "Awaiting Review",    value: stats.pending,    color: "#F59E0B", icon: Clock },
            { label: "Approved / Signed",  value: stats.approved,   color: "#10B981", icon: CheckCircle },
            { label: "My Properties",      value: stats.properties, color: "#8B5CF6", icon: Building2 },
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "applications", label: "Applications", icon: Users },
            { key: "properties",   label: "My Properties", icon: Building2 },
            { key: "posa",         label: "POSA Compliance", icon: ClipboardList },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-700 transition-all"
              style={{
                fontWeight: 700,
                background: activeTab === tab.key ? "#0F2D4A" : "white",
                color: activeTab === tab.key ? "white" : "#6B7280",
                boxShadow: "0 2px 8px rgba(15,45,74,0.07)",
              }}
            >
              <tab.icon size={15} /> {tab.label}
              {tab.key === "applications" && stats.pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ background: "#F59E0B", color: "white" }}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: "#1A9BAD" }} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-5 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <AlertCircle size={18} style={{ color: "#EF4444" }} />
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={fetchData} className="ml-auto text-xs px-3 py-1.5 rounded-lg" style={{ background: "#EF4444", color: "white" }}>Retry</button>
          </div>
        )}

        {/* Applications Tab */}
        {!loading && !error && activeTab === "applications" && (
          <div className="bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
            <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <Filter size={16} style={{ color: "#9CA3AF" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <option value="ALL">All Properties</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>{p.title}</option>
                ))}
              </select>
              <span className="text-sm text-gray-400 ml-auto">{filteredApps.length} applications</span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="text-center py-16">
                <Users size={40} className="mx-auto mb-4" style={{ color: "#D1D5DB" }} />
                <p className="text-gray-500 font-600" style={{ fontWeight: 600 }}>No applications found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredApps.map((app) => (
                  <div key={app.application_id} className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(26,155,173,0.1)" }}>
                            <User size={16} style={{ color: "#1A9BAD" }} />
                          </div>
                          <div>
                            <p className="font-700 text-gray-900" style={{ fontWeight: 700 }}>
                              {app.first_name} {app.last_name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><Mail size={11} /> {app.student_email}</span>
                              {app.student_phone && <span className="flex items-center gap-1"><Phone size={11} /> {app.student_phone}</span>}
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  background: app.kyc_status === "VERIFIED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                  color: app.kyc_status === "VERIFIED" ? "#10B981" : "#F59E0B",
                                  fontWeight: 700,
                                }}
                              >
                                {app.kyc_status === "VERIFIED" ? "✓ KYC Verified" : "KYC Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap mt-2">
                          <span className="flex items-center gap-1"><Home size={13} /> {app.property_title}</span>
                          <span className="flex items-center gap-1"><MapPin size={13} /> {app.city}, {app.province}</span>
                          <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(app.applied_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {app.provider_notes && (
                          <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(26,155,173,0.05)", color: "#374151" }}>
                            <span className="font-700" style={{ fontWeight: 700 }}>Your note: </span>{app.provider_notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <StatusBadge status={app.status} />
                        {["SUBMITTED", "PENDING_NSFAS"].includes(app.status) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(app.application_id, "APPROVED")}
                              disabled={updatingId === app.application_id}
                              className="text-xs px-3 py-1.5 rounded-lg font-700 transition-all flex items-center gap-1"
                              style={{ background: "#10B981", color: "white", fontWeight: 700, opacity: updatingId === app.application_id ? 0.6 : 1 }}
                            >
                              {updatingId === app.application_id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                            </button>
                            <button
                              onClick={() => updateStatus(app.application_id, "REJECTED")}
                              disabled={updatingId === app.application_id}
                              className="text-xs px-3 py-1.5 rounded-lg font-700 transition-all flex items-center gap-1"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", fontWeight: 700 }}
                            >
                              <XCircle size={11} /> Decline
                            </button>
                          </div>
                        )}
                        {app.status === "APPROVED" && (
                          <button
                            onClick={() => updateStatus(app.application_id, "LEASE_SIGNED")}
                            disabled={updatingId === app.application_id}
                            className="text-xs px-3 py-1.5 rounded-lg font-700 transition-all flex items-center gap-1"
                            style={{ background: "#8B5CF6", color: "white", fontWeight: 700 }}
                          >
                            <FileText size={11} /> Mark Lease Signed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Properties Tab */}
        {!loading && !error && activeTab === "properties" && (
          <div>
            {properties.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                <Building2 size={40} className="mx-auto mb-4" style={{ color: "#D1D5DB" }} />
                <p className="text-gray-500 font-600 mb-2" style={{ fontWeight: 600 }}>No properties listed yet</p>
                <Link href="/list-property">
                  <button className="mt-4 px-6 py-2.5 rounded-xl text-sm font-700" style={{ background: "#1A9BAD", color: "white", fontWeight: 700 }}>
                    + List Your First Property
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {properties.map((prop) => (
                  <div key={prop.property_id} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-700 text-gray-900 truncate mb-1" style={{ fontWeight: 700 }}>{prop.title}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={11} /> {prop.city}, {prop.province}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full ml-2"
                        style={{
                          background: prop.status === "ACTIVE" ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.1)",
                          color: prop.status === "ACTIVE" ? "#10B981" : "#6B7280",
                          fontWeight: 700,
                        }}
                      >
                        {prop.status}
                      </span>
                    </div>
                    {prop.posa_code && (
                      <div className="mb-3 px-2 py-1 rounded text-xs" style={{ background: "rgba(139,92,246,0.07)", color: "#8B5CF6" }}>
                        POSA: {prop.posa_code} · {prop.posa_institution}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
                        <p className="text-lg font-800" style={{ color: "#0F2D4A", fontWeight: 800 }}>{prop.available_beds}</p>
                        <p className="text-xs text-gray-400">Available</p>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
                        <p className="text-lg font-800" style={{ color: "#1A9BAD", fontWeight: 800 }}>{prop.application_count}</p>
                        <p className="text-xs text-gray-400">Applications</p>
                      </div>
                      <div className="text-center p-2 rounded-lg" style={{ background: "#F5F7FA" }}>
                        <p className="text-sm font-800" style={{ color: "#10B981", fontWeight: 800 }}>R{Number(prop.base_price_monthly / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-gray-400">/ month</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => { setPropertyFilter(prop.property_id); setActiveTab("applications"); }}
                        className="flex-1 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "rgba(26,155,173,0.08)", color: "#1A9BAD", fontWeight: 600 }}
                      >
                        <Users size={12} /> Applications
                      </button>
                      <button
                        onClick={() => { setSelectedPosaProperty(prop.property_id); setActiveTab("posa"); }}
                        className="flex-1 text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        style={{ background: "rgba(139,92,246,0.08)", color: "#8B5CF6", fontWeight: 600 }}
                      >
                        <ClipboardList size={12} /> POSA
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POSA Compliance Tab */}
        {!loading && activeTab === "posa" && (
          <div>
            {/* POSA Info Banner */}
            <div className="mb-6 p-5 rounded-2xl flex items-start gap-4" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(26,155,173,0.06))", border: "1px solid rgba(139,92,246,0.15)" }}>
              <ClipboardList size={22} style={{ color: "#8B5CF6", flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 className="font-700 text-gray-900 mb-1" style={{ fontWeight: 700 }}>POSA Occupancy List Generator</h3>
                <p className="text-sm text-gray-500">
                  Generate the UJ-prescribed POSA (Private Off-campus Student Accommodation) monthly occupancy list
                  for your accredited properties. Download as CSV to submit to <strong>posadocuments@uj.ac.za</strong>.
                </p>
              </div>
            </div>

            {/* Generator Controls */}
            <div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
              <h4 className="font-700 text-gray-900 mb-4" style={{ fontWeight: 700 }}>Generate Occupancy List</h4>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Select Property</label>
                  <select
                    value={selectedPosaProperty}
                    onChange={(e) => setSelectedPosaProperty(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <option value="">-- Choose a property --</option>
                    {properties.map((p) => (
                      <option key={p.property_id} value={p.property_id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Month</label>
                  <input
                    type="month"
                    value={posaMonth}
                    onChange={(e) => setPosaMonth(e.target.value)}
                    className="text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  />
                </div>
                <button
                  onClick={generatePosa}
                  disabled={!selectedPosaProperty || posaLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-700 transition-all"
                  style={{
                    background: selectedPosaProperty ? "#8B5CF6" : "#E5E7EB",
                    color: selectedPosaProperty ? "white" : "#9CA3AF",
                    fontWeight: 700,
                    cursor: selectedPosaProperty ? "pointer" : "not-allowed"
                  }}
                >
                  {posaLoading ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />}
                  Generate List
                </button>
              </div>
            </div>

            {posaError && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <AlertCircle size={16} style={{ color: "#EF4444" }} />
                <p className="text-sm text-red-600">{posaError}</p>
              </div>
            )}

            {posaData && (
              <div>
                {/* POSA Code Settings */}
                <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-700 text-gray-900 flex items-center gap-2" style={{ fontWeight: 700 }}>
                      <Settings size={16} style={{ color: "#8B5CF6" }} /> POSA Property Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>POSA Code</label>
                      <input
                        type="text"
                        value={posaCodeEdit.code}
                        onChange={(e) => setPosaCodeEdit(p => ({ ...p, code: e.target.value }))}
                        placeholder="e.g. UJ-POSA-001"
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Institution</label>
                      <input
                        type="text"
                        value={posaCodeEdit.institution}
                        onChange={(e) => setPosaCodeEdit(p => ({ ...p, institution: e.target.value }))}
                        placeholder="e.g. University of Johannesburg"
                        className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={savePosaCode}
                    disabled={posaSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-700"
                    style={{ background: "#0F2D4A", color: "white", fontWeight: 700 }}
                  >
                    {posaSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Save & Refresh
                  </button>
                </div>

                {/* Occupancy List */}
                <div className="bg-white rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-700 text-gray-900" style={{ fontWeight: 700 }}>
                        {posaData.property.title} — {posaData.month}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {posaData.total_occupants} occupant{posaData.total_occupants !== 1 ? "s" : ""} · {posaData.property.address}
                        {posaData.property.posa_code && ` · POSA: ${posaData.property.posa_code}`}
                      </p>
                    </div>
                    <button
                      onClick={downloadPosaCsv}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-700 transition-all"
                      style={{ background: "#10B981", color: "white", fontWeight: 700 }}
                    >
                      <Download size={15} /> Download CSV
                    </button>
                  </div>

                  {posaData.occupancy_list.length === 0 ? (
                    <div className="text-center py-12">
                      <Users size={36} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                      <p className="text-gray-500 font-600" style={{ fontWeight: 600 }}>No active occupants for this period</p>
                      <p className="text-sm text-gray-400">Occupants appear once a lease is approved and signed.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: "#F5F7FA" }}>
                            {["#", "Name", "ID Number", "Student No.", "Gender", "Year", "Qualification", "Campus", "Funding", "Rent (R)", "Lease Period"].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-500 whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {posaData.occupancy_list.map((o) => (
                            <tr key={o.row_number} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-400 text-xs">{o.row_number}</td>
                              <td className="px-4 py-3">
                                <p className="font-600 text-gray-900" style={{ fontWeight: 600 }}>{o.surname}, {o.first_name}</p>
                                <p className="text-xs text-gray-400">{o.email}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs font-mono">{o.id_number || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{o.student_number || <span className="text-gray-300">—</span>}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{o.gender || "—"}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{o.year_of_study || "—"}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs max-w-32 truncate">{o.qualification || "—"}</td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{o.campus || "—"}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 700 }}>
                                  {o.type_of_funding}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-900 font-700 text-xs" style={{ fontWeight: 700 }}>R{Number(o.monthly_rent).toLocaleString()}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{o.lease_start} → {o.lease_end}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
