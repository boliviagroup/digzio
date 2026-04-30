import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { searchProperties, applyForProperty, Property } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search as SearchIcon, SlidersHorizontal, MapPin, Bed, Bath,
  Wifi, Shield, Dumbbell, Car, ChevronDown, Star, Heart,
  Loader2, AlertCircle, CheckCircle, X, ArrowRight,
  ChevronLeft, ChevronRight
} from "lucide-react";

const PROVINCES = [
  "All Provinces", "Gauteng", "Western Cape", "KwaZulu-Natal",
  "Eastern Cape", "Limpopo", "Mpumalanga", "Free State",
  "North West", "Northern Cape",
];

const PRICE_RANGES = [
  { label: "Any Price", min: undefined, max: undefined },
  { label: "Under R3,000", min: undefined, max: 3000 },
  { label: "R3,000 – R5,000", min: 3000, max: 5000 },
  { label: "R5,000 – R8,000", min: 5000, max: 8000 },
  { label: "R8,000+", min: 8000, max: undefined },
];

const PROPERTY_TYPES = ["All Types", "APARTMENT", "HOUSE", "ROOM", "STUDENT_RESIDENCE"];
const PAGE_SIZE = 24;

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={14} />,
  security: <Shield size={14} />,
  gym: <Dumbbell size={14} />,
  parking: <Car size={14} />,
};

function PropertyCard({ property, onApply, canApply }: { property: Property; onApply: (p: Property) => void; canApply: boolean }) {
  const [saved, setSaved] = useState(false);
  const [, navigate] = useLocation();
  const primaryImage = property.images?.find((i) => i.is_primary)?.image_url;
  const amenities = ["wifi", "security", "parking"];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer"
      style={{
        background: "#fff",
        border: "1px solid #F3F4F6",
        boxShadow: "0 2px 8px rgba(15,45,74,0.06)",
      }}
      onClick={() => navigate(`/property/${property.property_id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(15,45,74,0.14)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,45,74,0.06)")}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
            <MapPin size={40} color="rgba(255,255,255,0.4)" />
          </div>
        )}
        {/* NSFAS badge */}
        {property.is_nsfas_accredited && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-700"
            style={{ background: "rgba(26,155,173,0.9)", color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
          >
            NSFAS Accredited
          </span>
        )}
        {/* Save button */}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
        >
          <Heart size={16} fill={saved ? "#EF4444" : "none"} color={saved ? "#EF4444" : "#6B7280"} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-700 text-base leading-tight" style={{ color: "#0F2D4A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            {property.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={13} fill="#F59E0B" color="#F59E0B" />
            <span className="text-xs font-600" style={{ color: "#374151" }}>4.8</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={13} style={{ color: "#1A9BAD" }} />
          <span className="text-sm" style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif" }}>
            {property.city}, {property.province}
          </span>
        </div>

        {/* Beds & type */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
            <Bed size={13} /> {property.total_beds} bed{property.total_beds !== 1 ? "s" : ""}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
            {property.property_type?.replace("_", " ")}
          </span>
          {property.available_beds > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#16A34A" }}>
              {property.available_beds} available
            </span>
          )}
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-2 mb-4">
          {amenities.map((a) => (
            <span key={a} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ background: "#F9FAFB", color: "#6B7280" }}>
              {AMENITY_ICONS[a]} {a.charAt(0).toUpperCase() + a.slice(1)}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
          <div>
            <span className="text-xl font-800" style={{ color: "#0F2D4A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 }}>
              R{Number(property.base_price_monthly).toLocaleString()}
            </span>
            <span className="text-xs ml-1" style={{ color: "#9CA3AF" }}>/month</span>
          </div>
          {canApply ? (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(property); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 transition-all"
              style={{
                background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)",
                color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
              }}
            >
              Apply <ArrowRight size={14} />
            </button>
          ) : (
            <span
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-600"
              style={{ background: "rgba(107,114,128,0.08)", color: "#9CA3AF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              View Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Search() {
  const { isAuthenticated, user } = useAuth();
  const canApply = !isAuthenticated || user?.role === "STUDENT";
  const [, navigate] = useLocation();

  // Filters
  const [searchText, setSearchText] = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [nsfasOnly, setNsfasOnly] = useState(false);
  const [propertyType, setPropertyType] = useState("All Types");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth modal
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingProperty, setPendingProperty] = useState<Property | null>(null);

  // Apply modal
  const [applyTarget, setApplyTarget] = useState<Property | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchProperties = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const priceRange = PRICE_RANGES[priceRangeIdx];
      const result = await searchProperties({
        search: searchText || undefined,
        province: province !== "All Provinces" ? province : undefined,
        min_price: priceRange.min,
        max_price: priceRange.max,
        nsfas_accredited: nsfasOnly ? true : undefined,
        property_type: propertyType !== "All Types" ? propertyType : undefined,
        limit: PAGE_SIZE,
        page,
      });
      setProperties(result.properties || []);
      setTotal(result.total || 0);
    } catch {
      setError("Unable to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchText, province, priceRangeIdx, nsfasOnly, propertyType]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, province, priceRangeIdx, nsfasOnly, propertyType]);

  // Fetch when page or filters change (debounced for text input)
  useEffect(() => {
    const timer = setTimeout(() => fetchProperties(currentPage), 300);
    return () => clearTimeout(timer);
  }, [fetchProperties, currentPage]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApply = (property: Property) => {
    if (!isAuthenticated) {
      setPendingProperty(property);
      setAuthOpen(true);
    } else {
      setApplyTarget(property);
      setApplySuccess(false);
      setApplyError(null);
    }
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
    if (isAuthenticated && pendingProperty) {
      setApplyTarget(pendingProperty);
      setApplySuccess(false);
      setApplyError(null);
    }
    setPendingProperty(null);
  };

  const submitApplication = async () => {
    if (!applyTarget) return;
    setApplyLoading(true);
    setApplyError(null);
    try {
      await applyForProperty(applyTarget.property_id);
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err.message || "Application failed. Please try again.");
    } finally {
      setApplyLoading(false);
    }
  };

  // Build page number array with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Hero search bar */}
      <div className="pt-20 pb-6 px-4" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 60%, #1A9BAD 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-800 text-white mb-1.5 text-center" style={{ fontWeight: 800 }}>
            Find Your Perfect Student Accommodation
          </h1>
          <p className="text-center mb-5 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.7)" }}>
            Browse {total > 0 ? `${total} verified` : "verified"} properties across South Africa
          </p>

          {/* Search input */}
          <div className="relative mb-4">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by city, property or university..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
            />
          </div>

          {/* Quick filters — scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="flex-shrink-0 px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
              style={{ fontFamily: "'Space Grotesk', sans-serif", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", minWidth: 130 }}
            >
              {PROVINCES.map((p) => <option key={p} value={p} style={{ color: "#0F2D4A" }}>{p}</option>)}
            </select>

            <select
              value={priceRangeIdx}
              onChange={(e) => setPriceRangeIdx(Number(e.target.value))}
              className="flex-shrink-0 px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
              style={{ fontFamily: "'Space Grotesk', sans-serif", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", minWidth: 130 }}
            >
              {PRICE_RANGES.map((r, i) => <option key={i} value={i} style={{ color: "#0F2D4A" }}>{r.label}</option>)}
            </select>

            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="flex-shrink-0 px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
              style={{ fontFamily: "'Space Grotesk', sans-serif", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", minWidth: 140 }}
            >
              {PROPERTY_TYPES.map((t) => <option key={t} value={t} style={{ color: "#0F2D4A" }}>{t.replace("_", " ")}</option>)}
            </select>

            <label className="flex-shrink-0 flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-lg" style={{ background: nsfasOnly ? "rgba(26,155,173,0.4)" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", minWidth: 120 }}>
              <input type="checkbox" checked={nsfasOnly} onChange={(e) => setNsfasOnly(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm">NSFAS Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count + pagination info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {loading
              ? "Loading..."
              : total > 0
                ? `Showing ${((currentPage - 1) * PAGE_SIZE) + 1}–${Math.min(currentPage * PAGE_SIZE, total)} of ${total} propert${total !== 1 ? "ies" : "y"}`
                : "0 properties found"
            }
          </p>
          {!loading && totalPages > 1 && (
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle size={20} style={{ color: "#DC2626" }} />
            <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>
            <button onClick={() => fetchProperties(currentPage)} className="ml-auto text-sm font-600" style={{ color: "#DC2626" }}>Retry</button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={40} className="animate-spin mb-4" style={{ color: "#1A9BAD" }} />
            <p style={{ color: "#6B7280" }}>Loading properties...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && properties.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "#F3F4F6" }}>
              <SearchIcon size={28} style={{ color: "#9CA3AF" }} />
            </div>
            <h3 className="text-lg font-700 mb-2" style={{ color: "#0F2D4A", fontWeight: 700 }}>No properties found</h3>
            <p className="text-sm max-w-sm" style={{ color: "#6B7280" }}>
              Try adjusting your filters or search terms to find more results.
            </p>
          </div>
        )}

        {/* Property grid */}
        {!loading && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.property_id} property={p} onApply={handleApply} canApply={canApply} />
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 transition-all"
              style={{
                background: currentPage === 1 ? "#F3F4F6" : "#fff",
                color: currentPage === 1 ? "#9CA3AF" : "#0F2D4A",
                border: "1px solid #E5E7EB",
                fontWeight: 600,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((pg, idx) =>
              pg === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-sm" style={{ color: "#9CA3AF" }}>…</span>
              ) : (
                <button
                  key={pg}
                  onClick={() => goToPage(pg as number)}
                  className="w-9 h-9 rounded-lg text-sm font-600 transition-all"
                  style={{
                    background: currentPage === pg ? "linear-gradient(135deg, #0F2D4A, #1A9BAD)" : "#fff",
                    color: currentPage === pg ? "#fff" : "#374151",
                    border: currentPage === pg ? "none" : "1px solid #E5E7EB",
                    fontWeight: 600,
                  }}
                >
                  {pg}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-600 transition-all"
              style={{
                background: currentPage === totalPages ? "#F3F4F6" : "linear-gradient(135deg, #0F2D4A, #1A9BAD)",
                color: currentPage === totalPages ? "#9CA3AF" : "#fff",
                border: currentPage === totalPages ? "1px solid #E5E7EB" : "none",
                fontWeight: 600,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Apply modal */}
      {applyTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 25px 60px rgba(15,45,74,0.25)" }}>
            <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 100%)" }}>
              <button onClick={() => setApplyTarget(null)} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X size={20} />
              </button>
              <h2 className="text-xl font-700 text-white mb-1" style={{ fontWeight: 700 }}>Apply for Accommodation</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{applyTarget.title}</p>
            </div>
            <div className="px-8 py-6">
              {applySuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
                    <CheckCircle size={32} style={{ color: "#16A34A" }} />
                  </div>
                  <h3 className="text-lg font-700 mb-2" style={{ color: "#0F2D4A", fontWeight: 700 }}>Application Submitted!</h3>
                  <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                    Your application for <strong>{applyTarget.title}</strong> has been submitted. The provider will review it and get back to you.
                  </p>
                  <button onClick={() => setApplyTarget(null)} className="w-full py-3 rounded-lg font-600 text-sm" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 600 }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl mb-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-600" style={{ color: "#374151" }}>{applyTarget.city}, {applyTarget.province}</span>
                      <span className="font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>R{Number(applyTarget.base_price_monthly).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {applyTarget.is_nsfas_accredited && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: "#1A9BAD" }}>NSFAS Accredited</span>
                      )}
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{applyTarget.total_beds} beds · {applyTarget.property_type?.replace("_", " ")}</span>
                    </div>
                  </div>
                  {applyError && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      {applyError}
                    </div>
                  )}
                  <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                    By submitting this application, you confirm that you are interested in this property. The provider will review your profile and KYC status before making a decision.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setApplyTarget(null)} className="flex-1 py-3 rounded-lg text-sm font-600" style={{ border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button
                      onClick={submitApplication}
                      disabled={applyLoading}
                      className="flex-1 py-3 rounded-lg text-sm font-600 flex items-center justify-center gap-2"
                      style={{ background: applyLoading ? "#9CA3AF" : "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 600 }}
                    >
                      {applyLoading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Submit Application"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={handleAuthClose} defaultTab="register" defaultRole="STUDENT" />
      <Footer />
    </div>
  );
}
