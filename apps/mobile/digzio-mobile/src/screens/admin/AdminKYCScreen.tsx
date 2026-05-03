import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
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

const KYCCard: React.FC<{ item: any; onVerify: () => void; onReject: () => void }> = ({
  item,
  onVerify,
  onReject,
}) => (
  <View style={[styles.card, Shadow.sm]}>
    <View style={styles.cardHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.first_name?.[0] || "?").toUpperCase()}
          {(item.last_name?.[0] || "").toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {item.email}
        </Text>
        <Text style={styles.cardMeta}>
          Submitted {new Date(item.submitted_at || item.created_at).toLocaleDateString("en-ZA")}
        </Text>
      </View>
    </View>

    {/* KYC Details */}
    <View style={styles.detailsGrid}>
      {item.id_type && (
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>ID Type</Text>
          <Text style={styles.detailValue}>{item.id_type}</Text>
        </View>
      )}
      {item.id_number && (
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>ID Number</Text>
          <Text style={styles.detailValue}>{item.id_number}</Text>
        </View>
      )}
      {item.institution_name && (
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Institution</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item.institution_name}</Text>
        </View>
      )}
      {item.student_number && (
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Student No.</Text>
          <Text style={styles.detailValue}>{item.student_number}</Text>
        </View>
      )}
    </View>

    {/* Actions */}
    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
        <Text style={styles.rejectBtnText}>✗ Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.verifyBtn} onPress={onVerify}>
        <Text style={styles.verifyBtnText}>✓ Verify</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const AdminKYCScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await adminAPI.getKYCQueue();
      setQueue(res.data?.users || res.data || []);
    } catch (e) {
      console.error("KYC queue error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchQueue(); };

  const handleAction = (userId: string, action: "verify" | "reject") => {
    const label = action === "verify" ? "Verify" : "Reject";
    Alert.alert(
      `${label} KYC`,
      `Are you sure you want to ${label.toLowerCase()} this user's identity verification?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            setProcessing(userId);
            try {
              await adminAPI.updateKYC(userId, action === "verify" ? "VERIFIED" : "REJECTED");
              setQueue((prev) => prev.filter((u) => (u.user_id || u.id) !== userId));
            } catch (e) {
              Alert.alert("Error", `Failed to ${label.toLowerCase()} KYC.`);
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Queue</Text>
        <Text style={styles.headerSub}>{queue.length} pending verifications</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.user_id || item.id}
          renderItem={({ item }) => {
            const uid = item.user_id || item.id;
            return (
              <View style={processing === uid ? styles.processing : {}}>
                {processing === uid && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator color={Colors.teal} />
                  </View>
                )}
                <KYCCard
                  item={item}
                  onVerify={() => handleAction(uid, "verify")}
                  onReject={() => handleAction(uid, "reject")}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>Queue is empty</Text>
              <Text style={styles.emptyDesc}>All KYC submissions have been reviewed.</Text>
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
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: BorderRadius.full, backgroundColor: Colors.navy, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy },
  cardEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.7, marginTop: 1 },
  cardMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginTop: 1 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, backgroundColor: Colors.offWhite, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  detailItem: { width: "47%" },
  detailLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.5, marginBottom: 2 },
  detailValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  cardActions: { flexDirection: "row", gap: Spacing.md },
  rejectBtn: { flex: 1, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: "center" },
  rejectBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.error },
  verifyBtn: { flex: 1, backgroundColor: Colors.teal, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: "center" },
  verifyBtnText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.white },
  processing: { opacity: 0.5 },
  processingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  emptyDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.6 },
});
