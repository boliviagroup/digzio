import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { applicationAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const APP_WORKFLOW = [
  { key: "SUBMITTED", label: "Submitted", icon: "📝" },
  { key: "APPROVED", label: "Approved", icon: "✅" },
  { key: "NSFAS_CONFIRMED", label: "NSFAS", icon: "🏦" },
  { key: "LEASE_SIGNED", label: "Lease", icon: "📄" },
];

const ApplicationCard: React.FC<{ application: any }> = ({ application: app }) => {
  const currentStepIndex = APP_WORKFLOW.findIndex((s) => s.key === app.status);
  const isRejected = app.status === "REJECTED";

  return (
    <View style={[styles.card, Shadow.sm]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.propertyName} numberOfLines={1}>
            {app.property_title || app.property_name}
          </Text>
          <Text style={styles.propertyLocation} numberOfLines={1}>
            📍 {app.property_city || ""}
          </Text>
        </View>
        <StatusBadge status={app.status} size="sm" />
      </View>

      {/* Price */}
      {app.price_per_month && (
        <Text style={styles.price}>
          R{Number(app.price_per_month).toLocaleString()}/month
        </Text>
      )}

      {/* Progress */}
      {!isRejected && (
        <View style={styles.progress}>
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
                >
                  {step.icon}
                  {"\n"}
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {isRejected && (
        <View style={styles.rejectedBanner}>
          <Text style={styles.rejectedText}>
            ❌ This application was not successful
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          Applied{" "}
          {new Date(app.created_at).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
        {app.move_in_date && (
          <Text style={styles.moveInText}>
            Move-in:{" "}
            {new Date(app.move_in_date).toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}
      </View>
    </View>
  );
};

export const MyApplicationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await applicationAPI.getMyApplications();
      setApplications(res.data?.applications || res.data || []);
    } catch (e) {
      console.error("My applications fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerCount}>{applications.length}</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.application_id}
        renderItem={({ item }) => <ApplicationCard application={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchApplications();
            }}
            tintColor={Colors.teal}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Browse properties and apply for student accommodation.
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => navigation.navigate("PropertyFeed")}
            >
              <Text style={styles.browseBtnText}>Browse Properties</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.offWhite },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  backText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.teal },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy },
  headerCount: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.teal },
  list: { padding: Spacing.xl, gap: 16 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.base },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  cardHeaderLeft: { flex: 1, marginRight: 12 },
  propertyName: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: 2 },
  propertyLocation: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6 },
  price: { fontFamily: FontFamily.extraBold, fontSize: FontSize.lg, color: Colors.teal, marginBottom: Spacing.base },
  progress: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.mutedGrey, marginBottom: Spacing.md },
  progressStep: { flex: 1, alignItems: "center", position: "relative" },
  progressDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.mutedGrey, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  progressDotCompleted: { backgroundColor: Colors.success },
  progressDotCurrent: { backgroundColor: Colors.teal },
  progressDotText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.white },
  progressLine: { position: "absolute", top: 13, left: "50%", right: "-50%", height: 2, backgroundColor: Colors.mutedGrey },
  progressLineCompleted: { backgroundColor: Colors.success },
  progressLabel: { fontFamily: FontFamily.regular, fontSize: 10, color: Colors.charcoal, opacity: 0.5, textAlign: "center", lineHeight: 14 },
  progressLabelCompleted: { opacity: 1, fontFamily: FontFamily.semiBold, color: Colors.navy },
  rejectedBanner: { backgroundColor: "rgba(239,68,68,0.08)", borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, alignItems: "center" },
  rejectedText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.error },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Colors.mutedGrey, paddingTop: 10 },
  dateText: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5 },
  moveInText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.teal },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, color: Colors.navy, marginBottom: 8 },
  emptyText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.7, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xl },
  browseBtn: { backgroundColor: Colors.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BorderRadius.full },
  browseBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
});
