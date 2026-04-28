import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
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

type FilterStatus = "ALL" | "SUBMITTED" | "APPROVED" | "REJECTED" | "NSFAS_CONFIRMED" | "LEASE_SIGNED";

const FILTERS: { label: string; value: FilterStatus }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "NSFAS", value: "NSFAS_CONFIRMED" },
  { label: "Lease", value: "LEASE_SIGNED" },
  { label: "Rejected", value: "REJECTED" },
];

export const ProviderApplicationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");

  const fetchApplications = async () => {
    try {
      const res = await applicationAPI.getProviderApplications();
      const apps = res.data?.applications || res.data || [];
      setApplications(apps);
      applyFilters(apps, activeFilter, search);
    } catch (e) {
      console.error("Applications fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (
    apps: any[],
    filter: FilterStatus,
    searchText: string
  ) => {
    let result = apps;
    if (filter !== "ALL") {
      result = result.filter((a) => a.status === filter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (a) =>
          `${a.student_first_name} ${a.student_last_name}`
            .toLowerCase()
            .includes(q) ||
          (a.property_title || a.property_name || "")
            .toLowerCase()
            .includes(q)
      );
    }
    setFiltered(result);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters(applications, activeFilter, search);
  }, [activeFilter, search, applications]);

  const pendingCount = applications.filter(
    (a) => a.status === "SUBMITTED"
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Applications</Text>
          <Text style={styles.headerSub}>
            {applications.length} total
            {pendingCount > 0 ? ` · ${pendingCount} pending review` : ""}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student or property..."
          placeholderTextColor={Colors.charcoal + "80"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const count =
            item.value === "ALL"
              ? applications.length
              : applications.filter((a) => a.status === item.value).length;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Applications List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.application_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.appCard, Shadow.sm]}
            onPress={() =>
              navigation.navigate("ApplicationDetail", { application: item })
            }
            activeOpacity={0.85}
          >
            <View style={styles.appCardTop}>
              <View style={styles.appAvatar}>
                <Text style={styles.appAvatarText}>
                  {(item.student_first_name || "?")[0]}
                  {(item.student_last_name || "?")[0]}
                </Text>
              </View>
              <View style={styles.appCardInfo}>
                <Text style={styles.appStudentName}>
                  {item.student_first_name} {item.student_last_name}
                </Text>
                <Text style={styles.appEmail} numberOfLines={1}>
                  {item.student_email}
                </Text>
              </View>
              <StatusBadge status={item.status} size="sm" />
            </View>
            <View style={styles.appCardBottom}>
              <Text style={styles.appPropertyName} numberOfLines={1}>
                🏠 {item.property_title || item.property_name}
              </Text>
              <Text style={styles.appDate}>
                {new Date(item.created_at).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            {item.kyc_status && (
              <View style={styles.appCardMeta}>
                <Text style={styles.appMetaLabel}>KYC:</Text>
                <StatusBadge status={item.kyc_status} size="sm" />
                {item.nsfas_status && (
                  <>
                    <Text style={[styles.appMetaLabel, { marginLeft: 12 }]}>
                      NSFAS:
                    </Text>
                    <StatusBadge status={item.nsfas_status} size="sm" />
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
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
            <Text style={styles.emptyTitle}>No applications found</Text>
            <Text style={styles.emptyText}>
              {search
                ? "Try adjusting your search or filter."
                : "Applications from students will appear here."}
            </Text>
          </View>
        }
      />
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
    paddingBottom: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.navy,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.6,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  searchInput: {
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
  },
  filterList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.mutedGrey,
  },
  filterChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.xl,
    gap: 12,
  },
  appCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  appCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  appAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  appAvatarText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  appCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  appStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
    marginBottom: 2,
  },
  appEmail: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
  },
  appCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.mutedGrey,
    marginTop: 4,
  },
  appPropertyName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    flex: 1,
    marginRight: 8,
  },
  appDate: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.5,
  },
  appCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  appMetaLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.navy,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
});
