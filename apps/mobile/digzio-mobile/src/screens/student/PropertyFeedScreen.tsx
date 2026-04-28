import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { propertyAPI } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

type FilterType = "ALL" | "NSFAS" | "STUDIO" | "SHARED" | "RESIDENCE";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "ALL" },
  { label: "NSFAS", value: "NSFAS" },
  { label: "Residence", value: "RESIDENCE" },
  { label: "Studio", value: "STUDIO" },
  { label: "Shared", value: "SHARED" },
];

const PropertyCard: React.FC<{
  property: any;
  onPress: () => void;
}> = ({ property, onPress }) => {
  const primaryImage = property.images?.find((img: any) => img.is_primary);
  const imageUrl = primaryImage?.image_url;

  return (
    <TouchableOpacity
      style={[styles.card, Shadow.md]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
        transition={300}
        placeholder={{ uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }}
      />
      {property.nsfas_accredited && (
        <View style={styles.nsfasTag}>
          <Text style={styles.nsfasTagText}>NSFAS</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {property.city}, {property.province}
        </Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.cardPrice}>
              R{Number(property.price_per_month || 0).toLocaleString()}
            </Text>
            <Text style={styles.cardPriceSub}>/month</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardBeds}>
              🛏 {property.total_beds || 0} beds
            </Text>
            {property.property_type && (
              <View style={styles.typeChip}>
                <Text style={styles.typeChipText}>{property.property_type}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const PropertyFeedScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const fetchProperties = async () => {
    try {
      const res = await propertyAPI.getAll();
      const props = res.data?.properties || res.data || [];
      setProperties(props);
      applyFilters(props, activeFilter, search);
    } catch (e) {
      console.error("Feed fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = useCallback(
    (props: any[], filter: FilterType, searchText: string) => {
      let result = props;
      if (filter === "NSFAS") {
        result = result.filter((p) => p.nsfas_accredited);
      } else if (filter !== "ALL") {
        result = result.filter(
          (p) =>
            (p.property_type || "").toUpperCase().includes(filter) ||
            (p.title || "").toUpperCase().includes(filter)
        );
      }
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        result = result.filter(
          (p) =>
            (p.title || "").toLowerCase().includes(q) ||
            (p.city || "").toLowerCase().includes(q) ||
            (p.address || "").toLowerCase().includes(q)
        );
      }
      setFiltered(result);
    },
    []
  );

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters(properties, activeFilter, search);
  }, [activeFilter, search, properties]);

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
        <Text style={styles.headerTitle}>Find Accommodation</Text>
        <Text style={styles.headerSub}>
          {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"} available
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, city or area..."
          placeholderTextColor={Colors.charcoal + "80"}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              activeFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Property List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.property_id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() =>
              navigation.navigate("PropertyDetailStudent", { property: item })
            }
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProperties();
            }}
            tintColor={Colors.teal}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏠</Text>
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filter.
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
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
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
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.mutedGrey,
  },
  nsfasTag: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  nsfasTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: Spacing.base,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    marginBottom: 4,
  },
  cardLocation: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardPrice: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.teal,
  },
  cardPriceSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
  },
  cardMeta: {
    alignItems: "flex-end",
    gap: 6,
  },
  cardBeds: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.8,
  },
  typeChip: {
    backgroundColor: "rgba(15,45,74,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    color: Colors.navy,
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
