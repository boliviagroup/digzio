import React, { useEffect, useState } from "react";
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

const CLOUDFRONT = "https://d1t2pdt9c1syrh.cloudfront.net";

const PropertyCard: React.FC<{
  property: any;
  onPress: () => void;
  onToggleStatus: () => void;
}> = ({ property, onPress, onToggleStatus }) => {
  const primaryImage = property.images?.find((img: any) => img.is_primary);
  const imageUrl = primaryImage?.image_url || `${CLOUDFRONT}/properties/gen_residence_exterior.webp`;

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
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {property.title}
          </Text>
          <StatusBadge status={property.status || "active"} size="sm" />
        </View>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {property.address}, {property.city}
        </Text>
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatValue}>{property.total_beds || 0}</Text>
            <Text style={styles.cardStatLabel}>Beds</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStat}>
            <Text style={styles.cardStatValue}>
              R{Number(property.price_per_month || 0).toLocaleString()}
            </Text>
            <Text style={styles.cardStatLabel}>/month</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStat}>
            <Text
              style={[
                styles.cardStatValue,
                { color: property.nsfas_accredited ? Colors.success : Colors.charcoal },
              ]}
            >
              {property.nsfas_accredited ? "✓" : "✗"}
            </Text>
            <Text style={styles.cardStatLabel}>NSFAS</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            {
              backgroundColor:
                property.status === "active"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
            },
          ]}
          onPress={onToggleStatus}
        >
          <Text
            style={[
              styles.toggleBtnText,
              {
                color:
                  property.status === "active" ? Colors.error : Colors.success,
              },
            ]}
          >
            {property.status === "active"
              ? "Deactivate Listing"
              : "Activate Listing"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const ProviderPortfolioScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const res = await propertyAPI.getMyProperties();
      setProperties(res.data?.properties || res.data || []);
    } catch (e) {
      console.error("Portfolio fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleToggleStatus = async (property: any) => {
    const newStatus = property.status === "active" ? "inactive" : "active";
    Alert.alert(
      `${newStatus === "active" ? "Activate" : "Deactivate"} Listing`,
      `Are you sure you want to ${newStatus === "active" ? "activate" : "deactivate"} "${property.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: newStatus === "inactive" ? "destructive" : "default",
          onPress: async () => {
            try {
              await propertyAPI.toggleStatus(property.property_id, newStatus);
              setProperties((prev) =>
                prev.map((p) =>
                  p.property_id === property.property_id
                    ? { ...p, status: newStatus }
                    : p
                )
              );
            } catch (e) {
              Alert.alert("Error", "Could not update property status.");
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>My Properties</Text>
        <Text style={styles.headerSub}>
          {properties.length} listing{properties.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item.property_id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() =>
              navigation.navigate("PropertyDetailProvider", { property: item })
            }
            onToggleStatus={() => handleToggleStatus(item)}
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
            <Text style={styles.emptyTitle}>No properties yet</Text>
            <Text style={styles.emptyText}>
              Your property listings will appear here once added via the web dashboard.
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
    height: 180,
  },
  cardBody: {
    padding: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.navy,
    flex: 1,
    marginRight: 8,
  },
  cardLocation: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardStat: {
    flex: 1,
    alignItems: "center",
  },
  cardStatValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
  },
  cardStatLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    marginTop: 2,
  },
  cardStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.mutedGrey,
  },
  toggleBtn: {
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  toggleBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
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
