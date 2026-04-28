import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { applicationAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Button } from "../../components/common/Button";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

type AppStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "NSFAS_CONFIRMED" | "LEASE_SIGNED";

const WORKFLOW_STEPS = [
  { key: "SUBMITTED", label: "Application Submitted", icon: "📝" },
  { key: "APPROVED", label: "Application Approved", icon: "✅" },
  { key: "NSFAS_CONFIRMED", label: "NSFAS Confirmed", icon: "🏦" },
  { key: "LEASE_SIGNED", label: "Lease Signed", icon: "📄" },
];

export const ApplicationDetailScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { application: initialApp } = route.params;
  const [app, setApp] = useState(initialApp);
  const [loading, setLoading] = useState(false);

  const currentStepIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.key === app.status
  );

  const handleStatusUpdate = async (newStatus: AppStatus) => {
    const labels: Record<AppStatus, string> = {
      SUBMITTED: "Reset to Submitted",
      APPROVED: "Approve",
      REJECTED: "Reject",
      NSFAS_CONFIRMED: "Confirm NSFAS",
      LEASE_SIGNED: "Mark Lease Signed",
    };

    Alert.alert(
      `${labels[newStatus]} Application`,
      `Are you sure you want to ${labels[newStatus].toLowerCase()} this application for ${app.student_first_name} ${app.student_last_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: newStatus === "REJECTED" ? "destructive" : "default",
          onPress: async () => {
            setLoading(true);
            try {
              await applicationAPI.updateStatus(app.application_id, newStatus.toLowerCase() as any);
              setApp({ ...app, status: newStatus });
              if (newStatus === "APPROVED") {
                Alert.alert(
                  "Application Approved ✅",
                  `${app.student_first_name} has been notified by email.`
                );
              }
            } catch (e: any) {
              Alert.alert(
                "Error",
                e?.response?.data?.message || "Could not update application status."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getNextAction = () => {
    switch (app.status) {
      case "SUBMITTED":
        return { label: "Approve Application", status: "APPROVED" as AppStatus, variant: "primary" as const };
      case "APPROVED":
        return { label: "Confirm NSFAS", status: "NSFAS_CONFIRMED" as AppStatus, variant: "navy" as const };
      case "NSFAS_CONFIRMED":
        return { label: "Mark Lease Signed", status: "LEASE_SIGNED" as AppStatus, variant: "navy" as const };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <StatusBadge status={app.status} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Student Info Card */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.studentRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(app.student_first_name || "?")[0]}
                {(app.student_last_name || "?")[0]}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {app.student_first_name} {app.student_last_name}
              </Text>
              <Text style={styles.studentEmail}>{app.student_email}</Text>
              {app.student_phone && (
                <Text style={styles.studentPhone}>{app.student_phone}</Text>
              )}
            </View>
          </View>

          {/* KYC & NSFAS Status */}
          <View style={styles.verificationRow}>
            <View style={styles.verificationItem}>
              <Text style={styles.verificationLabel}>KYC Status</Text>
              <StatusBadge status={app.kyc_status || "pending"} size="sm" />
            </View>
            <View style={styles.verificationDivider} />
            <View style={styles.verificationItem}>
              <Text style={styles.verificationLabel}>NSFAS Status</Text>
              <StatusBadge status={app.nsfas_status || "pending"} size="sm" />
            </View>
          </View>
        </View>

        {/* Property Info */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Property</Text>
          <Text style={styles.propertyName}>
            {app.property_title || app.property_name}
          </Text>
          {app.property_address && (
            <Text style={styles.propertyAddress}>
              📍 {app.property_address}, {app.property_city}
            </Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Monthly Rent</Text>
            <Text style={styles.priceValue}>
              R{Number(app.price_per_month || 0).toLocaleString()}/month
            </Text>
          </View>
        </View>

        {/* Application Info */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Application Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted</Text>
            <Text style={styles.detailValue}>
              {new Date(app.created_at).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
          {app.move_in_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Move-in Date</Text>
              <Text style={styles.detailValue}>
                {new Date(app.move_in_date).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
          {app.message && (
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>Student's Message</Text>
              <Text style={styles.messageText}>{app.message}</Text>
            </View>
          )}
        </View>

        {/* Workflow Progress */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Application Progress</Text>
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex && app.status !== "REJECTED";
            const isCurrent = idx === currentStepIndex && app.status !== "REJECTED";
            return (
              <View key={step.key} style={styles.workflowStep}>
                <View
                  style={[
                    styles.workflowDot,
                    isCompleted && styles.workflowDotCompleted,
                    isCurrent && styles.workflowDotCurrent,
                  ]}
                >
                  <Text style={styles.workflowDotText}>
                    {isCompleted ? "✓" : idx + 1}
                  </Text>
                </View>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.workflowLine,
                      idx < currentStepIndex && styles.workflowLineCompleted,
                    ]}
                  />
                )}
                <View style={styles.workflowLabel}>
                  <Text
                    style={[
                      styles.workflowStepIcon,
                    ]}
                  >
                    {step.icon}
                  </Text>
                  <Text
                    style={[
                      styles.workflowStepLabel,
                      isCompleted && styles.workflowStepLabelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              </View>
            );
          })}
          {app.status === "REJECTED" && (
            <View style={styles.rejectedBanner}>
              <Text style={styles.rejectedText}>❌ Application Rejected</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {app.status !== "LEASE_SIGNED" && app.status !== "REJECTED" && (
          <View style={styles.actionsCard}>
            {nextAction && (
              <Button
                title={loading ? "Processing..." : nextAction.label}
                onPress={() => handleStatusUpdate(nextAction.status)}
                variant={nextAction.variant}
                loading={loading}
                style={styles.actionBtn}
              />
            )}
            {app.status === "SUBMITTED" && (
              <Button
                title="Reject Application"
                onPress={() => handleStatusUpdate("REJECTED")}
                variant="danger"
                disabled={loading}
                style={styles.actionBtn}
              />
            )}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  backText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.teal,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.base,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
    marginBottom: Spacing.md,
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    marginBottom: 2,
  },
  studentEmail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  studentPhone: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginTop: 2,
  },
  verificationRow: {
    flexDirection: "row",
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  verificationItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  verificationDivider: {
    width: 1,
    backgroundColor: Colors.mutedGrey,
  },
  verificationLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  propertyName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
    marginBottom: 4,
  },
  propertyAddress: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  priceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  priceValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.teal,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  detailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  detailValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
  },
  messageBox: {
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  messageLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    lineHeight: 20,
  },
  workflowStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  workflowDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.mutedGrey,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    zIndex: 1,
  },
  workflowDotCompleted: {
    backgroundColor: Colors.success,
  },
  workflowDotCurrent: {
    backgroundColor: Colors.teal,
  },
  workflowDotText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: Colors.white,
  },
  workflowLine: {
    position: "absolute",
    left: 13,
    top: 28,
    width: 2,
    height: 28,
    backgroundColor: Colors.mutedGrey,
  },
  workflowLineCompleted: {
    backgroundColor: Colors.success,
  },
  workflowLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 24,
    gap: 8,
  },
  workflowStepIcon: {
    fontSize: 18,
  },
  workflowStepLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.5,
  },
  workflowStepLabelCompleted: {
    color: Colors.navy,
    opacity: 1,
  },
  rejectedBanner: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: 8,
  },
  rejectedText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  actionsCard: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.base,
    gap: 10,
  },
  actionBtn: {
    marginBottom: 0,
  },
  bottomPad: {
    height: 40,
  },
});
