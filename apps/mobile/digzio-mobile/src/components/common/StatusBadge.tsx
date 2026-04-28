import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontFamily, FontSize, BorderRadius, StatusBadge as BadgeStyles } from "../../theme";

type BadgeStatus = keyof typeof BadgeStyles;

interface StatusBadgeProps {
  status: BadgeStatus | string;
  size?: "sm" | "md";
}

const normalizeStatus = (status: string): BadgeStatus => {
  const map: Record<string, BadgeStatus> = {
    APPROVED: "approved",
    approved: "approved",
    PENDING: "pending",
    pending: "pending",
    SUBMITTED: "pending",
    submitted: "pending",
    REJECTED: "rejected",
    rejected: "rejected",
    VERIFIED: "verified",
    verified: "verified",
    UNDER_REVIEW: "under_review",
    under_review: "under_review",
    PENDING_REVIEW: "under_review",
    ACTIVE: "active",
    active: "active",
    INACTIVE: "inactive",
    inactive: "inactive",
    NSFAS_CONFIRMED: "approved",
    LEASE_SIGNED: "approved",
  };
  return (map[status] as BadgeStatus) || "pending";
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const normalized = normalizeStatus(status);
  const style = BadgeStyles[normalized];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: style.bg },
        size === "sm" && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: style.text },
          size === "sm" && styles.textSm,
        ]}
      >
        {style.label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
});
