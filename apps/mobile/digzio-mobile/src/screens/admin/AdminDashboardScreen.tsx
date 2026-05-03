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
import { adminAPI } from "../../services/api";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  accent?: string;
  onPress?: () => void;
}> = ({ icon, label, value, accent, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, Shadow.sm]}
    onPress={onPress}
    activeOpacity={onPress ? 0.8 : 1}
  >
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, accent ? { color: accent } : {}]}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
    {onPress && <Text style={styles.statArrow}>→</Text>}
  </TouchableOpacity>
);

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (e) {
      console.error("Admin stats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
      >
        {/* Header */}
        <LinearGradient colors={Gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Admin Console</Text>
              <Text style={styles.adminName}>
                {user?.first_name} {user?.last_name}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.platformBadge}>
            <Text style={styles.platformBadgeText}>🌍 Digzio Platform — Production</Text>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.teal} />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Platform Stats */}
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="🎓"
                label="Students"
                value={stats?.students || 0}
                accent={Colors.navy}
                onPress={() => navigation.navigate("AdminUsers")}
              />
              <StatCard
                icon="🏢"
                label="Providers"
                value={stats?.providers || 0}
                accent={Colors.teal}
                onPress={() => navigation.navigate("AdminUsers")}
              />
              <StatCard
                icon="🏠"
                label="Properties"
                value={stats?.properties || 0}
                accent={Colors.success}
                onPress={() => navigation.navigate("AdminProperties")}
              />
              <StatCard
                icon="📋"
                label="Applications"
                value={stats?.total_applications || 0}
                accent={Colors.warning}
                onPress={() => navigation.navigate("AdminApplications")}
              />
              <StatCard
                icon="⏳"
                label="KYC Pending"
                value={stats?.kyc_pending || 0}
                accent={Colors.warning}
                onPress={() => navigation.navigate("AdminKYC")}
              />
              <StatCard
                icon="👥"
                label="Total Users"
                value={(stats?.students || 0) + (stats?.providers || 0)}
                accent={Colors.navy}
                onPress={() => navigation.navigate("AdminUsers")}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Manage</Text>
            {[
              { icon: "👥", label: "User Management", desc: "View and manage all users", screen: "AdminUsers" },
              { icon: "🏠", label: "Properties", desc: "Browse all listed properties", screen: "AdminProperties" },
              { icon: "📋", label: "Applications", desc: "Review all housing applications", screen: "AdminApplications" },
              { icon: "🔍", label: "KYC Queue", desc: `${stats?.kyc_pending || 0} pending verifications`, screen: "AdminKYC" },
            ].map((action) => (
              <TouchableOpacity
                key={action.screen}
                style={[styles.actionRow, Shadow.sm]}
                onPress={() => navigation.navigate(action.screen)}
                activeOpacity={0.85}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionDesc}>{action.desc}</Text>
                </View>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: Spacing.xl, paddingBottom: Spacing["2xl"] },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.lg },
  greeting: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  adminName: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.white },
  logoutBtn: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  logoutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.white },
  platformBadge: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: "flex-start" },
  platformBadgeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: "rgba(255,255,255,0.85)" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing["3xl"] },
  content: { padding: Spacing.xl },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: "47%", alignItems: "center" },
  statIcon: { fontSize: 24, marginBottom: Spacing.sm },
  statValue: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.navy, marginBottom: 2 },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, textAlign: "center" },
  statArrow: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.teal, marginTop: 4 },
  actionRow: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  actionIcon: { fontSize: 28, marginRight: Spacing.md },
  actionContent: { flex: 1 },
  actionLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy },
  actionDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: 2 },
  actionArrow: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.teal },
});
