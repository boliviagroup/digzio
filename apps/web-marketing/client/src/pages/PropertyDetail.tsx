import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { getProperty, applyForProperty, Property } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin, Bed, Wifi, Shield, Car, Dumbbell, Star,
  ChevronLeft, ChevronRight, X, CheckCircle, Loader2,
  ArrowLeft, Building2, Users, Calendar, Phone, Mail,
  BadgeCheck, Home, Hash
} from "lucide-react";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi size={18} />,
  security: <Shield size={18} />,
  parking: <Car size={18} />,
  gym: <Dumbbell size={18} />,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "High-Speed WiFi",
  security: "24/7 Security",
  parking: "Secure Parking",
  gym: "Gym & Fitness",
};

export default function PropertyDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Apply modal state
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  // Auth modal state
  const [authOpen, setAuthOpen] = useState(false);

  const fetchProperty = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProperty(params.id);
      setProperty(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const images = property?.images ?? [];
  const primaryImage = images.find((i) => i.is_primary)?.image_url ?? images[0]?.image_url;

  const prevImage = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setActiveIndex((i) => (i + 1) % images.length);

  const handleApply = () => {
    if (!isAuthenticated) { setAuthOpen(true); return; }
    if (user?.role !== "STUDENT") return;
    setApplyOpen(true);
    setApplySuccess(false);
    setApplyError(null);
    setApplyMessage("");
  };

  const submitApplication = async () => {
    if (!property) return;
    setApplyLoading(true);
    setApplyError(null);
    try {
      await applyForProperty(property.property_id, applyMessage || undefined);
      setApplySuccess(true);
    } catch (e: unknown) {
      setApplyError(e instanceof Error ? e.message : "Application failed");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleAuthClose = (loggedIn?: boolean) => {
    setAuthOpen(false);
    if (loggedIn) setApplyOpen(true);
  };

  const canApply = isAuthenticated && user?.role === "STUDENT";

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#F9FAFB" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin" style={{ color: "#1A9BAD" }} />
            <p style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif" }}>Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#F9FAFB" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(220,38,38,0.1)" }}>
              <Home size={32} style={{ color: "#DC2626" }} />
            </div>
            <h2 className="text-xl font-700 mb-2" style={{ color: "#0F2D4A", fontWeight: 700 }}>Property Not Found</h2>
            <p className="text-sm mb-6" style={{ color: "#6B7280" }}>{error ?? "This property could not be loaded."}</p>
            <button
              onClick={() => navigate("/search")}
              className="px-6 py-3 rounded-lg text-sm font-600"
              style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 600 }}
            >
              Back to Search
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const amenities = ["wifi", "security", "parking", "gym"];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}>
      <Navbar />

      {/* Mobile sticky bottom apply bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ background: "#fff", borderTop: "1px solid #F3F4F6", boxShadow: "0 -4px 20px rgba(15,45,74,0.10)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-800" style={{ color: "#0F2D4A", fontWeight: 800, lineHeight: 1.1 }}>
              R{Number(property.base_price_monthly).toLocaleString()}<span className="text-xs font-400 ml-1" style={{ color: "#9CA3AF", fontWeight: 400 }}>/month</span>
            </p>
            <p className="text-xs" style={{ color: property.available_beds > 0 ? "#16A34A" : "#DC2626" }}>
              {property.available_beds > 0 ? `${property.available_beds} beds available` : "Fully booked"}
            </p>
          </div>
          {canApply ? (
            <button
              onClick={handleApply}
              disabled={property.available_beds === 0}
              className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-700"
              style={{
                background: property.available_beds > 0 ? "linear-gradient(135deg, #0F2D4A, #1A9BAD)" : "#E5E7EB",
                color: property.available_beds > 0 ? "#fff" : "#9CA3AF",
                fontWeight: 700,
              }}
            >
              {property.available_beds > 0 ? "Apply Now" : "No Availability"}
            </button>
          ) : isAuthenticated ? null : (
            <button
              onClick={() => setAuthOpen(true)}
              className="flex-shrink-0 px-6 py-3 rounded-xl text-sm font-700"
              style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 700 }}
            >
              Sign in to Apply
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-24 lg:pb-8">

        {/* Back button */}
        <button
          onClick={() => navigate("/search")}
          className="flex items-center gap-2 mb-6 text-sm font-600 transition-colors hover:opacity-70"
          style={{ color: "#0F2D4A", fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          Back to Search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left Column: Gallery + Details ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Image Gallery */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(15,45,74,0.08)" }}>
              {/* Main image */}
              <div className="relative" style={{ height: "min(420px, 56vw)" }}>
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[activeIndex]?.image_url ?? primaryImage}
                      alt={`${property.title} - image ${activeIndex + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxOpen(true)}
                    />
                    {/* Image counter */}
                    <div
                      className="absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-600"
                      style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}
                    >
                      {activeIndex + 1} / {images.length}
                    </div>
                    {/* Nav arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                        >
                          <ChevronLeft size={20} style={{ color: "#0F2D4A" }} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                        >
                          <ChevronRight size={20} style={{ color: "#0F2D4A" }} />
                        </button>
                      </>
                    )}
                    {/* NSFAS badge */}
                    {property.is_nsfas_accredited && (
                      <div
                        className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-700"
                        style={{ background: "rgba(26,155,173,0.92)", color: "#fff", backdropFilter: "blur(4px)", fontWeight: 700 }}
                      >
                        <BadgeCheck size={14} />
                        NSFAS Accredited
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}>
                    <MapPin size={60} color="rgba(255,255,255,0.3)" />
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto" style={{ borderTop: "1px solid #F3F4F6" }}>
                  {images.map((img, idx) => (
                    <button
                      key={img.image_id}
                      onClick={() => setActiveIndex(idx)}
                      className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 80,
                        height: 60,
                        border: idx === activeIndex ? "2.5px solid #1A9BAD" : "2.5px solid transparent",
                        opacity: idx === activeIndex ? 1 : 0.65,
                      }}
                    >
                      <img src={img.image_url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(15,45,74,0.08)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-800 mb-1" style={{ color: "#0F2D4A", fontWeight: 800 }}>{property.title}</h1>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} style={{ color: "#1A9BAD" }} />
                    <span className="text-sm" style={{ color: "#6B7280" }}>
                      {property.address_line_1}{property.address_line_2 ? `, ${property.address_line_2}` : ""}, {property.city}, {property.province} {property.postal_code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={16} fill="#F59E0B" color="#F59E0B" />
                  <span className="font-700 text-sm" style={{ color: "#374151", fontWeight: 700 }}>4.8</span>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 rounded-xl" style={{ background: "#F9FAFB" }}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Bed size={16} style={{ color: "#1A9BAD" }} />
                    <span className="font-700 text-lg" style={{ color: "#0F2D4A", fontWeight: 700 }}>{property.total_beds}</span>
                  </div>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>Total Beds</span>
                </div>
                <div className="text-center" style={{ borderLeft: "1px solid #E5E7EB", borderRight: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Users size={16} style={{ color: "#16A34A" }} />
                    <span className="font-700 text-lg" style={{ color: "#0F2D4A", fontWeight: 700 }}>{property.available_beds}</span>
                  </div>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>Available</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Building2 size={16} style={{ color: "#6B7280" }} />
                    <span className="font-700 text-sm" style={{ color: "#0F2D4A", fontWeight: 700 }}>
                      {property.property_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>Type</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="font-700 text-base mb-3" style={{ color: "#0F2D4A", fontWeight: 700 }}>About this Property</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="font-700 text-base mb-3" style={{ color: "#0F2D4A", fontWeight: 700 }}>Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,155,173,0.1)", color: "#1A9BAD" }}>
                        {AMENITY_ICONS[a]}
                      </div>
                      <span className="text-sm font-600" style={{ color: "#374151", fontWeight: 600 }}>{AMENITY_LABELS[a]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider Info */}
            {property.provider && (
              <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(15,45,74,0.08)" }}>
                <h2 className="font-700 text-base mb-4" style={{ color: "#0F2D4A", fontWeight: 700 }}>Listed by</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-700 text-lg" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", fontWeight: 700 }}>
                    {property.provider.first_name?.[0]}{property.provider.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-700 text-sm" style={{ color: "#0F2D4A", fontWeight: 700 }}>
                      {property.provider.first_name} {property.provider.last_name}
                    </p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Verified Provider</p>
                    {(property.provider as any).email && (
                      <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#1A9BAD", fontWeight: 500 }}>
                        <Mail size={11} />{(property.provider as any).email}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto">
                    <BadgeCheck size={20} style={{ color: "#1A9BAD" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Booking Card — hidden on mobile (replaced by sticky bottom bar) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(15,45,74,0.12)" }}>
              {/* Price header */}
              <div className="px-6 pt-6 pb-4" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 100%)" }}>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-800 text-white" style={{ fontWeight: 800 }}>
                    R{Number(property.base_price_monthly).toLocaleString()}
                  </span>
                  <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>/month</span>
                </div>
                {property.is_nsfas_accredited && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                    <BadgeCheck size={13} />
                    NSFAS payments accepted
                  </div>
                )}
              </div>

              <div className="px-6 py-5">
                {/* Quick facts */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Available beds</span>
                    <span className="font-600" style={{ color: property.available_beds > 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {property.available_beds > 0 ? `${property.available_beds} available` : "Fully booked"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Property type</span>
                    <span className="font-600" style={{ color: "#374151", fontWeight: 600 }}>
                      {property.property_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "#6B7280" }}>Location</span>
                    <span className="font-600" style={{ color: "#374151", fontWeight: 600 }}>{property.city}</span>
                  </div>
                  {property.is_nsfas_accredited && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#6B7280" }}>NSFAS</span>
                      <span className="font-600" style={{ color: "#1A9BAD", fontWeight: 600 }}>Accredited ✓</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
                  {canApply ? (
                    <button
                      onClick={handleApply}
                      disabled={property.available_beds === 0}
                      className="w-full py-3.5 rounded-xl text-sm font-700 flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: property.available_beds > 0
                          ? "linear-gradient(135deg, #0F2D4A, #1A9BAD)"
                          : "#E5E7EB",
                        color: property.available_beds > 0 ? "#fff" : "#9CA3AF",
                        fontWeight: 700,
                        cursor: property.available_beds === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      {property.available_beds > 0 ? "Apply Now" : "No Availability"}
                    </button>
                  ) : isAuthenticated ? (
                    <div className="text-center py-3 px-4 rounded-xl text-sm" style={{ background: "#F9FAFB", color: "#6B7280" }}>
                      Only students can apply for accommodation.
                    </div>
                  ) : (
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="w-full py-3.5 rounded-xl text-sm font-700 transition-all"
                      style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 700 }}
                    >
                      Sign in to Apply
                    </button>
                  )}
                </div>

                <p className="text-center text-xs mt-3" style={{ color: "#9CA3AF" }}>
                  Zero application fees · No hidden charges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            <X size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            <ChevronLeft size={24} />
          </button>
          <img
            src={images[activeIndex]?.image_url}
            alt={`${property.title} - ${activeIndex + 1}`}
            className="max-w-5xl max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: idx === activeIndex ? "#1A9BAD" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Apply Modal ── */}
      {applyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 25px 60px rgba(15,45,74,0.25)" }}>
            <div className="relative px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0F2D4A 0%, #1A4A6B 100%)" }}>
              <button onClick={() => setApplyOpen(false)} className="absolute top-4 right-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                <X size={20} />
              </button>
              <h2 className="text-xl font-700 text-white mb-1" style={{ fontWeight: 700 }}>Apply for Accommodation</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{property.title}</p>
            </div>
            <div className="px-8 py-6">
              {applySuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
                    <CheckCircle size={32} style={{ color: "#16A34A" }} />
                  </div>
                  <h3 className="text-lg font-700 mb-2" style={{ color: "#0F2D4A", fontWeight: 700 }}>Application Submitted!</h3>
                  <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                    Your application for <strong>{property.title}</strong> has been submitted. The provider will review it and get back to you.
                  </p>
                  {property.provider && (
                    <div className="rounded-xl p-3 mb-4 text-left" style={{ background: "#F0FDFE", border: "1px solid rgba(26,155,173,0.2)" }}>
                      <p className="text-xs font-600 mb-1" style={{ color: "#0F2D4A", fontWeight: 600 }}>To review this application, log in as the provider:</p>
                      <p className="text-sm font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>{property.provider.first_name} {property.provider.last_name}</p>
                      {(property.provider as any).email && (
                        <p className="text-xs mt-0.5" style={{ color: "#1A9BAD" }}>{(property.provider as any).email} · Password: Provider@2026!</p>
                      )}
                    </div>
                  )}
                  <button onClick={() => setApplyOpen(false)} className="w-full py-3 rounded-lg font-600 text-sm" style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", color: "#fff", fontWeight: 600 }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-xl mb-4" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-600" style={{ color: "#374151" }}>{property.city}, {property.province}</span>
                      <span className="font-700" style={{ color: "#0F2D4A", fontWeight: 700 }}>R{Number(property.base_price_monthly).toLocaleString()}/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {property.is_nsfas_accredited && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(26,155,173,0.1)", color: "#1A9BAD" }}>NSFAS Accredited</span>
                      )}
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{property.total_beds} beds · {property.property_type?.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-600 mb-1.5" style={{ color: "#374151", fontWeight: 600 }}>
                      Message to Provider <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="Introduce yourself and explain why you're interested in this property..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg text-sm resize-none"
                      style={{ border: "1px solid #E5E7EB", outline: "none", fontFamily: "'Space Grotesk', sans-serif", color: "#374151" }}
                    />
                  </div>

                  {applyError && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                      {applyError}
                    </div>
                  )}

                  <p className="text-xs mb-5" style={{ color: "#9CA3AF" }}>
                    By submitting, you confirm interest in this property. The provider will review your profile and KYC status before making a decision.
                  </p>

                  <div className="flex gap-3">
                    <button onClick={() => setApplyOpen(false)} className="flex-1 py-3 rounded-lg text-sm font-600" style={{ border: "1px solid #E5E7EB", color: "#374151", fontWeight: 600 }}>
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
