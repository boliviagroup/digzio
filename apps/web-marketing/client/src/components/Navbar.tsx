import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, User, LayoutDashboard, BarChart3, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";

const navLinks = [
  { label: "Find Housing", href: "/search" },
  { label: "For Students", href: "/students" },
  { label: "For Providers", href: "/providers" },
  { label: "For Institutions", href: "/institutions" },
  { label: "How It Works", href: "/how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isHome = location === "/";

  const openSignIn = () => {
    setMenuOpen(false);
    setAuthTab("login");
    setAuthOpen(true);
  };

  const openRegister = () => {
    setMenuOpen(false);
    setAuthTab("register");
    setAuthOpen(true);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHome
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)" }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="10" width="18" height="3" rx="0.5" fill="white" />
                  <polygon points="11,2 20,10 2,10" fill="white" />
                  <rect x="5" y="13" width="12" height="7" rx="0.5" fill="white" />
                  <rect x="8" y="16" width="6" height="4" rx="0.5" fill="#1A9BAD" />
                  <line x1="20" y1="10" x2="20" y2="16" stroke="white" strokeWidth="1.5" />
                  <circle cx="20" cy="17" r="1.2" fill="white" />
                </svg>
              </div>
              <span
                className={`text-xl font-light tracking-tight transition-colors ${
                  scrolled || !isHome ? "text-gray-900" : "text-white"
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Digzio
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    location === link.href
                      ? "font-700"
                      : scrolled || !isHome
                      ? "text-gray-600 hover:text-gray-900"
                      : "text-white/80 hover:text-white"
                  }`}
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: location === link.href ? 700 : 500,
                    color: location === link.href ? "#1A9BAD" : undefined,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(26,155,173,0.1)" }}>
                    <User size={16} style={{ color: "#1A9BAD" }} />
                    <span className="text-sm font-600" style={{ color: "#0F2D4A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                      {user.first_name}
                    </span>
                  </div>
                  <Link href={user.role === "PROVIDER" ? "/dashboard/provider" : "/dashboard/student"}>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-600 transition-all btn-primary"
                      style={{ padding: "0.5rem 1rem", fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      <LayoutDashboard size={15} /> My Dashboard
                    </button>
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin">
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-600 transition-all"
                        style={{ padding: "0.5rem 1rem", fontFamily: "'Space Grotesk', sans-serif", background: "rgba(15,45,74,0.08)", color: "#0F2D4A" }}
                      >
                        <BarChart3 size={15} /> Admin
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
                    style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={openSignIn}
                    className="text-sm font-500 transition-colors"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: scrolled || !isHome ? "#374151" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openRegister}
                    className="btn-primary text-sm"
                    style={{ padding: "0.6rem 1.5rem" }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile right side: show sign-in icon when not authenticated, or user initial */}
            <div className="flex lg:hidden items-center gap-2">
              {!isAuthenticated && (
                <button
                  onClick={openSignIn}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 transition-all"
                  style={{
                    background: scrolled || !isHome ? "rgba(26,155,173,0.1)" : "rgba(255,255,255,0.15)",
                    color: scrolled || !isHome ? "#1A9BAD" : "#fff",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    border: scrolled || !isHome ? "1px solid rgba(26,155,173,0.3)" : "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <LogIn size={14} />
                  Sign In
                </button>
              )}
              {/* Mobile hamburger toggle */}
              <button
                className={`p-2 rounded-md ${scrolled || !isHome ? "text-gray-700" : "text-white"}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
            <div className="container py-3 flex flex-col gap-0.5">
              {/* Nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: location === link.href ? "#1A9BAD" : "#374151",
                    background: location === link.href ? "rgba(26,155,173,0.06)" : "transparent",
                    fontWeight: location === link.href ? 700 : 500,
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth section */}
              <div className="pt-3 mt-1 border-t border-gray-100">
                {isAuthenticated && user ? (
                  <div className="flex flex-col gap-2 px-1 py-1">
                    {/* User info */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(26,155,173,0.06)" }}>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700 flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #0F2D4A, #1A9BAD)", fontWeight: 700 }}
                      >
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-600 truncate" style={{ color: "#0F2D4A", fontWeight: 600 }}>{user.first_name} {user.last_name}</p>
                        <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                      </div>
                    </div>
                    {/* Dashboard button */}
                    <Link href={user.role === "PROVIDER" ? "/dashboard/provider" : "/dashboard/student"}>
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="btn-primary w-full justify-center text-sm py-3"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        <LayoutDashboard size={15} /> My Dashboard
                      </button>
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link href="/admin">
                        <button
                          onClick={() => setMenuOpen(false)}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-600"
                          style={{ background: "rgba(15,45,74,0.08)", color: "#0F2D4A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                        >
                          <BarChart3 size={15} /> Admin Panel
                        </button>
                      </Link>
                    )}
                    {/* Sign out */}
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm"
                      style={{ color: "#6B7280", fontFamily: "'Space Grotesk', sans-serif", border: "1px solid #F3F4F6" }}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-1 py-1">
                    {/* Sign In button — prominent */}
                    <button
                      onClick={openSignIn}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-700"
                      style={{
                        background: "#0F2D4A",
                        color: "#fff",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                      }}
                    >
                      <LogIn size={16} /> Sign In
                    </button>
                    {/* Get Started button */}
                    <button
                      onClick={openRegister}
                      className="btn-primary w-full justify-center py-3.5 text-sm"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      Get Started — It's Free
                    </button>
                    <p className="text-center text-xs py-1" style={{ color: "#9CA3AF" }}>
                      Zero application fees · No hidden charges
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  );
}
