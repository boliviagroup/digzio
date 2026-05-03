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
import { institutionAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const StudentRow: React.FC<{ student: any }> = ({ student }) => (
  <View style={[styles.row, Shadow.sm]}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {(student.first_name?.[0] || "?").toUpperCase()}
        {(student.last_name?.[0] || "").toUpperCase()}
      </Text>
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowName}>
        {student.first_name} {student.last_name}
      </Text>
      <Text style={styles.rowEmail} numberOfLines={1}>
        {student.email}
      </Text>
      <Text style={styles.rowMeta}>
        {student.student_number || "No student number"} ·{" "}
        {student.institution_name || ""}
      </Text>
    </View>
    <View style={styles.rowRight}>
      <StatusBadge status={student.kyc_status?.toLowerCase() || "pending"} size="sm" />
      {student.is_housed && (
        <View style={styles.housedBadge}>
          <Text style={styles.housedText}>🏠 Housed</Text>
        </View>
      )}
    </View>
  </View>
);

export const InstitutionStudentsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchStudents = useCallback(
    async (reset = false) => {
      try {
        const offset = reset ? 0 : page * LIMIT;
        const res = await institutionAPI.getStudents({ limit: LIMIT, offset });
        const list = res.data?.students || res.data || [];
        setTotal(res.data?.total || list.length);
        if (reset) {
          setStudents(list);
          setPage(0);
        } else {
          setStudents((prev) => [...prev, ...list]);
        }
      } catch (e) {
        console.error("Students fetch error:", e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page]
  );

  useEffect(() => { fetchStudents(true); }, []);

  const onRefresh = () => { setRefreshing(true); fetchStudents(true); };

  const filtered = search
    ? students.filter(
        (s) =>
          `${s.first_name} ${s.last_name} ${s.email} ${s.student_number}`
            .toLowerCase()
            .includes(search.toLowerCase())
      )
    : students;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Student Registry</Text>
          <Text style={styles.headerSub}>{total.toLocaleString()} registered students</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, email or student number..."
          placeholderTextColor={Colors.charcoal + "80"}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.user_id || item.id || item.email}
          renderItem={({ item }) => <StudentRow student={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          onEndReached={() => {
            if (students.length < total) {
              setPage((p) => p + 1);
              fetchStudents();
            }
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptyDesc}>
                {search ? "Try a different search term." : "No students registered yet."}
              </Text>
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
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: Spacing.xl, gap: Spacing.md },
  row: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
  rowContent: { flex: 1 },
  rowName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  rowEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.7, marginTop: 1 },
  rowMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginTop: 1 },
  rowRight: { alignItems: "flex-end", gap: Spacing.xs },
  housedBadge: { backgroundColor: "rgba(16,185,129,0.1)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  housedText: { fontFamily: FontFamily.semiBold, fontSize: 10, color: Colors.success },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  emptyDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.6, textAlign: "center" },
});
