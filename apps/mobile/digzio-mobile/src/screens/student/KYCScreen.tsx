import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { kycAPI, institutionAPI } from "../../services/api";
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

const ID_TYPES = [
  { label: "SA ID Book / Smart Card", value: "SA_ID" },
  { label: "Passport", value: "PASSPORT" },
  { label: "Asylum Seeker Permit", value: "ASYLUM" },
];

const KYC_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string; desc: string }
> = {
  NOT_STARTED: {
    label: "Not Verified",
    color: Colors.error,
    icon: "⚠️",
    desc: "Submit your identity documents to unlock full platform access.",
  },
  PENDING: {
    label: "Under Review",
    color: Colors.warning,
    icon: "⏳",
    desc: "Your documents are being reviewed. This usually takes 1–2 business days.",
  },
  VERIFIED: {
    label: "Verified",
    color: Colors.success,
    icon: "✅",
    desc: "Your identity has been verified. You have full access to the platform.",
  },
  REJECTED: {
    label: "Rejected",
    color: Colors.error,
    icon: "❌",
    desc: "Your verification was rejected. Please resubmit with correct information.",
  },
};

export const KYCScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [kycStatus, setKycStatus] = useState<string>("NOT_STARTED");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selectedIdType, setSelectedIdType] = useState("SA_ID");
  const [showIdTypeDropdown, setShowIdTypeDropdown] = useState(false);
  const [form, setForm] = useState({
    id_number: "",
    date_of_birth: "",
    institution_name: "",
    student_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStatus();
    fetchInstitutions();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await kycAPI.getStatus();
      setKycStatus(res.data?.kyc_status || res.data?.status || "NOT_STARTED");
    } catch {
      setKycStatus("NOT_STARTED");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await institutionAPI.getAll();
      const list = res.data?.institutions || res.data || [];
      setInstitutions(list);
    } catch {
      // Non-critical
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.id_number.trim()) errs.id_number = "ID number is required";
    if (!form.date_of_birth.trim()) {
      errs.date_of_birth = "Date of birth is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth)) {
      errs.date_of_birth = "Use format YYYY-MM-DD (e.g. 2000-01-15)";
    }
    if (!form.institution_name.trim())
      errs.institution_name = "Institution name is required";
    if (!form.student_number.trim())
      errs.student_number = "Student number is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await kycAPI.submit({
        id_type: selectedIdType,
        id_number: form.id_number.trim(),
        date_of_birth: form.date_of_birth.trim(),
        institution_name: form.institution_name.trim(),
        student_number: form.student_number.trim(),
      });
      setKycStatus("PENDING");
      Alert.alert(
        "Documents Submitted! ⏳",
        "Your identity documents have been submitted for review. You will be notified once verified (usually 1–2 business days).",
        [{ text: "OK" }]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Failed to submit. Please check your details and try again.";
      Alert.alert("Submission Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = KYC_STATUS_CONFIG[kycStatus] || KYC_STATUS_CONFIG.NOT_STARTED;
  const canSubmit = kycStatus === "NOT_STARTED" || kycStatus === "REJECTED";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading KYC status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={styles.headerSub}>
            KYC verification is required to apply for accommodation
          </Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Status Banner */}
          <View
            style={[
              styles.statusBanner,
              { borderLeftColor: statusConfig.color },
              Shadow.sm,
            ]}
          >
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
              <Text style={styles.statusDesc}>{statusConfig.desc}</Text>
            </View>
          </View>

          {/* Form — only show if can submit */}
          {canSubmit && (
            <>
              <Text style={styles.sectionTitle}>Your Information</Text>

              {/* ID Type Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  ID Type <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowIdTypeDropdown(!showIdTypeDropdown)}
                >
                  <Text style={styles.selectorText}>
                    {ID_TYPES.find((t) => t.value === selectedIdType)?.label}
                  </Text>
                  <Text style={styles.selectorChevron}>
                    {showIdTypeDropdown ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {showIdTypeDropdown && (
                  <View style={[styles.dropdown, Shadow.md]}>
                    {ID_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[
                          styles.dropdownItem,
                          selectedIdType === t.value &&
                            styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedIdType(t.value);
                          setShowIdTypeDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedIdType === t.value &&
                              styles.dropdownItemTextActive,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <Input
                label="ID / Passport Number"
                value={form.id_number}
                onChangeText={(v) => setForm((f) => ({ ...f, id_number: v }))}
                placeholder="e.g. 0001015009087"
                error={errors.id_number}
                required
                autoCapitalize="characters"
              />

              <Input
                label="Date of Birth"
                value={form.date_of_birth}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, date_of_birth: v }))
                }
                placeholder="YYYY-MM-DD (e.g. 2000-01-15)"
                error={errors.date_of_birth}
                required
                keyboardType="numbers-and-punctuation"
              />

              <Input
                label="Institution Name"
                value={form.institution_name}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, institution_name: v }))
                }
                placeholder="e.g. University of Johannesburg"
                error={errors.institution_name}
                required
              />

              <Input
                label="Student Number"
                value={form.student_number}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, student_number: v }))
                }
                placeholder="e.g. 202012345"
                error={errors.student_number}
                required
                autoCapitalize="characters"
              />

              {/* Privacy note */}
              <View style={styles.privacyNote}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyText}>
                  Your information is encrypted and stored securely. It is only
                  used for identity verification and will never be shared with
                  third parties.
                </Text>
              </View>

              <Button
                title="Submit for Verification"
                onPress={handleSubmit}
                loading={submitting}
                style={styles.submitBtn}
              />
            </>
          )}

          {/* Verified state — show what's unlocked */}
          {kycStatus === "VERIFIED" && (
            <View style={styles.verifiedSection}>
              <Text style={styles.sectionTitle}>What's Unlocked</Text>
              {[
                "Apply for any listed property",
                "NSFAS-accredited property access",
                "Lease signing and management",
                "Incident reporting",
              ].map((item) => (
                <View key={item} style={styles.unlockedRow}>
                  <Text style={styles.unlockedIcon}>✓</Text>
                  <Text style={styles.unlockedText}>{item}</Text>
                </View>
              ))}
              <Button
                title="Browse Properties"
                onPress={() => navigation.navigate("Search")}
                style={styles.browseBtn}
              />
            </View>
          )}

          {/* Pending state */}
          {kycStatus === "PENDING" && (
            <View style={styles.pendingSection}>
              <Text style={styles.sectionTitle}>While You Wait</Text>
              <Text style={styles.pendingText}>
                You can still browse available properties and save them for when
                your verification is complete.
              </Text>
              <Button
                title="Browse Properties"
                onPress={() => navigation.navigate("Search")}
                variant="outline"
                style={styles.browseBtn}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.charcoal,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  backBtn: { marginBottom: Spacing.md },
  backBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.75)",
  },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["3xl"] },
  statusBanner: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  statusIcon: { fontSize: 24, marginRight: Spacing.md },
  statusContent: { flex: 1 },
  statusLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    marginBottom: 4,
  },
  statusDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    marginBottom: Spacing.lg,
  },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
    marginBottom: Spacing.sm,
  },
  required: { color: Colors.error },
  selector: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.navy,
  },
  selectorChevron: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.5,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  dropdownItemActive: { backgroundColor: "rgba(26,155,173,0.08)" },
  dropdownItemText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.navy,
  },
  dropdownItemTextActive: {
    fontFamily: FontFamily.semiBold,
    color: Colors.teal,
  },
  privacyNote: {
    flexDirection: "row",
    backgroundColor: "rgba(26,155,173,0.06)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: "flex-start",
  },
  privacyIcon: { fontSize: 16, marginRight: Spacing.sm, marginTop: 1 },
  privacyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.8,
    lineHeight: 18,
    flex: 1,
  },
  submitBtn: { marginBottom: Spacing.md },
  verifiedSection: { marginTop: Spacing.md },
  unlockedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  unlockedIcon: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.success,
    marginRight: Spacing.md,
    width: 20,
  },
  unlockedText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
  },
  browseBtn: { marginTop: Spacing.lg },
  pendingSection: { marginTop: Spacing.md },
  pendingText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
});
