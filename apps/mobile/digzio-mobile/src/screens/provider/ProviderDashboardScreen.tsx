import React, { useEffect, useState } from "react";
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
import { propertyAPI, applicationAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, accent }) => (
  <View style={[styles.statCard, Shadow.sm]}>
    <Text style={[styles.statValue, accent ? { color: accent } : {}]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

export const ProviderDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [propRes, appRes] = await Promise.all([
        propertyAPI.getMyProperties(),
        applicationAPI.getProviderApplications(),
      ]);
      setProperties(propRes.data?.properties || propRes.data || []);
      setApplications(appRes.data?.applications || appRes.data || []);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Computed stats
  const totalBeds = properties.reduce(
    (sum: number, p: any) => sum + (p.total_beds || 0),
    0
  );
  const occupiedBeds = properties.reduce(
    (sum: number, p: any) => sum + (p.occupied_beds || 0),
    0
  );
  const pendingApps = applications.filter(
    (a: any) => a.status === "SUBMITTED" || a.status === "PENDING"
  ).length;
  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const recentApplications = applications.slice(0, 5);

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
            onRefresh={onRefresh}
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
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.userRole}>Property Provider</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Properties"
              value={properties.length}
              sub="Total listings"
            />
            <StatCard
              label="Total Beds"
              value={totalBeds}
              sub="Across all properties"
            />
            <StatCard
              label="Occupancy"
              value={`${occupancyRate}%`}
              sub={`${occupiedBeds}/${totalBeds} beds`}
              accent={occupancyRate >= 80 ? Colors.success : Colors.warning}
            />
            <StatCard
              label="Pending"
              value={pendingApps}
              sub="Applications"
              accent={pendingApps > 0 ? Colors.warning : Colors.success}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, Shadow.sm]}
              onPress={() => navigation.navigate("Portfolio")}
            >
              <Text style={styles.actionEmoji}>🏠</Text>
              <Text style={styles.actionLabel}>My Properties</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, Shadow.sm]}
              onPress={() => navigation.navigate("Applications")}
            >
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionLabel}>Applications</Text>
              {pendingApps > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingApps}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Applications */}
        {recentApplications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Applications")}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {recentApplications.map((app: any) => (
              <TouchableOpacity
                key={app.application_id}
                style={[styles.appCard, Shadow.sm]}
                onPress={() =>
                  navigation.navigate("ApplicationDetail", { application: app })
                }
              >
                <View style={styles.appCardContent}>
                  <View style={styles.appCardLeft}>
                    <Text style={styles.appStudentName}>
                      {app.student_first_name} {app.student_last_name}
                    </Text>
                    <Text style={styles.appPropertyName} numberOfLines={1}>
                      {app.property_title || app.property_name}
                    </Text>
                    <Text style={styles.appDate}>
                      {new Date(app.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <StatusBadge status={app.status} size="sm" />
                </View>
              </TouchableOpacity>
            ))}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.offWhite,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  userName: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.white,
    marginBottom: 2,
  },
  userRole: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.tealLight,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoutText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.8)",
  },
  statsSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: -Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    width: "47%",
    alignItems: "center",
  },
  statValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["3xl"],
    color: Colors.navy,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    textAlign: "center",
  },
  statSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    textAlign: "center",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    marginBottom: Spacing.md,
  },
  seeAll: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.teal,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.white,
  },
  appCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: 10,
  },
  appCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  appStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
    marginBottom: 2,
  },
  appPropertyName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.8,
    marginBottom: 4,
  },
  appDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.5,
  },
  bottomPad: {
    height: 32,
  },
});
