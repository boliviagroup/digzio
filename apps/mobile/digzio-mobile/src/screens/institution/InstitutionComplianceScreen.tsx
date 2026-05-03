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
import { institutionAPI } from "../../services/api";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const ProviderCard: React.FC<{ provider: any }> = ({ provider }) => {
  const isCompliant = provider.is_compliant !== false;
  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardName} numberOfLines={1}>
            {provider.company_name || provider.provider_name}
          </Text>
          <Text style={styles.cardEmail} numberOfLines={1}>
            {provider.email}
          </Text>
        </View>
        <View
          style={[
            styles.complianceBadge,
            { backgroundColor: isCompliant ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" },
          ]}
        >
          <Text
            style={[
              styles.complianceBadgeText,
              { color: isCompliant ? Colors.success : Colors.error },
            ]}
          >
            {isCompliant ? "✓ Compliant" : "✗ Non-Compliant"}
          </Text>
        </View>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provider.total_properties || 0}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provider.total_beds || 0}</Text>
          <Text style={styles.statLabel}>Beds</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provider.occupied_beds || 0}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.teal }]}>
            {provider.total_properties
              ? Math.round(((provider.occupied_beds || 0) / Math.max(provider.total_beds || 1, 1)) * 100)
              : 0}%
          </Text>
          <Text style={styles.statLabel}>Occupancy</Text>
        </View>
      </View>
      {provider.nsfas_accredited && (
        <View style={styles.nsfasTag}>
          <Text style={styles.nsfasTagText}>NSFAS Accredited</Text>
        </View>
      )}
    </View>
  );
};

export const InstitutionComplianceScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "COMPLIANT" | "NON_COMPLIANT">("ALL");

  const fetchProviders = useCallback(async () => {
    try {
      const res = await institutionAPI.getProviders();
      setProviders(res.data?.providers || res.data || []);
    } catch (e) {
      console.error("Providers fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchProviders(); };

  const filtered = providers.filter((p) => {
    if (filter === "COMPLIANT") return p.is_compliant !== false;
    if (filter === "NON_COMPLIANT") return p.is_compliant === false;
    return true;
  });

  const compliantCount = providers.filter((p) => p.is_compliant !== false).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Compliance</Text>
        <Text style={styles.headerSub}>
          {compliantCount}/{providers.length} providers compliant
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["ALL", "COMPLIANT", "NON_COMPLIANT"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}
            >
              {f === "NON_COMPLIANT" ? "Non-Compliant" : f === "ALL" ? "All" : "Compliant"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.provider_id || item.user_id || item.email}
          renderItem={({ item }) => <ProviderCard provider={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>No providers found</Text>
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
  filterRow: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  filterTab: { flex: 1, paddingVertical: Spacing.md, alignItems: "center" },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  filterTabText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5 },
  filterTabTextActive: { color: Colors.teal, opacity: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.xl, gap: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  cardHeaderLeft: { flex: 1, marginRight: Spacing.md },
  cardName: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy },
  cardEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: 2 },
  complianceBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  complianceBadgeText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs },
  cardStats: { flexDirection: "row", justifyContent: "space-around", paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.mutedGrey },
  stat: { alignItems: "center" },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy },
  statLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.mutedGrey },
  nsfasTag: { marginTop: Spacing.md, backgroundColor: "rgba(26,155,173,0.1)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: "flex-start" },
  nsfasTagText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.teal },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy },
});
