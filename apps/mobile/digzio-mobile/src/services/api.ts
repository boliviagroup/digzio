import axios from "axios";

// Live Digzio AWS backend — af-south-1
const BASE_URL = "https://www.digzio.co.za/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      // Token will be injected by the auth hook via setAuthToken()
      return config;
    } catch {
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Handle 401 — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — will be handled by auth store
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: "student" | "provider";
    phone?: string;
  }) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ─── Properties ────────────────────────────────────────────────────────────
export const propertyAPI = {
  getAll: (params?: {
    limit?: number;
    offset?: number;
    city?: string;
    min_price?: number;
    max_price?: number;
    nsfas_accredited?: boolean;
  }) => api.get("/properties", { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  getMyProperties: () => api.get("/properties/my"),
  create: (data: FormData) =>
    api.post("/properties", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: object) => api.patch(`/properties/${id}`, data),
  toggleStatus: (id: string, status: "active" | "inactive") =>
    api.patch(`/properties/${id}`, { status }),
};

// ─── Applications ──────────────────────────────────────────────────────────
export const applicationAPI = {
  getProviderApplications: () => api.get("/applications/provider"),
  getMyApplications: () => api.get("/applications/my"),
  getById: (id: string) => api.get(`/applications/${id}`),
  submit: (data: {
    property_id: string;
    move_in_date: string;
    message?: string;
  }) => api.post("/applications", data),
  updateStatus: (
    id: string,
    status: "approved" | "rejected" | "nsfas_confirmed" | "lease_signed"
  ) => api.patch(`/applications/${id}/status`, { status }),
};

// ─── KYC ───────────────────────────────────────────────────────────────────
export const kycAPI = {
  getStatus: () => api.get("/kyc/status"),
  submit: (data: {
    id_type: string;
    id_number: string;
    date_of_birth: string;
    institution_name: string;
    student_number: string;
  }) => api.post("/kyc/submit", data),
};

// ─── Images ────────────────────────────────────────────────────────────────
export const imageAPI = {
  upload: (formData: FormData) =>
    api.post("/images/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ─── Institutions ──────────────────────────────────────────────────────────
export const institutionAPI = {
  getAll: () => api.get("/institutions"),
};
