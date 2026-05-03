import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { institutionAPI } from "../../services/api";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

export const InstitutionDHETScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await institutionAPI.getDHETReport();
      setReport(res.data);
    } catch (e) {
      console.error("DHET report error:", e);
      Alert.alert("Error", "Failed to load DHET report.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    const text = [
      `DHET Housing Report — ${report.institution}`,
      `Generated: ${new Date(report.generated_at).toLocaleDateString("en-ZA")}`,
      `Period: ${report.report_period}`,
      ``,
      `Total Students: ${report.total_students}`,
      `Housed Students: ${report.housed_students || 0}`,
      `Housing Rate: ${report.housing_rate || 0}%`,
      `NSFAS Students: ${report.nsfas_students || 0}`,
      ``,
      `Generated via Digzio Platform`,
    ].join("\n");
    await Share.share({ message: text, title: "DHET Housing Report" });
  };

  const housingRate = report
    ? Math.round(((report.housed_students || 0) / Math.max(report.total_students || 1, 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>DHET Housing Report</Text>
          <Text style={styles.headerSub}>
            Department of Higher Education & Training
          </Text>
        </View>
        {!loading && report && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share ↗</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
          <Text style={styles.loadingText}>Generating report...</Text>
        </View>
      ) : report ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Report Header */}
          <View style={[styles.reportHeader, Shadow.sm]}>
            <Text style={styles.reportInstitution}>{report.institution}</Text>
            <Text style={styles.reportMeta}>
              Period: {report.report_period}
            </Text>
            <Text style={styles.reportMeta}>
              Generated: {new Date(report.generated_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
          </View>

          {/* Summary Stats */}
          <Text style={styles.sectionTitle}>Summary Statistics</Text>
          <View style={styles.statsGrid}>
            {[
              { label: "Total Students", value: report.total_students?.toLocaleString() || "0", icon: "🎓", color: Colors.navy },
              { label: "Housed Students", value: (report.housed_students || 0).toLocaleString(), icon: "🏠", color: Colors.success },
              { label: "Housing Rate", value: `${housingRate}%`, icon: "📊", color: Colors.teal },
              { label: "NSFAS Students", value: (report.nsfas_students || 0).toLocaleString(), icon: "🏦", color: Colors.warning },
              { label: "Pending Applications", value: (report.pending_applications || 0).toLocaleString(), icon: "📋", color: Colors.charcoal },
              { label: "Active Providers", value: (report.active_providers || 0).toLocaleString(), icon: "🏢", color: Colors.teal },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, Shadow.sm]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Housing Rate Progress */}
          <View style={[styles.progressCard, Shadow.sm]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Student Housing Rate</Text>
              <Text style={styles.progressPct}>{housingRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${housingRate}%`,
                    backgroundColor: housingRate >= 70 ? Colors.success : housingRate >= 40 ? Colors.warning : Colors.error,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressTarget}>
              DHET target: 70% housing rate
            </Text>
          </View>

          {/* Student Breakdown */}
          {report.students && report.students.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Student Sample</Text>
              <Text style={styles.sectionSub}>
                Showing {Math.min(report.students.length, 10)} of {report.total_students} students
              </Text>
              {report.students.slice(0, 10).map((s: any, i: number) => (
                <View key={i} style={[styles.studentRow, Shadow.sm]}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {(s.first_name?.[0] || "?").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {s.first_name} {s.last_name}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {s.student_number} · {s.institution_name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.housedBadge,
                      { backgroundColor: s.is_housed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.housedBadgeText,
                        { color: s.is_housed ? Colors.success : Colors.error },
                      ]}
                    >
                      {s.is_housed ? "Housed" : "Unhoused"}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              This report is generated automatically by the Digzio Platform and
              is compliant with DHET Student Housing Reporting Requirements.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load report</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReport}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: Spacing.xl, paddingBottom: Spacing["2xl"] },
  backBtn: { marginBottom: Spacing.md },
  backText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)" },
  headerContent: { flex: 1 },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)" },
  shareBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: "flex-start", marginTop: Spacing.md },
  shareBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.white },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, marginTop: Spacing.md },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing["3xl"] },
  reportHeader: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  reportInstitution: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  reportMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.6, marginBottom: 2 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  sectionSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginBottom: Spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: "47%", alignItems: "center" },
  statIcon: { fontSize: 22, marginBottom: Spacing.sm },
  statValue: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, marginBottom: 2 },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, textAlign: "center" },
  progressCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  progressTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy },
  progressPct: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.teal },
  progressBar: { height: 10, backgroundColor: Colors.mutedGrey, borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
  progressFill: { height: 10, borderRadius: BorderRadius.full },
  progressTarget: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5 },
  studentRow: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
  studentAvatar: { width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  studentAvatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
  studentInfo: { flex: 1 },
  studentName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  studentMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: 1 },
  housedBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  housedBadgeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },
  footer: { marginTop: Spacing.xl, padding: Spacing.lg, backgroundColor: "rgba(15,45,74,0.05)", borderRadius: BorderRadius.lg },
  footerText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, lineHeight: 18, textAlign: "center" },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorIcon: { fontSize: 48, marginBottom: Spacing.md },
  errorText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.base, color: Colors.charcoal, marginBottom: Spacing.lg },
  retryBtn: { backgroundColor: Colors.teal, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  retryText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
});
