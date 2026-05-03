import React, { useEffect, useState, useCallback } from "react";
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
import { adminAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const ApplicationRow: React.FC<{ app: any }> = ({ app }) => (
  <View style={[styles.card, Shadow.sm]}>
    <View style={styles.cardHeader}>
      <View style={styles.cardLeft}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {app.property_title || app.property_name || "Property"}
        </Text>
        <Text style={styles.studentName} numberOfLines={1}>
          👤 {app.student_first_name} {app.student_last_name}
        </Text>
        <Text style={styles.cardMeta}>
          📍 {app.property_city || ""} · {new Date(app.applied_at || app.created_at).toLocaleDateString("en-ZA")}
        </Text>
      </View>
      <StatusBadge status={app.status?.toLowerCase() || "submitted"} size="sm" />
    </View>
    {app.provider_name && (
      <Text style={styles.providerName}>🏢 {app.provider_name}</Text>
    )}
  </View>
);

export const AdminApplicationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchApplications = useCallback(async (reset = false) => {
    try {
      const offset = reset ? 0 : page * LIMIT;
      const res = await adminAPI.getAllApplications({ limit: LIMIT, offset });
      const list = res.data?.applications || res.data || [];
      setTotal(res.data?.total || list.length);
      if (reset) { setApplications(list); setPage(0); }
      else { setApplications((prev) => [...prev, ...list]); }
    } catch (e) {
      console.error("Admin applications error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => { fetchApplications(true); }, []);
  const onRefresh = () => { setRefreshing(true); fetchApplications(true); };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Applications</Text>
        <Text style={styles.headerSub}>{total.toLocaleString()} total applications</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.application_id || item.id}
          renderItem={({ item }) => <ApplicationRow app={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          onEndReached={() => { if (applications.length < total) { setPage((p) => p + 1); fetchApplications(); } }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No applications found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { backgroundColor: Colors.navy, padding: Spacing.xl, paddingBottom: Spacing.lg },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)" },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.white },
  headerSub: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.xl, gap: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: { flex: 1, marginRight: Spacing.md },
  propertyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: 2 },
  studentName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.charcoal, marginBottom: 2 },
  cardMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6 },
  providerName: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: Spacing.sm },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy },
});
