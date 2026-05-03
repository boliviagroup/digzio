import React, { useEffect, useState, useCallback } from "react";
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
import { adminAPI } from "../../services/api";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const ROLE_COLORS: Record<string, string> = {
  STUDENT: Colors.teal,
  PROVIDER: Colors.navy,
  INSTITUTION: Colors.warning,
  ADMIN: Colors.error,
};

const UserRow: React.FC<{ user: any }> = ({ user }) => (
  <View style={[styles.row, Shadow.sm]}>
    <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[user.role] || Colors.navy }]}>
      <Text style={styles.avatarText}>
        {(user.first_name?.[0] || "?").toUpperCase()}
        {(user.last_name?.[0] || "").toUpperCase()}
      </Text>
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowName}>
        {user.first_name} {user.last_name}
      </Text>
      <Text style={styles.rowEmail} numberOfLines={1}>{user.email}</Text>
      <Text style={styles.rowMeta}>
        Joined {new Date(user.created_at).toLocaleDateString("en-ZA")}
      </Text>
    </View>
    <View style={styles.rowRight}>
      <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[user.role] || Colors.navy}18` }]}>
        <Text style={[styles.roleText, { color: ROLE_COLORS[user.role] || Colors.navy }]}>
          {user.role}
        </Text>
      </View>
      {user.kyc_status && (
        <View style={[styles.kycBadge, { backgroundColor: user.kyc_status === "VERIFIED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" }]}>
          <Text style={[styles.kycText, { color: user.kyc_status === "VERIFIED" ? Colors.success : Colors.warning }]}>
            {user.kyc_status === "VERIFIED" ? "✓ KYC" : "⏳ KYC"}
          </Text>
        </View>
      )}
    </View>
  </View>
);

export const AdminUsersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "PROVIDER" | "INSTITUTION" | "ADMIN">("ALL");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchUsers = useCallback(async (reset = false) => {
    try {
      const offset = reset ? 0 : page * LIMIT;
      const res = await adminAPI.getUsers({ limit: LIMIT, offset, role: roleFilter !== "ALL" ? roleFilter : undefined });
      const list = res.data?.users || res.data || [];
      setTotal(res.data?.total || list.length);
      if (reset) { setUsers(list); setPage(0); }
      else { setUsers((prev) => [...prev, ...list]); }
    } catch (e) {
      console.error("Admin users error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, roleFilter]);

  useEffect(() => { setLoading(true); fetchUsers(true); }, [roleFilter]);
  const onRefresh = () => { setRefreshing(true); fetchUsers(true); };

  const filtered = search
    ? users.filter((u) =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSub}>{total.toLocaleString()} total users</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.charcoal + "80"}
        />
      </View>

      {/* Role Filter */}
      <View style={styles.filterRow}>
        {(["ALL", "STUDENT", "PROVIDER", "INSTITUTION", "ADMIN"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterTab, roleFilter === r && styles.filterTabActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterTabText, roleFilter === r && styles.filterTabTextActive]}>
              {r === "ALL" ? "All" : r === "INSTITUTION" ? "Inst." : r.charAt(0) + r.slice(1).toLowerCase()}
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
          keyExtractor={(item) => item.user_id || item.id || item.email}
          renderItem={({ item }) => <UserRow user={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          onEndReached={() => { if (users.length < total) { setPage((p) => p + 1); fetchUsers(); } }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No users found</Text>
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
  searchContainer: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  searchInput: { backgroundColor: Colors.offWhite, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.navy },
  filterRow: { flexDirection: "row", backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  filterTab: { flex: 1, paddingVertical: Spacing.md, alignItems: "center" },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  filterTabText: { fontFamily: FontFamily.semiBold, fontSize: 11, color: Colors.charcoal, opacity: 0.5 },
  filterTabTextActive: { color: Colors.teal, opacity: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.xl, gap: Spacing.md },
  row: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: BorderRadius.full, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
  rowContent: { flex: 1 },
  rowName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  rowEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.7, marginTop: 1 },
  rowMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginTop: 1 },
  rowRight: { alignItems: "flex-end", gap: Spacing.xs },
  roleBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  roleText: { fontFamily: FontFamily.bold, fontSize: 10 },
  kycBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  kycText: { fontFamily: FontFamily.semiBold, fontSize: 10 },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy },
});
