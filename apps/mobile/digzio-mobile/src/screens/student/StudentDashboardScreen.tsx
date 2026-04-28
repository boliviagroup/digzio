import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { applicationAPI, kycAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const KYC_STEPS = [
  { key: "NOT_STARTED", label: "Not Verified", color: Colors.error },
  { key: "PENDING", label: "Under Review", color: Colors.warning },
  { key: "VERIFIED", label: "KYC Verified", color: Colors.success },
];

const APP_WORKFLOW = [
  { key: "SUBMITTED", label: "Submitted", icon: "📝" },
  { key: "APPROVED", label: "Approved", icon: "✅" },
  { key: "NSFAS_CONFIRMED", label: "NSFAS Confirmed", icon: "🏦" },
  { key: "LEASE_SIGNED", label: "Lease Signed", icon: "📄" },
];

export const StudentDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<string>("NOT_STARTED");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  // KYC Form state
  const [kycForm, setKycForm] = useState({
    id_type: "SA_ID",
    id_number: "",
    date_of_birth: "",
    institution_name: "",
    student_number: "",
  });

  const fetchData = async () => {
    try {
      const [appRes, kycRes] = await Promise.allSettled([
        applicationAPI.getMyApplications(),
        kycAPI.getStatus(),
      ]);
      if (appRes.status === "fulfilled") {
        setApplications(appRes.value.data?.applications || appRes.value.data || []);
      }
      if (kycRes.status === "fulfilled") {
        setKycStatus(kycRes.value.data?.kyc_status || "NOT_STARTED");
      }
    } catch (e) {
      console.error("Student dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleKycSubmit = async () => {
    if (!kycForm.id_number || !kycForm.date_of_birth || !kycForm.institution_name || !kycForm.student_number) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setKycSubmitting(true);
    try {
      await kycAPI.submit(kycForm);
      setKycStatus("PENDING");
      setKycModalVisible(false);
      Alert.alert(
        "KYC Submitted ✅",
        "Your verification documents have been submitted. You will be notified once reviewed."
      );
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Could not submit KYC. Please try again.");
    } finally {
      setKycSubmitting(false);
    }
  };

  const getKycBannerStyle = () => {
    switch (kycStatus) {
      case "VERIFIED": return { bg: "rgba(16,185,129,0.1)", border: Colors.success, text: Colors.success };
      case "PENDING": return { bg: "rgba(245,158,11,0.1)", border: Colors.warning, text: Colors.warning };
      default: return { bg: "rgba(239,68,68,0.1)", border: Colors.error, text: Colors.error };
    }
  };

  const kycBanner = getKycBannerStyle();
  const activeApp = applications.find((a) => a.status !== "REJECTED");
  const currentStepIndex = activeApp
    ? APP_WORKFLOW.findIndex((s) => s.key === activeApp.status)
    : -1;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={Colors.teal}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
              <Text style={styles.userRole}>Student</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* KYC Banner */}
        <View style={styles.section}>
          <View
            style={[
              styles.kycBanner,
              { backgroundColor: kycBanner.bg, borderColor: kycBanner.border },
            ]}
          >
            <View style={styles.kycBannerLeft}>
              <Text style={[styles.kycBannerTitle, { color: kycBanner.text }]}>
                {kycStatus === "VERIFIED"
                  ? "✅ Identity Verified"
                  : kycStatus === "PENDING"
                  ? "🕐 KYC Under Review"
                  : "⚠️ Identity Verification Required"}
              </Text>
              <Text style={styles.kycBannerSub}>
                {kycStatus === "VERIFIED"
                  ? "Your identity has been verified. You can apply for accommodation."
                  : kycStatus === "PENDING"
                  ? "Your documents are being reviewed. This usually takes 1–2 business days."
                  : "Verify your identity to apply for student accommodation."}
              </Text>
            </View>
            {kycStatus === "NOT_STARTED" && (
              <TouchableOpacity
                style={[styles.kycBtn, { backgroundColor: kycBanner.border }]}
                onPress={() => setKycModalVisible(true)}
              >
                <Text style={styles.kycBtnText}>Verify Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, Shadow.sm]}
              onPress={() => navigation.navigate("PropertyFeed")}
            >
              <Text style={styles.actionEmoji}>🔍</Text>
              <Text style={styles.actionLabel}>Find Accommodation</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, Shadow.sm]}
              onPress={() => navigation.navigate("MyApplications")}
            >
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionLabel}>My Applications</Text>
              {applications.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{applications.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Application Tracker */}
        {activeApp && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Application</Text>
            <View style={[styles.trackerCard, Shadow.sm]}>
              <Text style={styles.trackerPropertyName} numberOfLines={1}>
                🏠 {activeApp.property_title || activeApp.property_name}
              </Text>
              <Text style={styles.trackerDate}>
                Applied {new Date(activeApp.created_at).toLocaleDateString("en-ZA", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </Text>

              {/* Progress Steps */}
              <View style={styles.progressSteps}>
                {APP_WORKFLOW.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <View key={step.key} style={styles.progressStep}>
                      <View
                        style={[
                          styles.progressDot,
                          isCompleted && styles.progressDotCompleted,
                          isCurrent && styles.progressDotCurrent,
                        ]}
                      >
                        <Text style={styles.progressDotText}>
                          {isCompleted ? "✓" : idx + 1}
                        </Text>
                      </View>
                      {idx < APP_WORKFLOW.length - 1 && (
                        <View
                          style={[
                            styles.progressLine,
                            idx < currentStepIndex && styles.progressLineCompleted,
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.progressLabel,
                          isCompleted && styles.progressLabelCompleted,
                        ]}
                        numberOfLines={2}
                      >
                        {step.icon} {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Recent Applications */}
        {applications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate("MyApplications")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {applications.slice(0, 3).map((app: any) => (
              <View key={app.application_id} style={[styles.appRow, Shadow.sm]}>
                <View style={styles.appRowLeft}>
                  <Text style={styles.appRowProperty} numberOfLines={1}>
                    {app.property_title || app.property_name}
                  </Text>
                  <Text style={styles.appRowDate}>
                    {new Date(app.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </Text>
                </View>
                <StatusBadge status={app.status} size="sm" />
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* KYC Modal */}
      <Modal
        visible={kycModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setKycModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Identity Verification</Text>
            <TouchableOpacity onPress={() => setKycModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSub}>
              Please provide your identity details to verify your student status.
            </Text>

            <Text style={styles.fieldLabel}>ID Type</Text>
            <View style={styles.idTypeRow}>
              {["SA_ID", "PASSPORT", "ASYLUM"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.idTypeChip,
                    kycForm.id_type === type && styles.idTypeChipActive,
                  ]}
                  onPress={() => setKycForm({ ...kycForm, id_type: type })}
                >
                  <Text
                    style={[
                      styles.idTypeChipText,
                      kycForm.id_type === type && styles.idTypeChipTextActive,
                    ]}
                  >
                    {type === "SA_ID" ? "SA ID" : type === "PASSPORT" ? "Passport" : "Asylum"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="ID / Passport Number *"
              value={kycForm.id_number}
              onChangeText={(v) => setKycForm({ ...kycForm, id_number: v })}
              placeholder="Enter your ID number"
              autoCapitalize="characters"
            />
            <Input
              label="Date of Birth *"
              value={kycForm.date_of_birth}
              onChangeText={(v) => setKycForm({ ...kycForm, date_of_birth: v })}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Input
              label="Institution Name *"
              value={kycForm.institution_name}
              onChangeText={(v) => setKycForm({ ...kycForm, institution_name: v })}
              placeholder="e.g. University of Johannesburg"
            />
            <Input
              label="Student Number *"
              value={kycForm.student_number}
              onChangeText={(v) => setKycForm({ ...kycForm, student_number: v })}
              placeholder="e.g. 201912345"
            />

            <Button
              title={kycSubmitting ? "Submitting..." : "Submit Verification"}
              onPress={handleKycSubmit}
              variant="primary"
              loading={kycSubmitting}
              style={styles.kycSubmitBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.offWhite },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing["2xl"] },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)", marginBottom: 2 },
  userName: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.white, marginBottom: 2 },
  userRole: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.tealLight, letterSpacing: 0.5 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: "rgba(255,255,255,0.8)" },
  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.md },
  seeAll: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.teal },
  kycBanner: { borderRadius: BorderRadius.xl, borderWidth: 1.5, padding: Spacing.base, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  kycBannerLeft: { flex: 1 },
  kycBannerTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, marginBottom: 4 },
  kycBannerSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.8, lineHeight: 18 },
  kycBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  kycBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.xs, color: Colors.white },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: "center", position: "relative" },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy, textAlign: "center" },
  badge: { position: "absolute", top: 10, right: 10, backgroundColor: Colors.teal, borderRadius: BorderRadius.full, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.white },
  trackerCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base },
  trackerPropertyName: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: 4 },
  trackerDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginBottom: Spacing.base },
  progressSteps: { flexDirection: "row", justifyContent: "space-between" },
  progressStep: { flex: 1, alignItems: "center", position: "relative" },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.mutedGrey, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  progressDotCompleted: { backgroundColor: Colors.success },
  progressDotCurrent: { backgroundColor: Colors.teal },
  progressDotText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.white },
  progressLine: { position: "absolute", top: 14, left: "50%", right: "-50%", height: 2, backgroundColor: Colors.mutedGrey },
  progressLineCompleted: { backgroundColor: Colors.success },
  progressLabel: { fontFamily: FontFamily.regular, fontSize: 10, color: Colors.charcoal, opacity: 0.5, textAlign: "center", lineHeight: 14 },
  progressLabelCompleted: { opacity: 1, fontFamily: FontFamily.semiBold, color: Colors.navy },
  appRow: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  appRowLeft: { flex: 1, marginRight: 12 },
  appRowProperty: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy, marginBottom: 4 },
  appRowDate: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5 },
  bottomPad: { height: 32 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  modalTitle: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.navy },
  modalClose: { fontSize: 20, color: Colors.charcoal },
  modalBody: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  modalSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.7, lineHeight: 22, marginBottom: Spacing.xl },
  fieldLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy, marginBottom: 8 },
  idTypeRow: { flexDirection: "row", gap: 10, marginBottom: Spacing.lg },
  idTypeChip: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.mutedGrey, alignItems: "center" },
  idTypeChipActive: { borderColor: Colors.teal, backgroundColor: "rgba(26,155,173,0.08)" },
  idTypeChipText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.charcoal },
  idTypeChipTextActive: { color: Colors.teal },
  kycSubmitBtn: { marginTop: Spacing.xl, marginBottom: Spacing["2xl"] },
});
