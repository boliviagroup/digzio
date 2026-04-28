// Digzio Design System — exact match to www.digzio.co.za
// All hex values extracted directly from the web platform source code

export const Colors = {
  // Primary Brand
  navy: "#0F2D4A",
  navyLight: "#1A4A6B",
  navyDark: "#0A1F33",
  teal: "#1A9BAD",
  tealLight: "#2EC4C4",
  tealDark: "#147A8A",

  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  coral: "#E05A4E",

  // Neutral
  offWhite: "#F5F7FA",
  mutedGrey: "#E8ECEF",
  charcoal: "#2C3E50",
  white: "#FFFFFF",
  black: "#000000",

  // Backgrounds
  background: "#F5F7FA",
  card: "#FFFFFF",
  border: "#E8ECEF",
} as const;

export const Gradients = {
  // Primary CTA button gradient (Teal → Cyan)
  primary: ["#1A9BAD", "#2EC4C4"] as [string, string],
  // Hero header gradient (Navy → Teal)
  hero: ["#0F2D4A", "#1A4A6B", "#1A9BAD"] as [string, string, string],
} as const;

export const FontFamily = {
  regular: "SpaceGrotesk-Regular",
  medium: "SpaceGrotesk-Medium",
  semiBold: "SpaceGrotesk-SemiBold",
  bold: "SpaceGrotesk-Bold",
  extraBold: "SpaceGrotesk-ExtraBold",
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// Status badge styles — 10% opacity background, full color text
export const StatusBadge = {
  approved: {
    bg: "rgba(16, 185, 129, 0.1)",
    text: Colors.success,
    label: "Approved",
  },
  pending: {
    bg: "rgba(245, 158, 11, 0.1)",
    text: Colors.warning,
    label: "Pending",
  },
  rejected: {
    bg: "rgba(239, 68, 68, 0.1)",
    text: Colors.error,
    label: "Rejected",
  },
  verified: {
    bg: "rgba(16, 185, 129, 0.1)",
    text: Colors.success,
    label: "Verified",
  },
  under_review: {
    bg: "rgba(245, 158, 11, 0.1)",
    text: Colors.warning,
    label: "Under Review",
  },
  active: {
    bg: "rgba(26, 155, 173, 0.1)",
    text: Colors.teal,
    label: "Active",
  },
  inactive: {
    bg: "rgba(232, 236, 239, 0.5)",
    text: Colors.charcoal,
    label: "Inactive",
  },
} as const;
