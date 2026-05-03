import React, { useState } from "react";
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
import { applicationAPI } from "../../services/api";
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

export const ApplyScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { property } = route.params;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    move_in_date: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.move_in_date) {
      errs.move_in_date = "Move-in date is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.move_in_date)) {
      errs.move_in_date = "Use format YYYY-MM-DD (e.g. 2026-02-01)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await applicationAPI.submit({
        property_id: property.property_id,
        move_in_date: form.move_in_date,
        message: form.message || undefined,
      });
      Alert.alert(
        "Application Submitted! 🎉",
        "Your application has been sent to the provider. You can track its status in My Applications.",
        [
          {
            text: "View My Applications",
            onPress: () => navigation.navigate("MyApplications"),
          },
          {
            text: "Back to Search",
            onPress: () => navigation.navigate("Search"),
            style: "cancel",
          },
        ]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Failed to submit application. Please try again.";
      if (msg.includes("already applied")) {
        Alert.alert(
          "Already Applied",
          "You have already submitted an application for this property.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text style={styles.headerTitle}>Apply for Accommodation</Text>
          <Text style={styles.headerSub} numberOfLines={2}>
            {property.title}
          </Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Property Summary */}
          <View style={[styles.propertySummary, Shadow.sm]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Property</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {property.title}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>
                {property.city}, {property.province}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Rent</Text>
              <Text style={[styles.summaryValue, styles.priceValue]}>
                R{Number(property.price_per_month || 0).toLocaleString()}/mo
              </Text>
            </View>
            {property.nsfas_accredited && (
              <>
                <View style={styles.divider} />
                <View style={styles.nsfasBadge}>
                  <Text style={styles.nsfasBadgeText}>✓ NSFAS Accredited</Text>
                </View>
              </>
            )}
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Application Details</Text>

            <Input
              label="Preferred Move-in Date"
              value={form.move_in_date}
              onChangeText={(v) => setForm((f) => ({ ...f, move_in_date: v }))}
              placeholder="YYYY-MM-DD (e.g. 2026-02-01)"
              error={errors.move_in_date}
              required
              keyboardType="numbers-and-punctuation"
            />

            <Input
              label="Message to Provider (optional)"
              value={form.message}
              onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
              placeholder="Introduce yourself, mention your institution, NSFAS status, etc."
              multiline
              numberOfLines={4}
              style={styles.messageInput}
            />
          </View>

          {/* What happens next */}
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>What happens next?</Text>
            {[
              {
                step: "1",
                title: "Application Submitted",
                desc: "Provider receives your application immediately.",
              },
              {
                step: "2",
                title: "Provider Review",
                desc: "Provider reviews and approves or rejects within 48 hours.",
              },
              {
                step: "3",
                title: "NSFAS Confirmation",
                desc: "If NSFAS funded, your funding is confirmed.",
              },
              {
                step: "4",
                title: "Lease Signed",
                desc: "Sign your lease and secure your accommodation.",
              },
            ].map((item) => (
              <View key={item.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Submit */}
          <Button
            title="Submit Application"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submitBtn}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  flex: { flex: 1 },
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
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  propertySummary: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.6,
  },
  summaryValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
    flex: 1,
    textAlign: "right",
  },
  priceValue: {
    color: Colors.teal,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.mutedGrey,
  },
  nsfasBadge: {
    backgroundColor: "rgba(26,155,173,0.1)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  nsfasBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.teal,
  },
  formSection: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    marginBottom: Spacing.lg,
  },
  messageInput: { height: 100, textAlignVertical: "top" },
  stepsSection: { marginBottom: Spacing.xl },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
    marginBottom: 2,
  },
  stepDesc: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.7,
    lineHeight: 18,
  },
  submitBtn: { marginBottom: Spacing.md },
  cancelBtn: {},
});
