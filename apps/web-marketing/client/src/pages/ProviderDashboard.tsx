import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/lib/api";
import {
  Home, Users, ClipboardList, FileText, Receipt, Send,
  CheckCircle, Clock, XCircle, AlertTriangle, Download,
  Plus, Search, Eye, ChevronDown, Loader2, RefreshCw,
  Building2, Settings, Bell, Calendar, DollarSign,
  TrendingUp, BadgeCheck, Filter, MoreVertical, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  student_number?: string;
  id_number?: string;
  nsfas_status?: string;
  year_of_study?: string;
  qualification?: string;
  campus?: string;
  gender?: string;
  type_of_funding?: string;
  lease_id?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent?: number;
  lease_status?: string;
  signed_at?: string;
  pdf_url?: string;
  property_id?: string;
  property_title?: string;
  posa_code?: string;
  posa_institution?: string;
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
  monthly_rent: number;
  lease_start: string;
  lease_end: string;
  email: string;
}

interface PosaData {
  property: { property_id: string; title: string; address: string; posa_code?: string; posa_institution?: string };
  month: string;
  occupancy_list: PosaOccupant[];
  total_occupants: number;
  generated_at: string;
}

type Section = "dashboard" | "students" | "occupancy" | "contracts" | "invoices" | "submit" | "applications";

const NAVY = "#0F2D4A";
const TEAL = "#1A9BAD";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const RED = "#EF4444";
const LIGHT = "#F5F7FA";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nsfasColor(status?: string) {
  if (!status) return { bg: "#F3F4F6", color: "#6B7280", label: "Unknown" };
  const s = status.toLowerCase();
  if (s.includes("verified") || s === "approved") return { bg: "rgba(16,185,129,0.1)", color: GREEN, label: "NSFAS Verified" };
  if (s.includes("pending")) return { bg: "rgba(245,158,11,0.1)", color: AMBER, label: "Pending Check" };
  if (s.includes("not") || s === "rejected") return { bg: "rgba(239,68,68,0.1)", color: RED, label: "Not on List" };
  return { bg: "rgba(107,114,128,0.1)", color: "#6B7280", label: status };
}

function fundingBadge(funding?: string) {
  if (!funding) return { bg: "#F3F4F6", color: "#6B7280", label: "—" };
  const f = funding.toLowerCase();
  if (f.includes("nsfas")) return { bg: "rgba(26,155,173,0.12)", color: TEAL, label: "NSFAS" };
  if (f.includes("bursary")) return { bg: "rgba(139,92,246,0.12)", color: "#8B5CF6", label: "Bursary" };
  return { bg: "#F3F4F6", color: "#6B7280", label: funding };
}

function leaseStatusBadge(status?: string) {
  if (!status) return { bg: "#F3F4F6", color: "#6B7280", icon: Clock, label: "—" };
  const s = status.toLowerCase();
  if (s === "active" || s === "signed") return { bg: "rgba(16,185,129,0.1)", color: GREEN, icon: CheckCircle, label: "Signed" };
  if (s.includes("pending")) return { bg: "rgba(245,158,11,0.1)", color: AMBER, icon: Clock, label: "Pending" };
  return { bg: "#F3F4F6", color: "#6B7280", icon: Clock, label: status };
}

function fmtRand(n?: number | string) {
  const v = Number(n || 0);
  return `R ${v.toLocaleString("en-ZA")}`;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 font-600" style={{ fontWeight: 600 }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>{value}</p>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, badge, onClick }: { icon: any; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
      style={{
        background: active ? NAVY : "transparent",
        color: active ? "white" : "#6B7280",
        fontWeight: active ? 700 : 500,
      }}
    >
      <Icon size={16} />
      <span className="text-sm flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: active ? "rgba(255,255,255,0.2)" : `${TEAL}18`, color: active ? "white" : TEAL, fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [section, setSection] = useState<Section>("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [properties, setProperties] = useState<ProviderProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [posaData, setPosaData] = useState<PosaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [posaLoading, setPosaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [posaSaving, setPosaSaving] = useState(false);
  const [posaCode, setPosaCode] = useState("");
  const [posaInstitution, setPosaInstitution] = useState("");
  const [submissionMonth, setSubmissionMonth] = useState<string>(currentMonth());

  // Redirect if not authenticated or not provider
  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    if (user && user.role !== "PROVIDER") { navigate("/"); return; }
  }, [isAuthenticated, user, navigate]);

  // Fetch properties and students
  // Fetch students for a specific property ID
  const fetchStudents = useCallback(async (propId: string) => {
    if (!propId) return;
    const token = getStoredToken();
    if (!token) return;
    try {
      const studsRes = await fetch(`/api/v1/properties/posa/students?property_id=${propId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (studsRes.ok) {
        const d = await studsRes.json();
        setStudents((d.students || []).map((s: any) => ({
          ...s,
          property_id: propId,
          nsfas_status: s.type_of_funding?.toLowerCase().includes('nsfas') ? 'NSFAS Verified' : (s.nsfas_status || 'Unknown'),
        })));
      }
    } catch (e) {
      // silently fail
    }
  }, []);

  // Fetch applications for the provider
  const fetchApplications = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setAppsLoading(true);
    try {
      const res = await fetch("/api/v1/applications/provider", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || (Array.isArray(d) ? d : []));
      }
    } catch (e) {
      // silently fail
    } finally {
      setAppsLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId: string, newStatus: string, notes?: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const body: any = { status: newStatus };
      if (notes) body.provider_notes = notes;
      const res = await fetch(`/api/v1/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Optimistically update local state
        setApplications(prev => prev.map(a =>
          (a.application_id === applicationId || a.id === applicationId)
            ? { ...a, status: newStatus, provider_notes: notes ?? a.provider_notes }
            : a
        ));
      }
    } catch (e) {
      // silently fail
    }
  }, []);

  // Fetch properties (runs once on mount)
  const fetchData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const propsRes = await fetch("/api/v1/properties/my", { headers: { Authorization: `Bearer ${token}` } });
      if (propsRes.ok) {
        const d = await propsRes.json();
        const props = d.properties || [];
        setProperties(props);
        if (props.length > 0) {
          const firstId = props[0].property_id;
          setSelectedProperty(firstId);
          setPosaCode(props[0].posa_code || "");
          setPosaInstitution(props[0].posa_institution || "");
          await fetchStudents(firstId);
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchStudents]);

  useEffect(() => { fetchData(); fetchApplications(); }, []);
  // Re-fetch students when selected property changes
  useEffect(() => { if (selectedProperty) fetchStudents(selectedProperty); }, [selectedProperty, fetchStudents]);

  // Fetch POSA data when property or month changes
  const fetchPosa = useCallback(async () => {
    if (!selectedProperty) return;
    const token = getStoredToken();
    if (!token) return;
    setPosaLoading(true);
    try {
      const res = await fetch(`/api/v1/properties/posa/students?property_id=${selectedProperty}&month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        // Map property-api response to PosaData format
        const mapped: PosaData = {
          property: {
            property_id: d.property?.property_id || selectedProperty,
            title: d.property?.title || '',
            address: d.property?.title || '',
            posa_code: d.property?.posa_code,
            posa_institution: d.property?.posa_institution,
          },
          month: d.month || selectedMonth,
          occupancy_list: (d.students || []).map((s: any, i: number) => ({
            row_number: i + 1,
            surname: s.last_name || '',
            first_name: s.first_name || '',
            id_number: s.id_number || '',
            student_number: s.student_number || '',
            gender: s.gender || '',
            year_of_study: s.year_of_study || '',
            qualification: s.qualification || '',
            campus: s.campus || '',
            type_of_funding: s.type_of_funding || '',
            monthly_rent: s.monthly_rent || 0,
            lease_start: s.start_date || '',
            lease_end: s.end_date || '',
            email: s.email || '',
          })),
          total_occupants: (d.students || []).length,
          generated_at: new Date().toISOString(),
        };
        setPosaData(mapped);
        // Also update students list from this response
        if (d.students && d.students.length > 0) {
          setStudents(d.students.map((s: any) => ({
            ...s,
            user_id: s.user_id || s.tenant_id,
            nsfas_status: s.type_of_funding?.toLowerCase().includes('nsfas') ? 'NSFAS Verified' : s.nsfas_status,
          })));
        }
      }
    } catch (e) {
      // silently fail
    } finally {
      setPosaLoading(false);
    }
  }, [selectedProperty, selectedMonth]);

  useEffect(() => {
    if (section === "occupancy" || section === "submit") fetchPosa();
  }, [section, selectedProperty, selectedMonth, fetchPosa]);

  // Update POSA code/institution for selected property
  const savePosaDetails = async () => {
    if (!selectedProperty) return;
    const token = getStoredToken();
    if (!token) return;
    setPosaSaving(true);
    try {
      await fetch(`/api/v1/properties/posa/${selectedProperty}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ posa_code: posaCode, posa_institution: posaInstitution }),
      });
      await fetchData();
      await fetchPosa();
    } finally {
      setPosaSaving(false);
    }
  };

  // Download POSA CSV
  const downloadPosaCsv = () => {
    if (!posaData) return;
    const headers = ["#", "POSA Code", "POSA Name", "Student Name", "Student Surname", "Gender", "Student Number", "Year of Study", "Type of Funding", "Qualification", "Monthly Rent", "Lease Start", "Lease End"];
    const rows = posaData.occupancy_list.map((o) => [
      o.row_number, o.id_number, posaData.property.posa_institution || posaData.property.title,
      o.first_name, o.surname, o.gender || "", o.student_number || "",
      o.year_of_study || "", o.type_of_funding || "", o.qualification || "",
      o.monthly_rent, o.lease_start, o.lease_end,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const propName = (posaData.property.posa_institution || posaData.property.title).replace(/\s+/g, "_");
    a.download = `${posaData.property.posa_code || "POSA"}_${propName}_${posaData.month}.csv`;
    a.click();
  };

  // Derived stats
  const filteredStudents = students.filter((s) =>
    true || s.property_id === selectedProperty
  ).filter((s) =>
    !searchQuery || `${s.first_name} ${s.last_name} ${s.student_number || ""} ${s.id_number || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = filteredStudents.length;
  const nsfasVerified = filteredStudents.filter((s) => (s.nsfas_status || "").toLowerCase().includes("verified") || (s.nsfas_status || "").toLowerCase() === "approved").length;
  const contractsSigned = filteredStudents.filter((s) => (s.lease_status || "").toLowerCase() === "active" || (s.lease_status || "").toLowerCase() === "signed").length;
  const monthlyRevenue = filteredStudents.reduce((sum, s) => sum + Number(s.monthly_rent || 0), 0);
  const selectedProp = properties.find((p) => p.property_id === selectedProperty);

  // Months for selector
  const months = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(2026, 1 + i); // Feb 2026 → Nov 2026
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  if (!isAuthenticated || (user && user.role !== "PROVIDER")) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: LIGHT, fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />
      <div className="pt-20">
        <div className="flex min-h-screen">

          {/* ── Sidebar ── */}
          <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: "white", borderRight: "1px solid #E5E7EB", minHeight: "calc(100vh - 80px)" }}>
            {/* Property selector */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-800" style={{ background: NAVY, fontWeight: 800 }}>
                  {(selectedProp?.title || user?.first_name || "P").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-700 text-gray-900 truncate" style={{ fontWeight: 700 }}>{selectedProp?.title || "My Property"}</p>
                  <p className="text-xs text-gray-400">POSA Code: {selectedProp?.posa_code || "Not set"}</p>
                </div>
              </div>
              {properties.length > 1 && (
                <select
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    const p = properties.find((x) => x.property_id === e.target.value);
                    if (p) { setPosaCode(p.posa_code || ""); setPosaInstitution(p.posa_institution || ""); }
                  }}
                  className="w-full mt-2 text-xs rounded-lg border border-gray-200 px-2 py-1.5 text-gray-600"
                >
                  {properties.map((p) => <option key={p.property_id} value={p.property_id}>{p.title}</option>)}
                </select>
              )}
            </div>

            {/* Overdue alert */}
            {posaData && posaData.total_occupants > 0 && (
              <div className="mx-3 mt-3 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} style={{ color: RED }} />
                  <p className="text-xs font-700" style={{ color: RED, fontWeight: 700 }}>OVERDUE</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">April submission — not submitted</p>
              </div>
            )}

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1">
              <SidebarItem icon={Home} label="Dashboard" active={section === "dashboard"} onClick={() => setSection("dashboard")} />
              <SidebarItem icon={Users} label="Students" active={section === "students"} badge={totalStudents} onClick={() => setSection("students")} />
              <SidebarItem icon={ClipboardList} label="Occupancy List" active={section === "occupancy"} onClick={() => setSection("occupancy")} />
              <SidebarItem icon={FileText} label="Contracts" active={section === "contracts"} badge={contractsSigned} onClick={() => setSection("contracts")} />
              <SidebarItem icon={Receipt} label="Invoices" active={section === "invoices"} onClick={() => setSection("invoices")} />
              <SidebarItem icon={Send} label="Submit to UJ" active={section === "submit"} onClick={() => setSection("submit")} />
              <SidebarItem icon={ClipboardList} label="Applications" active={section === "applications"} badge={applications.length} onClick={() => { setSection("applications"); fetchApplications(); }} />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={13} style={{ color: "#9CA3AF" }} />
                <p className="text-xs text-gray-400">Notifications</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">Academic Year 2026</p>
              <p className="text-xs text-gray-400">Feb – Nov · 10 months</p>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="animate-spin" style={{ color: TEAL }} />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: RED }} />
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-700 mx-auto" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : (
              <>
                {/* ── DASHBOARD ── */}
                {section === "dashboard" && (
                  <div className="p-6 max-w-6xl">
                    {/* Hero banner */}
                    <div className="rounded-2xl p-8 mb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY}, #1A4A6B)` }}>
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #1A9BAD 0%, transparent 60%)" }} />
                      <div className="relative z-10 flex items-start justify-between">
                        <div>
                          <p className="text-xs font-700 uppercase tracking-widest mb-2" style={{ color: TEAL }}>DIGZIO AP PAYMENT TOOL · DEMO</p>
                          <h1 className="text-3xl font-800 text-white mb-2" style={{ fontWeight: 800 }}>{selectedProp?.title || "My Property"}</h1>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                            {totalStudents} students · {fmtRand(monthlyRevenue)}/month · Feb–Nov 2026
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-800 text-white" style={{ fontWeight: 800, color: "#EF4444" }}>LATE</div>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>April overdue</p>
                        </div>
                      </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <StatCard label="Total Students" value={totalStudents} icon={Users} color={NAVY} />
                      <StatCard label="NSFAS Verified" value={`${nsfasVerified}/${totalStudents}`} icon={BadgeCheck} color={GREEN} />
                      <StatCard label="Contracts Signed" value={`${contractsSigned}/${totalStudents}`} icon={FileText} color={TEAL} />
                      <StatCard label="Monthly Revenue" value={fmtRand(monthlyRevenue)} icon={DollarSign} color="#8B5CF6" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Document readiness */}
                      <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                        <h3 className="font-700 text-gray-900 mb-5" style={{ fontWeight: 700 }}>Document Readiness — {monthLabel(currentMonth())}</h3>
                        <div className="space-y-3 mb-6">
                          {[
                            { label: "Occupancy List", sub: `${totalStudents} students`, status: totalStudents > 0 ? "action" : "pending" },
                            { label: "Student Contracts", sub: `${contractsSigned}/${totalStudents} signed`, status: contractsSigned < totalStudents ? "action" : "ready" },
                            { label: "Invoices", sub: `${contractsSigned}/${totalStudents} generated`, status: contractsSigned < totalStudents ? "action" : "ready" },
                            { label: "NSFAS Verification", sub: `${nsfasVerified} verified · ${totalStudents - nsfasVerified} pending`, status: nsfasVerified < totalStudents ? "action" : "ready" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: LIGHT }}>
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.status === "ready" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }}>
                                  {item.status === "ready" ? <CheckCircle size={13} style={{ color: GREEN }} /> : <Clock size={13} style={{ color: AMBER }} />}
                                </div>
                                <div>
                                  <p className="text-sm font-600 text-gray-900" style={{ fontWeight: 600 }}>{item.label}</p>
                                  <p className="text-xs text-gray-400">{item.sub}</p>
                                </div>
                              </div>
                              <span className="text-xs px-2.5 py-1 rounded-full font-700" style={{
                                background: item.status === "ready" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                color: item.status === "ready" ? GREEN : AMBER,
                                fontWeight: 700,
                              }}>
                                {item.status === "ready" ? "Ready" : "Action needed"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setSection("submit")}
                          className="w-full py-3 rounded-xl text-sm font-700 flex items-center justify-center gap-2"
                          style={{ background: NAVY, color: "white", fontWeight: 700 }}
                        >
                          <Send size={15} /> Generate &amp; Submit to UJ POSA <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Submission history + NSFAS */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <h4 className="font-700 text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>Submission History</h4>
                          {[
                            { month: "February 2026", date: "2026-02-13", status: "submitted", amount: "R26k" },
                            { month: "March 2026", date: "2026-03-17", status: "submitted", amount: "R26k" },
                            { month: "April 2026", date: null, status: "overdue", amount: null },
                            { month: "May 2026", date: null, status: "pending", amount: null },
                          ].map((s) => (
                            <div key={s.month} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <div>
                                <p className="text-xs font-600 text-gray-700" style={{ fontWeight: 600 }}>{s.month}</p>
                                {s.date && <p className="text-xs text-gray-400">Submitted {fmtDate(s.date)}</p>}
                                {!s.date && <p className="text-xs text-gray-400">Not submitted</p>}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{
                                background: s.status === "submitted" ? "rgba(16,185,129,0.1)" : s.status === "overdue" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                color: s.status === "submitted" ? GREEN : s.status === "overdue" ? RED : AMBER,
                                fontWeight: 700,
                              }}>
                                {s.status === "submitted" ? s.amount : s.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <h4 className="font-700 text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>NSFAS Status</h4>
                          {[
                            { label: "Verified", count: nsfasVerified, color: GREEN },
                            { label: "Pending", count: Math.max(0, totalStudents - nsfasVerified - Math.max(0, totalStudents - nsfasVerified - 1)), color: AMBER },
                            { label: "Not on List", count: Math.max(0, totalStudents - nsfasVerified - 1), color: RED },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center gap-3 mb-2">
                              <p className="text-xs text-gray-500 w-20">{row.label}</p>
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                                <div className="h-1.5 rounded-full" style={{ width: totalStudents ? `${(row.count / totalStudents) * 100}%` : "0%", background: row.color }} />
                              </div>
                              <span className="text-xs font-700" style={{ color: row.color, fontWeight: 700 }}>{row.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STUDENTS ── */}
                {section === "students" && (
                  <div className="p-6 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Students</h2>
                        <p className="text-sm text-gray-400">{totalStudents} students at {selectedProp?.title || "your property"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-700 px-3 py-1.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                          {selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}
                        </p>
                      </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      {[
                        { label: "NSFAS Verified", count: nsfasVerified, color: GREEN },
                        { label: "Pending Check", count: 1, color: AMBER },
                        { label: "Not on NSFAS List", count: Math.max(0, totalStudents - nsfasVerified - 1), color: RED },
                        { label: "Contracts Signed", count: contractsSigned, color: TEAL },
                      ].map((t) => (
                        <span key={t.label} className="text-xs px-3 py-1.5 rounded-full font-700 cursor-pointer" style={{ background: `${t.color}18`, color: t.color, fontWeight: 700 }}>
                          {t.label}: {t.count}
                        </span>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, student number, ID..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white"
                        />
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-700" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                        <Plus size={14} /> Add Student
                      </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: LIGHT }}>
                            {["Student", "Student Number", "Campus", "Funding", "NSFAS Status", "Contract", "Invoice", "Actions"].map((h) => (
                              <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-500 whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredStudents.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No students found</td></tr>
                          ) : filteredStudents.map((s) => {
                            const ns = nsfasColor(s.nsfas_status);
                            const fn = fundingBadge(s.type_of_funding);
                            const ls = leaseStatusBadge(s.lease_status);
                            const LsIcon = ls.icon;
                            return (
                              <tr key={s.user_id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-600 text-gray-900" style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</p>
                                  <p className="text-xs text-gray-400">ID: {s.id_number || "—"}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600 text-xs">{s.student_number || "—"}</td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                                    {s.campus || "SWC"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: fn.bg, color: fn.color, fontWeight: 700 }}>
                                    {fn.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2.5 py-1 rounded-full font-700" style={{ background: ns.bg, color: ns.color, fontWeight: 700 }}>
                                    {ns.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <LsIcon size={16} style={{ color: ls.color }} />
                                </td>
                                <td className="px-4 py-3">
                                  <Clock size={16} style={{ color: AMBER }} />
                                </td>
                                <td className="px-4 py-3">
                                  <button className="text-xs font-700 flex items-center gap-1" style={{ color: TEAL, fontWeight: 700 }}>
                                    <Eye size={12} /> View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── OCCUPANCY LIST ── */}
                {section === "occupancy" && (
                  <div className="p-6 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Occupancy List</h2>
                        <p className="text-sm text-gray-400">UJ POSA Template · {monthLabel(selectedMonth)} · Due 15 {monthLabel(selectedMonth)}</p>
                      </div>
                      <p className="text-xs font-700 px-3 py-1.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                        {selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}
                      </p>
                    </div>

                    {/* Month selector + download */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-600 text-gray-600" style={{ fontWeight: 600 }}>Month:</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="text-sm rounded-xl border border-gray-200 px-3 py-2 text-gray-700"
                        >
                          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                        </select>
                      </div>
                      <button
                        onClick={downloadPosaCsv}
                        disabled={!posaData || posaData.occupancy_list.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-700"
                        style={{ background: NAVY, color: "white", fontWeight: 700, opacity: (!posaData || posaData.occupancy_list.length === 0) ? 0.5 : 1 }}
                      >
                        <Download size={14} /> Download Excel (.xlsx)
                      </button>
                    </div>

                    {/* UJ requirements banner */}
                    <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background: "rgba(26,155,173,0.06)", border: "1px solid rgba(26,155,173,0.2)" }}>
                      <ClipboardList size={15} style={{ color: TEAL, flexShrink: 0, marginTop: 1 }} />
                      <p className="text-xs text-gray-600">
                        <strong>UJ POSA Requirements:</strong> Submit in Excel format only using the prescribed template. One file per property.
                        File name: <code className="text-xs font-mono bg-gray-100 px-1 rounded">{selectedProp?.posa_code || "XXXX"}_{(selectedProp?.posa_institution || "Property").replace(/\s+/g, "_")}_{monthLabel(selectedMonth).replace(" ", "_")}.xlsx</code>
                      </p>
                    </div>

                    {/* POSA settings */}
                    <div className="bg-white rounded-2xl p-5 mb-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Settings size={15} style={{ color: "#8B5CF6" }} />
                        <h4 className="font-700 text-gray-900 text-sm" style={{ fontWeight: 700 }}>POSA Property Details</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>POSA Code</label>
                          <input
                            value={posaCode}
                            onChange={(e) => setPosaCode(e.target.value)}
                            placeholder="e.g. 1233"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-600 text-gray-500 mb-1.5" style={{ fontWeight: 600 }}>Institution / Property Name (for POSA)</label>
                          <input
                            value={posaInstitution}
                            onChange={(e) => setPosaInstitution(e.target.value)}
                            placeholder="e.g. Siwedi & Associates Pinmill"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700"
                          />
                        </div>
                      </div>
                      <button
                        onClick={savePosaDetails}
                        disabled={posaSaving}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-700"
                        style={{ background: NAVY, color: "white", fontWeight: 700 }}
                      >
                        {posaSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Save &amp; Refresh
                      </button>
                    </div>

                    {/* Occupancy table */}
                    {posaLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin" style={{ color: TEAL }} />
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-700 text-gray-900" style={{ fontWeight: 700 }}>
                              {monthLabel(selectedMonth)} Occupancy List 2026
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-700" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                                {posaData?.total_occupants || 0} students
                              </span>
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">Sheet: {monthLabel(selectedMonth)} Occupancy List 2026</p>
                          </div>
                        </div>
                        {(!posaData || posaData.occupancy_list.length === 0) ? (
                          <div className="text-center py-12">
                            <Users size={36} className="mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                            <p className="text-gray-500 font-600" style={{ fontWeight: 600 }}>No active occupants for this period</p>
                            <p className="text-sm text-gray-400">Occupants appear once a lease is approved and active.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ background: LIGHT }}>
                                  {["#", "POSA Code", "POSA Name", "Student Name", "Student Surname", "Gender", "Student Number", "Year of Study", "Type of Funding", "Qualification"].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-700 text-gray-500 whitespace-nowrap" style={{ fontWeight: 700 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {posaData.occupancy_list.map((o) => (
                                  <tr key={o.row_number} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-gray-400 text-xs">{o.row_number}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs font-mono">{posaData.property.posa_code || "—"}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{posaData.property.posa_institution || posaData.property.title}</td>
                                    <td className="px-4 py-3 font-600 text-gray-900 text-xs" style={{ fontWeight: 600 }}>{o.first_name}</td>
                                    <td className="px-4 py-3 font-600 text-gray-900 text-xs" style={{ fontWeight: 600 }}>{o.surname}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{o.gender || "—"}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{o.student_number || "—"}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{o.year_of_study || "—"}</td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                                        {o.type_of_funding || "NSFAS"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs max-w-40 truncate">{o.qualification || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                              <span>Property: <strong className="text-gray-600">{selectedProp?.title}</strong> · POSA Code: <strong className="text-gray-600">{selectedProp?.posa_code || "—"}</strong></span>
                              <span>Submission deadline: <strong className="text-gray-600">15 {monthLabel(selectedMonth)}</strong> · Email: <strong className="text-gray-600">posadocuments@uj.ac.za</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3-step guide */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {[
                        { n: "01", title: "Download Excel", body: "Click 'Download Excel' to generate the occupancy list in the UJ POSA prescribed format." },
                        { n: "02", title: "Verify & Review", body: "Open the file and check all student data is correct. Ensure no fields are missing." },
                        { n: "03", title: "Email to UJ POSA", body: "Send to posadocuments@uj.ac.za before the 15th. Subject: '[POSA Code] [Property Name] Occupancy List [Month] 2026'" },
                      ].map((step) => (
                        <div key={step.n} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <p className="text-3xl font-800 mb-2" style={{ color: "#E5E7EB", fontWeight: 800 }}>{step.n}</p>
                          <h4 className="font-700 text-gray-900 mb-2 text-sm" style={{ fontWeight: 700 }}>{step.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── CONTRACTS ── */}
                {section === "contracts" && (
                  <div className="p-6 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Student Contracts</h2>
                        <p className="text-sm text-gray-400">{contractsSigned}/{totalStudents} signed · Academic Year Feb–Nov 2026</p>
                      </div>
                      <p className="text-xs font-700 px-3 py-1.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                        {selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-sm px-3 py-1.5 rounded-full font-700" style={{ background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 700 }}>{contractsSigned} signed</span>
                      <span className="text-sm px-3 py-1.5 rounded-full font-700" style={{ background: "rgba(245,158,11,0.1)", color: AMBER, fontWeight: 700 }}>{totalStudents - contractsSigned} pending signature</span>
                      <div className="flex-1" />
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-700" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                        <Download size={14} /> Download All Contracts (.zip)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredStudents.map((s) => {
                        const ls = leaseStatusBadge(s.lease_status);
                        const fn = fundingBadge(s.type_of_funding);
                        return (
                          <div key={s.user_id} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-800" style={{ background: NAVY, fontWeight: 800 }}>
                                  {s.first_name.charAt(0)}{s.last_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-700 text-gray-900 text-sm" style={{ fontWeight: 700 }}>{s.first_name} {s.last_name}</p>
                                  <p className="text-xs text-gray-400">{s.student_number || "—"}</p>
                                </div>
                              </div>
                              <span className="text-xs px-2.5 py-1 rounded-full font-700" style={{ background: ls.bg, color: ls.color, fontWeight: 700 }}>
                                {ls.label === "Signed" ? "✓ Signed" : ls.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                              <div>
                                <p className="text-gray-400 mb-0.5">ID Number</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>{s.id_number || "—"}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Campus</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>UJ {s.campus || "SWC"}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Lease Period</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>{fmtDate(s.start_date)} → {fmtDate(s.end_date)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Monthly Rate</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>{fmtRand(s.monthly_rent)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: fn.bg, color: fn.color, fontWeight: 700 }}>{fn.label}</span>
                              <span className="text-xs text-gray-500">{s.qualification || "—"}</span>
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 py-2 rounded-xl text-xs font-700 border border-gray-200 text-gray-600 flex items-center justify-center gap-1.5" style={{ fontWeight: 700 }}>
                                <Eye size={12} /> Preview Contract
                              </button>
                              <button className="flex-1 py-2 rounded-xl text-xs font-700 flex items-center justify-center gap-1.5" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                                <Download size={12} /> Download PDF
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── INVOICES ── */}
                {section === "invoices" && (
                  <div className="p-6 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Invoices</h2>
                        <p className="text-sm text-gray-400">{contractsSigned}/{totalStudents} generated · Academic Year Feb–Nov 2026</p>
                      </div>
                      <p className="text-xs font-700 px-3 py-1.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                        {selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-sm px-3 py-1.5 rounded-full font-700" style={{ background: "rgba(16,185,129,0.1)", color: GREEN, fontWeight: 700 }}>{contractsSigned} generated</span>
                      <span className="text-sm px-3 py-1.5 rounded-full font-700" style={{ background: "rgba(245,158,11,0.1)", color: AMBER, fontWeight: 700 }}>{totalStudents - contractsSigned} pending</span>
                      <span className="text-sm px-3 py-1.5 rounded-full font-700" style={{ background: "rgba(15,45,74,0.08)", color: NAVY, fontWeight: 700 }}>Total: {fmtRand(monthlyRevenue * 10)}</span>
                      <div className="flex-1" />
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-700" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                        <Receipt size={14} /> Generate All Invoices
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredStudents.map((s, idx) => {
                        const isReady = (s.lease_status || "").toLowerCase() === "active" || (s.lease_status || "").toLowerCase() === "signed";
                        const invoiceNum = `2026-Rm ${String(idx + 1).padStart(3, "0")}${String.fromCharCode(65 + (idx % 4))}`;
                        return (
                          <div key={s.user_id} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="font-700 text-gray-900 text-sm" style={{ fontWeight: 700 }}>{s.first_name} {s.last_name}</p>
                                <p className="text-xs text-gray-400">Student No: {s.student_number || "—"}</p>
                              </div>
                              <span className="text-xs px-2.5 py-1 rounded-full font-700" style={{ background: isReady ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: isReady ? GREEN : AMBER, fontWeight: 700 }}>
                                {isReady ? "✓ Ready" : "⏱ Pending"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                              <div>
                                <p className="text-gray-400 mb-0.5">Invoice #</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>{invoiceNum}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Description</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>Single Room Rent (Feb–Nov 2026)</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Monthly Rate</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>{fmtRand(s.monthly_rent)}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-0.5">Duration</p>
                                <p className="font-600 text-gray-700" style={{ fontWeight: 600 }}>10 months</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-400 mb-0.5">Total Amount</p>
                                <p className="font-800 text-sm" style={{ color: RED, fontWeight: 800 }}>{fmtRand(Number(s.monthly_rent || 0) * 10)}</p>
                              </div>
                            </div>
                            <div className="p-3 rounded-xl mb-4 text-xs" style={{ background: LIGHT }}>
                              <p className="font-700 text-gray-700 mb-1" style={{ fontWeight: 700 }}>Payment to:</p>
                              <p className="text-gray-500">{selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}</p>
                              <p className="text-gray-500">First National Bank · 62847291034</p>
                              <p className="text-gray-500">Branch: 250655</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="flex-1 py-2 rounded-xl text-xs font-700 border border-gray-200 text-gray-600 flex items-center justify-center gap-1.5" style={{ fontWeight: 700 }}>
                                <Eye size={12} /> Preview
                              </button>
                              <button className="flex-1 py-2 rounded-xl text-xs font-700 flex items-center justify-center gap-1.5" style={{ background: NAVY, color: "white", fontWeight: 700 }}>
                                <Download size={12} /> Download PDF
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SUBMIT TO UJ ── */}
                {section === "submit" && (
                  <div className="p-6 max-w-5xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Submit to UJ POSA</h2>
                        <p className="text-sm text-gray-400">{monthLabel(submissionMonth)} submission · Due 15 {monthLabel(submissionMonth)}</p>
                      </div>
                      <p className="text-xs font-700 px-3 py-1.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: TEAL, fontWeight: 700 }}>
                        {selectedProp?.posa_institution || "Siwedi & Associates PTY LTD"}
                      </p>
                    </div>

                    {/* Month selector */}
                    <div className="flex items-center gap-3 mb-6">
                      <label className="text-sm font-600 text-gray-600" style={{ fontWeight: 600 }}>Preparing submission for:</label>
                      <select
                        value={submissionMonth}
                        onChange={(e) => setSubmissionMonth(e.target.value)}
                        className="text-sm rounded-xl border border-gray-200 px-3 py-2 text-gray-700"
                      >
                        {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Checklist */}
                      <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                        <h3 className="font-700 text-gray-900 mb-5" style={{ fontWeight: 700 }}>Submission Checklist</h3>
                        <div className="space-y-3 mb-6">
                          {[
                            {
                              label: "Occupancy List",
                              sub: `Excel template with all student data in UJ POSA format\n${totalStudents} students · ${selectedProp?.posa_code || "XXXX"}_${monthLabel(submissionMonth).replace(" ", "_")}.xlsx`,
                              status: totalStudents > 0 ? "ready" : "pending",
                            },
                            {
                              label: "Student Contracts",
                              sub: `Signed lease agreements for all students\n${contractsSigned}/${totalStudents} contracts signed · View in Contracts section`,
                              status: contractsSigned < totalStudents ? "warning" : "ready",
                            },
                            {
                              label: "Invoices",
                              sub: `Per-student billing documents\n${contractsSigned}/${totalStudents} invoices generated`,
                              status: contractsSigned < totalStudents ? "warning" : "ready",
                            },
                            {
                              label: "NSFAS Verification",
                              sub: `Students cross-referenced against NSFAS funded list\n${nsfasVerified} verified · ${totalStudents - nsfasVerified} unverified`,
                              status: nsfasVerified < totalStudents ? "error" : "ready",
                            },
                            {
                              label: "Banking Details",
                              sub: "AP bank account details on file\nFirst National Bank · 62847291034",
                              status: "ready",
                            },
                          ].map((item) => {
                            const icon = item.status === "ready" ? CheckCircle : item.status === "warning" ? AlertTriangle : XCircle;
                            const color = item.status === "ready" ? GREEN : item.status === "warning" ? AMBER : RED;
                            const bg = item.status === "ready" ? "rgba(16,185,129,0.06)" : item.status === "warning" ? "rgba(245,158,11,0.06)" : "rgba(239,68,68,0.06)";
                            const border = item.status === "ready" ? "rgba(16,185,129,0.2)" : item.status === "warning" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)";
                            const Icon2 = icon;
                            const badge = item.status === "ready" ? "Ready" : item.status === "warning" ? "Incomplete" : "Action Required";
                            return (
                              <div key={item.label} className="flex items-start gap-4 p-4 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
                                <Icon2 size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-700 text-gray-900 text-sm" style={{ fontWeight: 700 }}>{item.label}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: `${color}18`, color, fontWeight: 700 }}>{badge}</span>
                                  </div>
                                  {item.sub.split("\n").map((line, i) => (
                                    <p key={i} className="text-xs text-gray-500">{line}</p>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Blocked message */}
                        {nsfasVerified < totalStudents && (
                          <div className="flex items-start gap-3 p-4 rounded-xl mb-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <XCircle size={16} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
                            <div>
                              <p className="font-700 text-sm" style={{ color: RED, fontWeight: 700 }}>Submission blocked — resolve errors first</p>
                              <p className="text-xs text-gray-500">Some students are not on the NSFAS funded list</p>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-700 border border-gray-200 text-gray-600" style={{ fontWeight: 700 }}>
                            <Download size={14} /> Download Package (.zip)
                          </button>
                          <button
                            onClick={downloadPosaCsv}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-700"
                            style={{ background: nsfasVerified < totalStudents ? "#D1D5DB" : NAVY, color: "white", fontWeight: 700, cursor: nsfasVerified < totalStudents ? "not-allowed" : "pointer" }}
                            disabled={nsfasVerified < totalStudents}
                          >
                            <Send size={14} /> Prepare Submission Package <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Summary + past submissions */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <h4 className="font-700 text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>{monthLabel(submissionMonth)} Summary</h4>
                          {[
                            { label: "Property", value: selectedProp?.title || "—" },
                            { label: "POSA Code", value: selectedProp?.posa_code || "—" },
                            { label: "Students", value: String(totalStudents) },
                            { label: "Monthly Amount", value: fmtRand(monthlyRevenue) },
                            { label: "Annual Total", value: fmtRand(monthlyRevenue * 10) },
                            { label: "Deadline", value: `15 ${monthLabel(submissionMonth)}` },
                            { label: "Submit to", value: "posadocuments@uj.ac.za" },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                              <p className="text-xs text-gray-400">{row.label}</p>
                              <p className="text-xs font-700 text-gray-700" style={{ fontWeight: 700 }}>{row.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <h4 className="font-700 text-gray-900 mb-4 text-sm" style={{ fontWeight: 700 }}>Past Submissions</h4>
                          {[
                            { month: "February", status: "submitted", amount: "R26k" },
                            { month: "March", status: "submitted", amount: "R26k" },
                            { month: "April", status: "overdue", amount: null },
                            { month: "May", status: "pending", amount: null },
                          ].map((s) => (
                            <div key={s.month} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                              <p className="text-xs font-600 text-gray-700" style={{ fontWeight: 600 }}>{s.month}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{
                                background: s.status === "submitted" ? "rgba(16,185,129,0.1)" : s.status === "overdue" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                                color: s.status === "submitted" ? GREEN : s.status === "overdue" ? RED : AMBER,
                                fontWeight: 700,
                              }}>
                                {s.status === "submitted" ? s.amount : s.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(15,45,74,0.07)" }}>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(26,155,173,0.1)" }}>
                              <span className="text-xs" style={{ color: TEAL }}>i</span>
                            </div>
                            <div>
                              <p className="text-xs font-700 text-gray-700 mb-1" style={{ fontWeight: 700 }}>Fundi System</p>
                              <p className="text-xs text-gray-500 leading-relaxed">UJ processes payments through the Fundi system. Ensure your banking details are registered with UJ POSA before submitting. Contact the UJ POSA office if you need to update your banking details.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              {section === "applications" && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-800 text-gray-900" style={{ fontWeight: 800 }}>Applications</h2>
                      <p className="text-sm text-gray-400">{applications.length} application{applications.length !== 1 ? 's' : ''} received</p>
                    </div>
                    <button onClick={fetchApplications} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-600 border border-gray-200 text-gray-600" style={{ fontWeight: 600 }}>
                      <RefreshCw size={13} /> Refresh
                    </button>
                  </div>
                  {appsLoading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin" style={{ color: TEAL }} /></div>
                  ) : applications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ClipboardList size={40} style={{ color: '#D1D5DB' }} className="mb-3" />
                      <p className="text-gray-400 text-sm">No applications yet</p>
                      <p className="text-gray-300 text-xs mt-1">Applications from students will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app: any) => {
                        const appId = app.application_id || app.id;
                        const status = app.status || 'SUBMITTED';
                        const kycVerified = app.kyc_status === 'VERIFIED' || app.kyc_status === 'APPROVED';
                        const nsfasConfirmed = status === 'PENDING_NSFAS' || status === 'APPROVED' || status === 'LEASE_SIGNED';

                        // Workflow steps
                        const steps = [
                          { key: 'SUBMITTED', label: 'Submitted' },
                          { key: 'PENDING_NSFAS', label: 'NSFAS Check' },
                          { key: 'APPROVED', label: 'Approved' },
                        ];
                        const stepIndex = steps.findIndex(s => s.key === status);
                        const isRejected = status === 'REJECTED';
                        const isApproved = status === 'APPROVED' || status === 'LEASE_SIGNED';

                        // Status badge colour
                        const statusColor = isApproved ? GREEN : isRejected ? RED : status === 'SUBMITTED' ? TEAL : AMBER;
                        const statusBg = isApproved ? 'rgba(16,185,129,0.1)' : isRejected ? 'rgba(239,68,68,0.1)' : status === 'SUBMITTED' ? 'rgba(26,155,173,0.1)' : 'rgba(245,158,11,0.1)';
                        const statusLabel = status === 'PENDING_NSFAS' ? 'NSFAS Check' : status === 'LEASE_SIGNED' ? 'Lease Signed' : status;

                        return (
                          <div key={appId} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 12px rgba(15,45,74,0.07)' }}>
                            {/* Header row */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${NAVY}12` }}>
                                <span className="text-sm font-700" style={{ color: NAVY, fontWeight: 700 }}>{(app.first_name || 'S')[0]}{(app.last_name || '')[0]}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-700 text-gray-900" style={{ fontWeight: 700 }}>{app.first_name} {app.last_name}</p>
                                <p className="text-xs text-gray-400 truncate">{app.student_email || app.email}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{app.property_title || app.property_name || 'Property'}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs px-2.5 py-1 rounded-full font-700" style={{ background: statusBg, color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
                                <p className="text-xs text-gray-300 mt-1">{app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-ZA') : ''}</p>
                              </div>
                            </div>

                            {/* KYC + NSFAS indicators */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-600" style={{ background: kycVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: kycVerified ? GREEN : AMBER, fontWeight: 600 }}>
                                {kycVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                                KYC {kycVerified ? 'Verified' : 'Pending'}
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-600" style={{ background: nsfasConfirmed ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: nsfasConfirmed ? GREEN : AMBER, fontWeight: 600 }}>
                                {nsfasConfirmed ? <CheckCircle size={12} /> : <Clock size={12} />}
                                NSFAS {nsfasConfirmed ? 'Confirmed' : 'Pending'}
                              </div>
                              {app.provider_notes && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(15,45,74,0.06)', color: NAVY }}>
                                  <FileText size={12} /> {app.provider_notes}
                                </div>
                              )}
                            </div>

                            {/* Workflow progress bar */}
                            {!isRejected && (
                              <div className="flex items-center gap-1 mb-4">
                                {steps.map((step, i) => {
                                  const done = i < stepIndex || isApproved;
                                  const active = i === stepIndex && !isApproved;
                                  return (
                                    <div key={step.key} className="flex items-center gap-1 flex-1">
                                      <div className="flex flex-col items-center flex-1">
                                        <div className="w-full h-1.5 rounded-full" style={{ background: done || active ? TEAL : '#E5E7EB' }} />
                                        <span className="text-xs mt-1" style={{ color: done || active ? TEAL : '#9CA3AF', fontWeight: done || active ? 600 : 400 }}>{step.label}</span>
                                      </div>
                                      {i < steps.length - 1 && <div className="w-2 h-1.5 rounded-full flex-shrink-0" style={{ background: done ? TEAL : '#E5E7EB' }} />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Action buttons */}
                            {!isRejected && !isApproved && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                {status === 'SUBMITTED' && (
                                  <button
                                    onClick={() => updateApplicationStatus(appId, 'PENDING_NSFAS')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                                    style={{ background: `${AMBER}18`, color: AMBER, fontWeight: 600 }}
                                  >
                                    <BadgeCheck size={13} /> Confirm NSFAS
                                  </button>
                                )}
                                {status === 'PENDING_NSFAS' && (
                                  <button
                                    onClick={() => updateApplicationStatus(appId, 'APPROVED')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                                    style={{ background: `${GREEN}18`, color: GREEN, fontWeight: 600 }}
                                  >
                                    <CheckCircle size={13} /> Approve
                                  </button>
                                )}
                                <button
                                  onClick={() => updateApplicationStatus(appId, 'REJECTED', 'Rejected by provider')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                                  style={{ background: `${RED}12`, color: RED, fontWeight: 600 }}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            )}
                            {isApproved && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => updateApplicationStatus(appId, 'LEASE_SIGNED')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                                  style={{ background: `${NAVY}12`, color: NAVY, fontWeight: 600 }}
                                >
                                  <FileText size={13} /> Mark Lease Signed
                                </button>
                              </div>
                            )}
                            {isRejected && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button
                                  onClick={() => updateApplicationStatus(appId, 'SUBMITTED')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                                  style={{ background: `${TEAL}12`, color: TEAL, fontWeight: 600 }}
                                >
                                  <RefreshCw size={13} /> Reopen
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
