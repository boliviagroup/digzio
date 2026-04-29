import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/lib/api";
import {
  Users, Home, FileText, Building2, TrendingUp, Shield,
  CheckCircle, Clock, XCircle, RefreshCw, ChevronDown, ChevronUp,
  GraduationCap, Briefcase, Landmark, BarChart3, AlertCircle,
  AlertTriangle, MapPin, Calendar, ChevronRight, X
} from "lucide-react";

const API = "/api/v1";

interface UserStats {
  students: string; providers: string; institutions: string;
  total_users: string; kyc_verified: string; kyc_pending: string;
  new_this_week: string; new_this_month: string;
}

interface User {
  user_id: string; email: string; role: string;
  first_name: string; last_name: string;
  kyc_status: string; is_active: boolean; created_at: string;
}

interface Property {
  property_id: string; title: string; city: string; province: string;
  property_type: string; total_beds: number; available_beds: number;
  base_price_monthly: number; status: string; is_nsfas_accredited: boolean;
  created_at: string;
}

interface Institution {
  institution_id: string; name: string; contact_email: string;
  is_active: boolean; created_at: string;
}

const roleBadge = (role: string) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    STUDENT: { bg: "rgba(26,155,173,0.1)", color: "#1A9BAD", label: "Student" },
    PROVIDER: { bg: "rgba(245,166,35,0.1)", color: "#F5A623", label: "Provider" },
    INSTITUTION: { bg: "rgba(46,204,113,0.1)", color: "#2ECC71", label: "Institution" },
    ADMIN: { bg: "rgba(15,45,74,0.1)", color: "#0F2D4A", label: "Admin" },
  };
  const s = map[role] || { bg: "#F3F4F6", color: "#6B7280", label: role };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  );
};

const kycBadge = (status: string) => {
  if (status === "VERIFIED") return <span className="flex items-center gap-1 text-xs" style={{ color: "#2ECC71" }}><CheckCircle size={12} /> Verified</span>;
  if (status === "PENDING") return <span className="flex items-center gap-1 text-xs" style={{ color: "#F5A623" }}><Clock size={12} /> Pending</span>;
  return <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}><XCircle size={12} /> {status || "None"}</span>;
};

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: "rgba(46,204,113,0.1)", color: "#2ECC71" },
    DRAFT: { bg: "rgba(156,163,175,0.15)", color: "#6B7280" },
    INACTIVE: { bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  };
  const s = map[status] || { bg: "#F3F4F6", color: "#6B7280" };
  return <span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: s.bg, color: s.color, fontWeight: 600 }}>{status}</span>;
};

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "providers" | "institutions" | "properties" | "incidents">("overview");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = getStoredToken();

  const fetchIncidents = async () => {
    setIncidentsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [mapRes, statsRes] = await Promise.all([
        fetch(`${API}/incidents/map`, { headers }),
        fetch(`${API}/incidents/stats`, { headers }),
      ]);
      if (mapRes.ok) {
        const geojson = await mapRes.json();
        setIncidents(geojson.features?.map((f: any) => ({ ...f.properties, latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] })) || []);
      }
      if (statsRes.ok) setIncidentStats(await statsRes.json());
    } catch {}
    finally { setIncidentsLoading(false); }
  };

  const updateIncidentStatus = async (id: string, status: string, note?: string) => {
    setStatusUpdating(id);
    try {
      const res = await fetch(`${API}/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        await fetchIncidents();
        if (selectedIncident?.incident_id === id) {
          setSelectedIncident((prev: any) => prev ? { ...prev, status } : null);
        }
      }
    } catch {}
    finally { setStatusUpdating(null); }
  };

  const fetchAll = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const [statsRes, usersRes, propsRes, instRes] = await Promise.all([
        fetch(`${API}/auth/admin/stats`, { headers }),
        fetch(`${API}/auth/admin/users?limit=200`, { headers }),
        fetch(`${API}/properties?limit=200`),
        fetch(`${API}/institutions`),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) { const d = await usersRes.json(); setUsers(d.users || []); }
      if (propsRes.ok) { const d = await propsRes.json(); setProperties(d.properties || []); }
      if (instRes.ok) { const d = await instRes.json(); setInstitutions(d.institutions || d || []); }
    } catch (e: any) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    fetchAll();
    fetchIncidents();
  }, [isAuthenticated]);

  const students = users.filter(u => u.role === "STUDENT");
  const providers = users.filter(u => u.role === "PROVIDER");
  const instUsers = users.filter(u => u.role === "INSTITUTION");

  const cardStyle = { background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(15,45,74,0.07)", padding: "1.5rem" };
  const tabStyle = (active: boolean) => ({
    padding: "0.6rem 1.25rem", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
    background: active ? "#0F2D4A" : "transparent",
    color: active ? "#fff" : "#6B7280",
    border: "none", transition: "all 0.15s",
  });

  const tableHead = { color: "#9CA3AF", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "0.75rem 1rem", borderBottom: "1px solid #F3F4F6" };
  const tableCell = { padding: "0.875rem 1rem", fontSize: 13, color: "#374151", borderBottom: "1px solid #F9FAFB" };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="text-center">
        <RefreshCw size={32} className="animate-spin mx-auto mb-3" style={{ color: "#1A9BAD" }} />
        <p style={{ color: "#6B7280" }}>Loading admin dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8 px-4" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.1)" }}>
              <BarChart3 size={13} style={{ color: "#1A9BAD" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>Digzio Operations</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-800 text-white" style={{ fontWeight: 800 }}>Admin Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>Full platform overview — students, providers, institutions & properties</p>
          </div>
          <button onClick={fetchAll} disabled={refreshing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-600" style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", fontWeight: 600 }}>
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={16} style={{ color: "#EF4444" }} />
            <p className="text-sm" style={{ color: "#374151" }}>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats?.total_users || users.length, icon: Users, color: "#0F2D4A", bg: "rgba(15,45,74,0.08)" },
            { label: "Students", value: stats?.students || students.length, icon: GraduationCap, color: "#1A9BAD", bg: "rgba(26,155,173,0.08)" },
            { label: "Providers", value: stats?.providers || providers.length, icon: Briefcase, color: "#F5A623", bg: "rgba(245,166,35,0.08)" },
            { label: "Institutions", value: stats?.institutions || instUsers.length, icon: Landmark, color: "#2ECC71", bg: "rgba(46,204,113,0.08)" },
            { label: "Properties", value: properties.length, icon: Home, color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
            { label: "Active Properties", value: properties.filter(p => p.status === "ACTIVE").length, icon: CheckCircle, color: "#2ECC71", bg: "rgba(46,204,113,0.08)" },
            { label: "KYC Verified", value: stats?.kyc_verified || 0, icon: Shield, color: "#1A9BAD", bg: "rgba(26,155,173,0.08)" },
            { label: "New This Week", value: stats?.new_this_week || 0, icon: TrendingUp, color: "#F5A623", bg: "rgba(245,166,35,0.08)" },
          ].map((s, i) => (
            <div key={i} style={cardStyle}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-800" style={{ color: "#0F2D4A", fontWeight: 800 }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-xl" style={{ background: "#F3F4F6" }}>
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "students", label: `Students (${students.length})`, icon: GraduationCap },
            { key: "providers", label: `Providers (${providers.length})`, icon: Briefcase },
            { key: "institutions", label: `Institutions (${institutions.length})`, icon: Landmark },
            { key: "properties", label: `Properties (${properties.length})`, icon: Home },
            { key: "incidents", label: `Incidents (${incidents.length})`, icon: AlertTriangle },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={tabStyle(activeTab === t.key)} className="flex items-center gap-1.5">
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recent Users */}
            <div className="md:col-span-2" style={cardStyle}>
              <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>Recent Registrations</h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={tableHead}>Name</th>
                    <th style={tableHead}>Email</th>
                    <th style={tableHead}>Role</th>
                    <th style={tableHead}>KYC</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map(u => (
                    <tr key={u.user_id}>
                      <td style={tableCell}>{u.first_name} {u.last_name}</td>
                      <td style={{ ...tableCell, color: "#6B7280" }}>{u.email}</td>
                      <td style={tableCell}>{roleBadge(u.role)}</td>
                      <td style={tableCell}>{kycBadge(u.kyc_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Property Summary */}
            <div style={cardStyle}>
              <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>Property Status</h3>
              {["ACTIVE", "DRAFT", "INACTIVE"].map(s => {
                const count = properties.filter(p => p.status === s).length;
                const pct = properties.length ? Math.round((count / properties.length) * 100) : 0;
                const colors: Record<string, string> = { ACTIVE: "#2ECC71", DRAFT: "#9CA3AF", INACTIVE: "#EF4444" };
                return (
                  <div key={s} className="mb-4">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-600" style={{ color: "#374151", fontWeight: 600 }}>{s}</span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{count} ({pct}%)</span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ background: "#F3F4F6" }}>
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: colors[s] }} />
                    </div>
                  </div>
                );
              })}
              <div className="mt-6">
                <h4 className="text-xs font-700 mb-3" style={{ color: "#0F2D4A", fontWeight: 700 }}>NSFAS Accredited</h4>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-800" style={{ color: "#1A9BAD", fontWeight: 800 }}>
                    {properties.filter(p => p.is_nsfas_accredited).length}
                  </div>
                  <div className="text-xs" style={{ color: "#9CA3AF" }}>of {properties.length} properties</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div style={cardStyle}>
            <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>All Students ({students.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={tableHead}>Name</th>
                    <th style={tableHead}>Email</th>
                    <th style={tableHead}>KYC Status</th>
                    <th style={tableHead}>Active</th>
                    <th style={tableHead}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(u => (
                    <tr key={u.user_id}>
                      <td style={tableCell}>{u.first_name} {u.last_name}</td>
                      <td style={{ ...tableCell, color: "#6B7280" }}>{u.email}</td>
                      <td style={tableCell}>{kycBadge(u.kyc_status)}</td>
                      <td style={tableCell}>{u.is_active ? <CheckCircle size={14} style={{ color: "#2ECC71" }} /> : <XCircle size={14} style={{ color: "#EF4444" }} />}</td>
                      <td style={{ ...tableCell, color: "#9CA3AF" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === "providers" && (
          <div style={cardStyle}>
            <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>All Providers ({providers.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={tableHead}>Name</th>
                    <th style={tableHead}>Email</th>
                    <th style={tableHead}>Properties</th>
                    <th style={tableHead}>Active</th>
                    <th style={tableHead}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(u => {
                    const provProps = properties.filter(p => (p as any).provider_id === u.user_id);
                    return (
                      <tr key={u.user_id}>
                        <td style={tableCell}>{u.first_name} {u.last_name}</td>
                        <td style={{ ...tableCell, color: "#6B7280" }}>{u.email}</td>
                        <td style={tableCell}><span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: "rgba(245,166,35,0.1)", color: "#F5A623", fontWeight: 600 }}>{provProps.length || "—"}</span></td>
                        <td style={tableCell}>{u.is_active ? <CheckCircle size={14} style={{ color: "#2ECC71" }} /> : <XCircle size={14} style={{ color: "#EF4444" }} />}</td>
                        <td style={{ ...tableCell, color: "#9CA3AF" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Institutions Tab */}
        {activeTab === "institutions" && (
          <div style={cardStyle}>
            <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>All Institutions ({institutions.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={tableHead}>Institution Name</th>
                    <th style={tableHead}>Contact Email</th>
                    <th style={tableHead}>Status</th>
                    <th style={tableHead}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(inst => (
                    <tr key={inst.institution_id}>
                      <td style={tableCell}>{inst.name}</td>
                      <td style={{ ...tableCell, color: "#6B7280" }}>{inst.contact_email}</td>
                      <td style={tableCell}>{inst.is_active ? <span className="flex items-center gap-1 text-xs" style={{ color: "#2ECC71" }}><CheckCircle size={12} /> Active</span> : <span className="flex items-center gap-1 text-xs" style={{ color: "#EF4444" }}><XCircle size={12} /> Inactive</span>}</td>
                      <td style={{ ...tableCell, color: "#9CA3AF" }}>{new Date(inst.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div style={cardStyle}>
            <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>All Properties ({properties.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full">
                <thead>
                  <tr>
                    <th style={tableHead}>Title</th>
                    <th style={tableHead}>Location</th>
                    <th style={tableHead}>Type</th>
                    <th style={tableHead}>Beds</th>
                    <th style={tableHead}>Rent</th>
                    <th style={tableHead}>Status</th>
                    <th style={tableHead}>NSFAS</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.property_id}>
                      <td style={tableCell}>{p.title}</td>
                      <td style={{ ...tableCell, color: "#6B7280" }}>{p.city}, {p.province}</td>
                      <td style={{ ...tableCell, color: "#6B7280" }}>{p.property_type}</td>
                      <td style={tableCell}>{p.available_beds}/{p.total_beds}</td>
                      <td style={tableCell}>R{Number(p.base_price_monthly).toLocaleString()}</td>
                      <td style={tableCell}>{statusBadge(p.status)}</td>
                      <td style={tableCell}>{p.is_nsfas_accredited ? <CheckCircle size={14} style={{ color: "#2ECC71" }} /> : <XCircle size={14} style={{ color: "#9CA3AF" }} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Incidents Tab */}
        {activeTab === "incidents" && (
          <div>
            {/* Incident Stats */}
            {incidentStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Open", value: incidentStats.summary?.open_count || 0, color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
                  { label: "In Progress", value: incidentStats.summary?.in_progress_count || 0, color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
                  { label: "Resolved", value: incidentStats.summary?.resolved_count || 0, color: "#10B981", bg: "rgba(16,185,129,0.08)" },
                  { label: "Critical", value: incidentStats.summary?.critical_count || 0, color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
                ].map(s => (
                  <div key={s.label} style={cardStyle}>
                    <p className="text-2xl font-800" style={{ color: s.color, fontWeight: 800 }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Panel */}
              <div className="lg:col-span-2" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>Incident Map — South Africa</h3>
                  <button onClick={fetchIncidents} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(15,45,74,0.06)", color: "#6B7280" }}>
                    <RefreshCw size={11} className={incidentsLoading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>
                {/* SVG Map of South Africa with incident dots */}
                <div className="relative rounded-xl overflow-hidden" style={{ background: "#E8F4F8", minHeight: 380 }}>
                  <svg viewBox="0 0 800 600" className="w-full" style={{ display: "block" }}>
                    {/* South Africa outline (simplified) */}
                    <path d="M 150 120 L 200 100 L 280 90 L 380 85 L 480 95 L 560 110 L 620 140 L 660 180 L 680 230 L 670 290 L 640 340 L 600 380 L 560 410 L 520 440 L 480 460 L 440 480 L 400 490 L 360 485 L 320 470 L 280 450 L 240 420 L 200 380 L 170 340 L 150 300 L 140 260 L 140 200 Z" fill="#C8E6C9" stroke="#81C784" strokeWidth="2" />
                    {/* City labels */}
                    <text x="480" y="300" fontSize="10" fill="#37474F" textAnchor="middle">Johannesburg</text>
                    <text x="500" y="320" fontSize="10" fill="#37474F" textAnchor="middle">Pretoria</text>
                    <text x="280" y="460" fontSize="10" fill="#37474F" textAnchor="middle">Cape Town</text>
                    <text x="600" y="350" fontSize="10" fill="#37474F" textAnchor="middle">Durban</text>
                    <text x="570" y="250" fontSize="10" fill="#37474F" textAnchor="middle">Polokwane</text>
                    {/* Incident dots — mapped from lat/lng to SVG coords */}
                    {incidents.map((inc, i) => {
                      // Map SA coordinates: lat -22 to -35, lng 16 to 33
                      const x = ((inc.longitude - 16) / (33 - 16)) * 600 + 100;
                      const y = ((inc.latitude - (-22)) / ((-35) - (-22))) * 400 + 80;
                      const colors: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#EF4444", critical: "#7C3AED" };
                      const col = colors[inc.severity] || "#6B7280";
                      return (
                        <g key={inc.incident_id} onClick={() => setSelectedIncident(inc)} style={{ cursor: "pointer" }}>
                          <circle cx={x} cy={y} r={selectedIncident?.incident_id === inc.incident_id ? 10 : 7} fill={col} opacity={0.85} stroke="white" strokeWidth={2} />
                          {inc.status === "open" && <circle cx={x} cy={y} r={12} fill="none" stroke={col} strokeWidth={1.5} opacity={0.4} />}
                        </g>
                      );
                    })}
                  </svg>
                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.9)" }}>
                    {[{c:"#10B981",l:"Low"},{c:"#F59E0B",l:"Medium"},{c:"#EF4444",l:"High"},{c:"#7C3AED",l:"Critical"}].map(s => (
                      <div key={s.l} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.c }} />
                        <span className="text-xs" style={{ color: "#374151" }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                  {incidentsLoading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.7)" }}>
                      <RefreshCw size={24} className="animate-spin" style={{ color: "#1A9BAD" }} />
                    </div>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Click any dot to view incident details. Pulsing ring = open incident.</p>
              </div>

              {/* Incident Detail / List Panel */}
              <div style={cardStyle}>
                {selectedIncident ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>Incident Detail</h3>
                      <button onClick={() => setSelectedIncident(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                    <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 480 }}>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Title</p>
                        <p className="text-sm font-700" style={{ fontWeight: 700, color: "#0F2D4A" }}>{selectedIncident.title}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: selectedIncident.severity === 'critical' ? 'rgba(124,58,237,0.1)' : selectedIncident.severity === 'high' ? 'rgba(239,68,68,0.1)' : selectedIncident.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: selectedIncident.severity === 'critical' ? '#7C3AED' : selectedIncident.severity === 'high' ? '#EF4444' : selectedIncident.severity === 'medium' ? '#F59E0B' : '#10B981', fontWeight: 600 }}>{selectedIncident.severity}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: 'rgba(15,45,74,0.06)', color: '#0F2D4A', fontWeight: 600 }}>{selectedIncident.category}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-600" style={{ background: selectedIncident.status === 'open' ? 'rgba(239,68,68,0.1)' : selectedIncident.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: selectedIncident.status === 'open' ? '#EF4444' : selectedIncident.status === 'resolved' ? '#10B981' : '#F59E0B', fontWeight: 600 }}>{selectedIncident.status?.replace('_',' ')}</span>
                      </div>
                      {/* Property & Provider — highlighted section */}
                      <div className="rounded-xl p-3" style={{ background: 'rgba(15,45,74,0.04)', border: '1px solid rgba(15,45,74,0.08)' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1A9BAD' }} />
                          <p className="text-xs font-700" style={{ fontWeight: 700, color: '#0F2D4A' }}>Property &amp; Provider</p>
                        </div>
                        <p className="text-sm font-600" style={{ fontWeight: 600, color: '#0F2D4A' }}>
                          {selectedIncident.property_name || <span className="text-gray-400 italic">No property linked</span>}
                        </p>
                        {selectedIncident.property_city && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {selectedIncident.property_address || selectedIncident.property_city}</p>
                        )}
                        {selectedIncident.provider_name && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(15,45,74,0.08)' }}>
                            <p className="text-xs text-gray-400">Provider</p>
                            <p className="text-sm font-600" style={{ fontWeight: 600, color: '#0F2D4A' }}>{selectedIncident.provider_name}</p>
                            {selectedIncident.provider_email && (
                              <p className="text-xs text-gray-500">{selectedIncident.provider_email}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Description</p>
                        <p className="text-sm text-gray-600">{selectedIncident.description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Reported By</p>
                        <p className="text-sm text-gray-700">{selectedIncident.reporter_name} <span className="text-gray-400">({selectedIncident.reporter_role})</span></p>
                      </div>
                      {selectedIncident.address_text && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Incident Location</p>
                          <p className="text-sm text-gray-700 flex items-center gap-1"><MapPin size={12} /> {selectedIncident.address_text}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Reported</p>
                        <p className="text-sm text-gray-700">{new Date(selectedIncident.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Update Status</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['open','in_progress','resolved','closed'].map(s => (
                            <button
                              key={s}
                              onClick={() => updateIncidentStatus(selectedIncident.incident_id, s)}
                              disabled={statusUpdating === selectedIncident.incident_id || selectedIncident.status === s}
                              className="py-1.5 rounded-lg text-xs font-600 transition-all"
                              style={{
                                background: selectedIncident.status === s ? '#0F2D4A' : 'rgba(15,45,74,0.06)',
                                color: selectedIncident.status === s ? 'white' : '#6B7280',
                                fontWeight: 600,
                                opacity: statusUpdating === selectedIncident.incident_id ? 0.6 : 1,
                              }}
                            >
                              {s.replace('_',' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-700 mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>All Incidents ({incidents.length})</h3>
                    {incidents.length === 0 && !incidentsLoading && (
                      <div className="text-center py-8">
                        <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                        <p className="text-sm text-gray-400">No incidents reported yet</p>
                      </div>
                    )}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {incidents.map(inc => {
                        const colors: Record<string, string> = { low: "#10B981", medium: "#F59E0B", high: "#EF4444", critical: "#7C3AED" };
                        return (
                          <div
                            key={inc.incident_id}
                            onClick={() => setSelectedIncident(inc)}
                            className="p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
                            style={{ border: "1px solid #F3F4F6" }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-700 truncate" style={{ fontWeight: 700, color: "#0F2D4A" }}>{inc.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {inc.property_name ? (
                                    <span style={{ color: '#1A9BAD', fontWeight: 600 }}>{inc.property_name}</span>
                                  ) : (
                                    <span className="italic text-gray-400">No property linked</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {inc.provider_name ? `Provider: ${inc.provider_name}` : inc.reporter_name}
                                  {' · '}{inc.category}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full" style={{ background: colors[inc.severity] || "#6B7280" }} />
                                  <span className="text-xs" style={{ color: colors[inc.severity] || '#6B7280', fontWeight: 600 }}>{inc.severity}</span>
                                </div>
                                <span className="text-xs" style={{ color: inc.status === 'open' ? '#EF4444' : inc.status === 'resolved' ? '#10B981' : '#F59E0B' }}>{inc.status?.replace('_',' ')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
