import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredToken } from "@/lib/api";
import {
  Home, Clock, CheckCircle, XCircle, FileText, MapPin,
  DollarSign, Calendar, ArrowRight, Loader2, AlertCircle,
  RefreshCw, Search, BadgeCheck, User
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

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    fetchApplications();
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

  const stats = {
    total: applications.length,
    approved: applications.filter((a) => a.status === "APPROVED" || a.status === "LEASE_SIGNED").length,
    pending: applications.filter((a) => a.status === "SUBMITTED" || a.status === "PENDING_NSFAS").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
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
                Student Dashboard — track your accommodation applications
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchApplications}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <Link href="/search">
                <button className="btn-primary flex items-center gap-2 text-sm" style={{ padding: "0.5rem 1.25rem" }}>
                  <Search size={14} /> Find More Properties
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
            { label: "Not Successful",   value: stats.rejected, color: "#EF4444", icon: XCircle },
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
        {user?.kyc_status !== "VERIFIED" && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-4 flex-wrap" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <BadgeCheck size={20} style={{ color: "#F59E0B" }} />
            <div className="flex-1">
              <p className="text-sm font-700" style={{ color: "#92400E", fontWeight: 700 }}>Complete your KYC verification</p>
              <p className="text-xs" style={{ color: "#B45309" }}>Providers require KYC verification before approving applications. Complete it to improve your chances.</p>
            </div>
            <Link href="/search">
              <button className="text-xs px-4 py-2 rounded-lg font-700" style={{ background: "#F59E0B", color: "white", fontWeight: 700 }}>
                Verify Now <ArrowRight size={12} className="inline ml-1" />
              </button>
            </Link>
          </div>
        )}

        {/* Applications List */}
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
      </div>

      <Footer />
    </div>
  );
}
