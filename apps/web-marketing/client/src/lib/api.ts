/**
 * Digzio API Client
 * Connects the marketing website to the AWS ALB backend in af-south-1
 */

// Use a relative path so all API calls go through the Express proxy on the same origin.
// This avoids mixed-content (HTTPS page → HTTP ALB) browser blocks.
const API_BASE = import.meta.env.VITE_API_URL || "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Property {
  property_id: string;
  title: string;
  description: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
  property_type: string;
  total_beds: number;
  available_beds: number;
  base_price_monthly: number;
  is_nsfas_accredited: boolean;
  status: string;
  created_at: string;
  images?: PropertyImage[];
  provider?: {
    first_name: string;
    last_name: string;
  };
}

export interface PropertyImage {
  image_id: string;
  image_url: string;
  is_primary: boolean;
}

export interface PropertySearchParams {
  province?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  nsfas_accredited?: boolean;
  property_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuthUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  kyc_status: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: "STUDENT" | "PROVIDER" | "INSTITUTION";
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Login failed");
  }
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Registration failed");
  }
  return res.json();
}

export function getStoredToken(): string | null {
  return localStorage.getItem("digzio_token");
}

export function setStoredToken(token: string, refreshToken: string): void {
  localStorage.setItem("digzio_token", token);
  localStorage.setItem("digzio_refresh_token", refreshToken);
}

export function clearStoredToken(): void {
  localStorage.removeItem("digzio_token");
  localStorage.removeItem("digzio_refresh_token");
  localStorage.removeItem("digzio_user");
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("digzio_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem("digzio_user", JSON.stringify(user));
}

// ─── Properties ───────────────────────────────────────────────────────────────

export async function searchProperties(params: PropertySearchParams = {}): Promise<{ properties: Property[]; total: number; page: number; limit: number }> {
  const query = new URLSearchParams();
  if (params.province) query.set("province", params.province);
  if (params.city) query.set("city", params.city);
  if (params.min_price !== undefined) query.set("min_price", String(params.min_price));
  if (params.max_price !== undefined) query.set("max_price", String(params.max_price));
  if (params.nsfas_accredited !== undefined) query.set("nsfas_accredited", String(params.nsfas_accredited));
  if (params.property_type) query.set("property_type", params.property_type);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit || 20));

  const res = await fetch(`${API_BASE}/api/v1/properties?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

export async function getProperty(id: string): Promise<Property> {
  const res = await fetch(`${API_BASE}/api/v1/properties/${id}`);
  if (!res.ok) throw new Error("Property not found");
  return res.json();
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function applyForProperty(propertyId: string, message?: string): Promise<{ application_id: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/v1/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ property_id: propertyId, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Application failed");
  }
  return res.json();
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export async function submitKyc(data: {
  id_number: string;
  id_type: string;
  date_of_birth: string;
  institution_name?: string;
  student_number?: string;
}): Promise<{ kyc_id: string; status: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/v1/kyc/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "KYC submission failed");
  }
  return res.json();
}

// ─── Properties (Provider) ────────────────────────────────────────────────────

export interface CreatePropertyPayload {
  title: string;
  description: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
  property_type: string;
  total_beds: number;
  available_beds?: number;
  base_price_monthly: number;
  is_nsfas_accredited?: boolean;
  lat?: number;
  lng?: number;
}

export async function createProperty(data: CreatePropertyPayload): Promise<{ property_id: string; title: string; status: string }> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/api/v1/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to create property listing");
  }
  return res.json();
}
