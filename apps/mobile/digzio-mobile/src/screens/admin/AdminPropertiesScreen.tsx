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
import { Image } from "expo-image";
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

const PropertyCard: React.FC<{ property: any }> = ({ property }) => {
  const primaryImage = property.images?.find((img: any) => img.is_primary);
  return (
    <View style={[styles.card, Shadow.sm]}>
      {primaryImage?.image_url ? (
        <Image
          source={{ uri: primaryImage.image_url }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>🏠</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
          <StatusBadge status={property.status?.toLowerCase() || "active"} size="sm" />
        </View>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {property.city}, {property.province}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            R{Number(property.price_per_month || 0).toLocaleString()}/mo
          </Text>
          <Text style={styles.cardMeta}>
            🛏 {property.total_beds || 0} beds
          </Text>
          {property.nsfas_accredited && (
            <View style={styles.nsfasTag}>
              <Text style={styles.nsfasTagText}>NSFAS</Text>
            </View>
          )}
        </View>
        {property.provider_name && (
          <Text style={styles.providerName} numberOfLines={1}>
            🏢 {property.provider_name}
          </Text>
        )}
      </View>
    </View>
  );
};

export const AdminPropertiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const fetchProperties = useCallback(async (reset = false) => {
    try {
      const offset = reset ? 0 : page * LIMIT;
      const res = await adminAPI.getAllProperties({ limit: LIMIT, offset });
      const list = res.data?.properties || res.data || [];
      setTotal(res.data?.total || list.length);
      if (reset) { setProperties(list); setPage(0); }
      else { setProperties((prev) => [...prev, ...list]); }
    } catch (e) {
      console.error("Admin properties error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => { fetchProperties(true); }, []);
  const onRefresh = () => { setRefreshing(true); fetchProperties(true); };

  const filtered = search
    ? properties.filter((p) =>
        `${p.title} ${p.city} ${p.province} ${p.provider_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Properties</Text>
        <Text style={styles.headerSub}>{total.toLocaleString()} total properties</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title, city or provider..."
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
          keyExtractor={(item) => item.property_id || item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.teal} />}
          onEndReached={() => { if (properties.length < total) { setPage((p) => p + 1); fetchProperties(); } }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyTitle}>No properties found</Text>
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
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: "hidden" },
  cardImage: { width: "100%", height: 140 },
  cardImagePlaceholder: { backgroundColor: Colors.mutedGrey, alignItems: "center", justifyContent: "center" },
  cardImagePlaceholderText: { fontSize: 40 },
  cardBody: { padding: Spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, flex: 1, marginRight: Spacing.sm },
  cardLocation: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.7, marginBottom: Spacing.sm },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  cardPrice: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.teal },
  cardMeta: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6 },
  nsfasTag: { backgroundColor: "rgba(26,155,173,0.1)", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  nsfasTagText: { fontFamily: FontFamily.bold, fontSize: 10, color: Colors.teal },
  providerName: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: Spacing.sm },
  emptyContainer: { alignItems: "center", paddingTop: Spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.navy },
});
