import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
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

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent, icon }) => (
  <View style={[styles.statCard, Shadow.sm]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, accent ? { color: accent } : {}]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

export const InstitutionDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await institutionAPI.getOverview();
      setOverview(res.data);
    } catch (e) {
      console.error("Institution overview error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const housingRate = overview
    ? Math.round((overview.housed_students / Math.max(overview.total_students, 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
      >
        {/* Header */}
        <LinearGradient colors={Gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Institution Portal</Text>
              <Text style={styles.institutionName} numberOfLines={2}>
                {overview?.institution_name || user?.institution_name || "Your Institution"}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Housing Rate Progress */}
          {overview && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Student Housing Rate</Text>
                <Text style={styles.progressPct}>{housingRate}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${housingRate}%` }]} />
              </View>
              <Text style={styles.progressSub}>
                {overview.housed_students?.toLocaleString()} of {overview.total_students?.toLocaleString()} students housed
              </Text>
            </View>
          )}
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.teal} />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Stats Grid */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="🎓"
                label="Total Students"
                value={overview?.total_students?.toLocaleString() || "0"}
                accent={Colors.navy}
              />
              <StatCard
                icon="🏠"
                label="Housed"
                value={overview?.housed_students?.toLocaleString() || "0"}
                accent={Colors.success}
              />
              <StatCard
                icon="🏢"
                label="Active Providers"
                value={overview?.active_providers?.toLocaleString() || "0"}
                accent={Colors.teal}
              />
              <StatCard
                icon="📋"
                label="Pending Apps"
                value={overview?.pending_applications?.toLocaleString() || "0"}
                accent={Colors.warning}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {[
                {
                  icon: "👥",
                  label: "Student Registry",
                  desc: "View all registered students",
                  screen: "InstitutionStudents",
                },
                {
                  icon: "🏢",
                  label: "Provider Compliance",
                  desc: "Review accredited providers",
                  screen: "InstitutionCompliance",
                },
                {
                  icon: "📊",
                  label: "DHET Report",
                  desc: "Generate housing report",
                  screen: "InstitutionDHET",
                },
              ].map((action) => (
                <TouchableOpacity
                  key={action.screen}
                  style={[styles.actionCard, Shadow.sm]}
                  onPress={() => navigation.navigate(action.screen)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDesc}>{action.desc}</Text>
                  <Text style={styles.actionArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: Spacing.xl, paddingBottom: Spacing["2xl"] },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.xl },
  headerLeft: { flex: 1, marginRight: Spacing.md },
  greeting: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  institutionName: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.white, lineHeight: 30 },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.white },
  progressSection: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: BorderRadius.lg, padding: Spacing.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm },
  progressLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: "rgba(255,255,255,0.85)" },
  progressPct: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.white },
  progressBar: { height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
  progressFill: { height: 8, backgroundColor: Colors.tealLight, borderRadius: BorderRadius.full },
  progressSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: "rgba(255,255,255,0.65)" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing["3xl"] },
  content: { padding: Spacing.xl },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: "47%", alignItems: "center" },
  statIcon: { fontSize: 24, marginBottom: Spacing.sm },
  statValue: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.navy, marginBottom: 2 },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, textAlign: "center" },
  statSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginTop: 2 },
  actionsGrid: { gap: Spacing.md },
  actionCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  actionIcon: { fontSize: 28, marginRight: Spacing.md },
  actionLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, flex: 1 },
  actionDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, width: "100%", marginTop: 2, paddingLeft: 44 },
  actionArrow: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.teal },
});
