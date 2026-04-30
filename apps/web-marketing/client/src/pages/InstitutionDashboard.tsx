import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/lib/api";
import {
  Building2, Users, Home, ShieldCheck, TrendingUp, Search,
  Download, RefreshCw, CheckCircle, Clock, XCircle, AlertTriangle,
  FileText, BarChart2, BookOpen, ChevronDown, Loader2,
  GraduationCap, BadgeCheck, Bell, Eye, Filter,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "";
const NAVY = "#0F2D4A";
const TEAL = "#1A9BAD";
const GREEN = "#10B981";
const AMBER = "#F59E0B";
const RED = "#EF4444";
const PURPLE = "#8B5CF6";
const LIGHT = "#F5F7FA";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Overview {
  students: number;
  providers: number;
  new_students_month: number;
  kyc_verified_students: number;
  active_properties: number;
  nsfas_properties: number;
}

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  kyc_status: string;
  created_at: string;
  student_number?: string;
  institution_name?: string;
  nsfas_status?: string;
  id_number?: string;
  property_title?: string;
  city?: string;
  province?: string;
  has_lease?: boolean;
}

interface Provider {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  kyc_status: string;
  created_at: string;
  property_count: number;
  nsfas_count: number;
  active_count: number;
}

type Section = "overview" | "students" | "providers" | "reports";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kycBadge(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "VERIFIED") return { bg: "rgba(16,185,129,0.12)", color: GREEN, icon: CheckCircle, label: "Verified" };
  if (s === "PENDING") return { bg: "rgba(245,158,11,0.12)", color: AMBER, icon: Clock, label: "Pending" };
  if (s === "REJECTED") return { bg: "rgba(239,68,68,0.12)", color: RED, icon: XCircle, label: "Rejected" };
  return { bg: "#F3F4F6", color: "#6B7280", icon: AlertTriangle, label: status || "—" };
}

function nsfasBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("verified") || s.includes("approved")) return { bg: "rgba(16,185,129,0.12)", color: GREEN, label: "NSFAS Verified" };
  if (s.includes("pending")) return { bg: "rgba(245,158,11,0.12)", color: AMBER, label: "Pending" };
  if (s.includes("not") || s.includes("rejected")) return { bg: "rgba(239,68,68,0.12)", color: RED, label: "Not Listed" };
  return { bg: "#F3F4F6", color: "#6B7280", label: status || "—" };
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: NAVY, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 2, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InstitutionDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const LIMIT = 20;

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) { navigate("/"); return; }
    if (user.role !== "INSTITUTION" && user.role !== "ADMIN") { navigate("/"); return; }
  }, [isAuthenticated, user]);

  const token = getStoredToken();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Fetch overview
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/institutions/dashboard/overview`, { headers });
      if (!res.ok) throw new Error("Failed to load overview");
      setOverview(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      const offset = (page - 1) * LIMIT;
      const q = new URLSearchParams({ limit: String(LIMIT), offset: String(offset), ...(search ? { search } : {}) });
      const res = await fetch(`${API}/api/v1/institutions/dashboard/students?${q}`, { headers });
      if (!res.ok) throw new Error("Failed to load students");
      const data = await res.json();
      setStudents(data.students || []);
      setStudentTotal(data.total || 0);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/institutions/dashboard/providers`, { headers });
      if (!res.ok) throw new Error("Failed to load providers");
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  // Load data on section change
  useEffect(() => {
    if (!isAuthenticated) return;
    if (section === "overview") fetchOverview();
    if (section === "students") fetchStudents(1, "");
    if (section === "providers") fetchProviders();
  }, [section, isAuthenticated]);

  // Student search
  useEffect(() => {
    if (section !== "students") return;
    const t = setTimeout(() => { setStudentPage(1); fetchStudents(1, studentSearch); }, 400);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // DHET CSV export
  const exportStudentsCsv = () => {
    const header = ["Name", "Email", "Student Number", "Institution", "NSFAS Status", "KYC Status", "Property", "City", "Province", "Registered"];
    const rows = students.map(s => [
      `${s.first_name} ${s.last_name}`,
      s.email,
      s.student_number || "",
      s.institution_name || "",
      s.nsfas_status || "",
      s.kyc_status,
      s.property_title || "",
      s.city || "",
      s.province || "",
      fmtDate(s.created_at),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `digzio_student_registry_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  const exportProvidersCsv = () => {
    const header = ["Provider", "Email", "KYC Status", "Total Properties", "NSFAS Properties", "Active Properties", "Joined"];
    const rows = providers.map(p => [
      `${p.first_name} ${p.last_name}`,
      p.email,
      p.kyc_status,
      p.property_count,
      p.nsfas_count,
      p.active_count,
      fmtDate(p.created_at),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `digzio_provider_compliance_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (!isAuthenticated || !user) return null;

  const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "students", label: "Student Registry", icon: GraduationCap },
    { id: "providers", label: "Provider Compliance", icon: ShieldCheck },
    { id: "reports", label: "DHET Reports", icon: FileText },
  ];

  const totalPages = Math.ceil(studentTotal / LIMIT);

  return (
    <div style={{ minHeight: "100vh", background: LIGHT, fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>Institution Dashboard</div>
            <div style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}>
              Welcome, {user.first_name} {user.last_name} &mdash; {user.email}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { if (section === "overview") fetchOverview(); if (section === "students") fetchStudents(studentPage, studentSearch); if (section === "providers") fetchProviders(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: `1px solid #E5E7EB`, background: "#fff", color: NAVY, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 6, marginBottom: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexWrap: "wrap" }}>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: section === id ? `linear-gradient(135deg, ${NAVY}, ${TEAL})` : "transparent",
                color: section === id ? "#fff" : "#6B7280",
                fontWeight: section === id ? 600 : 400, fontSize: 14, transition: "all 0.15s",
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: RED, fontSize: 14, marginBottom: 20 }}>
            {error} <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", color: RED, cursor: "pointer", fontWeight: 600 }}>✕</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={32} color={TEAL} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {!loading && section === "overview" && overview && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
              <StatCard icon={GraduationCap} label="Registered Students" value={overview.students} sub={`+${overview.new_students_month} this month`} color={TEAL} />
              <StatCard icon={BadgeCheck} label="KYC Verified Students" value={overview.kyc_verified_students} sub={`${overview.students > 0 ? Math.round((overview.kyc_verified_students / overview.students) * 100) : 0}% verified`} color={GREEN} />
              <StatCard icon={Building2} label="Active Providers" value={overview.providers} color={NAVY} />
              <StatCard icon={Home} label="Active Listings" value={overview.active_properties.toLocaleString()} color={PURPLE} />
              <StatCard icon={ShieldCheck} label="NSFAS-Accredited" value={overview.nsfas_properties.toLocaleString()} sub={`${overview.active_properties > 0 ? Math.round((overview.nsfas_properties / overview.active_properties) * 100) : 0}% of listings`} color={AMBER} />
            </div>

            {/* Compliance summary */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Platform Compliance Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "Student Registry", value: `${overview.students} students`, status: "ACTIVE", color: GREEN },
                  { label: "Provider Network", value: `${overview.providers} providers`, status: "ACTIVE", color: GREEN },
                  { label: "NSFAS Accreditation", value: `${overview.nsfas_properties} properties`, status: overview.nsfas_properties > 0 ? "ACTIVE" : "PENDING", color: overview.nsfas_properties > 0 ? GREEN : AMBER },
                  { label: "KYC Verification", value: `${overview.kyc_verified_students}/${overview.students} students`, status: overview.kyc_verified_students === overview.students ? "COMPLETE" : "IN PROGRESS", color: overview.kyc_verified_students === overview.students ? GREEN : AMBER },
                ].map(item => (
                  <div key={item.label} style={{ background: LIGHT, borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{item.value}</div>
                    <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, background: `${item.color}18`, borderRadius: 20, padding: "2px 10px" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Quick Actions</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { label: "View Student Registry", icon: GraduationCap, action: () => setSection("students"), color: TEAL },
                  { label: "Provider Compliance", icon: ShieldCheck, action: () => setSection("providers"), color: NAVY },
                  { label: "Generate DHET Report", icon: FileText, action: () => setSection("reports"), color: PURPLE },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, border: "none", background: `${btn.color}12`, color: btn.color, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    <btn.icon size={16} /> {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENT REGISTRY ── */}
        {!loading && section === "students" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Student Registry &mdash; {studentTotal} students</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                  <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search name, email, student no..."
                    style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13, outline: "none", width: 240 }} />
                </div>
                <button onClick={exportStudentsCsv}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: `${TEAL}15`, color: TEAL, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: LIGHT, borderBottom: "1px solid #E5E7EB" }}>
                      {["Student", "Student No.", "Institution", "NSFAS Status", "KYC", "Property", "Registered"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#9CA3AF" }}>No students found</td></tr>
                    )}
                    {students.map((s, i) => {
                      const kyc = kycBadge(s.kyc_status);
                      const nsfas = nsfasBadge(s.nsfas_status);
                      const KycIcon = kyc.icon;
                      return (
                        <tr key={s.user_id} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: NAVY }}>{s.first_name} {s.last_name}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#374151" }}>{s.student_number || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                          <td style={{ padding: "12px 16px", color: "#374151" }}>{s.institution_name || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: nsfas.bg, color: nsfas.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{nsfas.label}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: kyc.bg, color: kyc.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              <KycIcon size={10} /> {kyc.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {s.property_title
                              ? <div><div style={{ color: NAVY, fontWeight: 500 }}>{s.property_title}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{s.city}, {s.province}</div></div>
                              : <span style={{ color: "#D1D5DB" }}>No lease</span>}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>
                    Showing {(studentPage - 1) * LIMIT + 1}–{Math.min(studentPage * LIMIT, studentTotal)} of {studentTotal}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button disabled={studentPage === 1} onClick={() => { setStudentPage(p => p - 1); fetchStudents(studentPage - 1, studentSearch); }}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E7EB", background: studentPage === 1 ? "#F9FAFB" : "#fff", color: studentPage === 1 ? "#D1D5DB" : NAVY, cursor: studentPage === 1 ? "default" : "pointer", fontSize: 13 }}>
                      Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => { setStudentPage(p); fetchStudents(p, studentSearch); }}
                        style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: studentPage === p ? `linear-gradient(135deg, ${NAVY}, ${TEAL})` : "#F3F4F6", color: studentPage === p ? "#fff" : NAVY, cursor: "pointer", fontSize: 13, fontWeight: studentPage === p ? 600 : 400 }}>
                        {p}
                      </button>
                    ))}
                    <button disabled={studentPage === totalPages} onClick={() => { setStudentPage(p => p + 1); fetchStudents(studentPage + 1, studentSearch); }}
                      style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E7EB", background: studentPage === totalPages ? "#F9FAFB" : "#fff", color: studentPage === totalPages ? "#D1D5DB" : NAVY, cursor: studentPage === totalPages ? "default" : "pointer", fontSize: 13 }}>
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PROVIDER COMPLIANCE ── */}
        {!loading && section === "providers" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Provider Compliance &mdash; {providers.length} providers</div>
              <button onClick={exportProvidersCsv}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: `${TEAL}15`, color: TEAL, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: LIGHT, borderBottom: "1px solid #E5E7EB" }}>
                      {["Provider", "KYC Status", "Total Listings", "NSFAS Accredited", "Active Listings", "Compliance Score", "Joined"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providers.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#9CA3AF" }}>No providers found</td></tr>
                    )}
                    {providers.map((p, i) => {
                      const kyc = kycBadge(p.kyc_status);
                      const KycIcon = kyc.icon;
                      const total = Number(p.property_count);
                      const nsfas = Number(p.nsfas_count);
                      const active = Number(p.active_count);
                      const score = total > 0 ? Math.round((active / total) * 100) : 0;
                      const scoreColor = score >= 80 ? GREEN : score >= 50 ? AMBER : RED;
                      return (
                        <tr key={p.user_id} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, color: NAVY }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.email}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: kyc.bg, color: kyc.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              <KycIcon size={10} /> {kyc.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: NAVY, fontWeight: 600 }}>{total}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: nsfas > 0 ? "rgba(16,185,129,0.12)" : "#F3F4F6", color: nsfas > 0 ? GREEN : "#9CA3AF", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                              {nsfas} {nsfas > 0 ? "✓" : "—"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#374151" }}>{active}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden", minWidth: 60 }}>
                                <div style={{ width: `${score}%`, height: "100%", background: scoreColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor, minWidth: 36 }}>{score}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DHET REPORTS ── */}
        {!loading && section === "reports" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>DHET Compliance Reports</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                {
                  title: "Student Housing Registry",
                  desc: "Full list of registered students with housing status, NSFAS verification, and lease information. DHET-ready format.",
                  icon: GraduationCap, color: TEAL,
                  action: () => { setSection("students"); setTimeout(exportStudentsCsv, 300); },
                  label: "Generate CSV",
                },
                {
                  title: "Provider Compliance Report",
                  desc: "All verified providers with property counts, NSFAS accreditation status, and compliance scores.",
                  icon: ShieldCheck, color: NAVY,
                  action: () => { setSection("providers"); setTimeout(exportProvidersCsv, 300); },
                  label: "Generate CSV",
                },
                {
                  title: "NSFAS Accredited Listings",
                  desc: "All NSFAS-accredited properties on the platform with provider details and availability.",
                  icon: BadgeCheck, color: GREEN,
                  action: () => window.open("/search?nsfas=true", "_blank"),
                  label: "View Listings",
                },
                {
                  title: "Platform Statistics",
                  desc: "High-level platform metrics: total students, providers, properties, and NSFAS compliance rate.",
                  icon: BarChart2, color: PURPLE,
                  action: () => setSection("overview"),
                  label: "View Dashboard",
                },
              ].map(card => (
                <div key={card.title} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <card.icon size={20} color={card.color} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{card.title}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 16 }}>{card.desc}</div>
                  <button onClick={card.action}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${NAVY}, ${TEAL})`, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                    <Download size={14} /> {card.label}
                  </button>
                </div>
              ))}
            </div>

            {/* DHET compliance note */}
            <div style={{ background: "rgba(26,155,173,0.06)", border: "1px solid rgba(26,155,173,0.2)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <ShieldCheck size={20} color={TEAL} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>DHET Compliance Note</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                    Under the <strong>Department of Higher Education and Training (DHET)</strong> regulations, universities are required to ensure that NSFAS-funded students reside in accredited, safe accommodation. All data exported from this dashboard is formatted to meet DHET submission requirements. Reports include student registration numbers, NSFAS verification status, property accreditation codes, and lease information as required by the <em>Policy on the Minimum Norms and Standards for Student Housing at Public Universities</em>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
