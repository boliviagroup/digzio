import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBadge } from "../../components/common/StatusBadge";
import {
  Colors,
  FontFamily,
  FontSize,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const PropertyDetailProviderScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { property } = route.params;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images = property.images || [];

  const amenities = [
    property.wifi && "WiFi",
    property.parking && "Parking",
    property.laundry && "Laundry",
    property.security && "24/7 Security",
    property.gym && "Gym",
    property.study_room && "Study Room",
    property.kitchen && "Kitchen",
    property.meals_included && "Meals Included",
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          {images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setActiveImageIndex(index);
                }}
              >
                {images.map((img: any, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: img.image_url }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={300}
                  />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_: any, idx: number) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === activeImageIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>No images available</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Status */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            <StatusBadge status={property.status || "active"} />
          </View>
          <Text style={styles.location}>
            📍 {property.address}, {property.city}, {property.province}
          </Text>

          {/* Price & NSFAS */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>
                R{Number(property.price_per_month || 0).toLocaleString()}
              </Text>
              <Text style={styles.priceSub}>per month</Text>
            </View>
            {property.nsfas_accredited && (
              <View style={styles.nsfasBadge}>
                <Text style={styles.nsfasText}>✓ NSFAS Accredited</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, Shadow.sm]}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{property.total_beds || 0}</Text>
              <Text style={styles.statLbl}>Total Beds</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{property.occupied_beds || 0}</Text>
              <Text style={styles.statLbl}>Occupied</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>
                {(property.total_beds || 0) - (property.occupied_beds || 0)}
              </Text>
              <Text style={styles.statLbl}>Available</Text>
            </View>
          </View>

          {/* Description */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this property</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((a, i) => (
                  <View key={i} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>✓ {a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {property.property_type || "Student Residence"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender Policy</Text>
              <Text style={styles.detailValue}>
                {property.gender_policy || "Mixed"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lease Term</Text>
              <Text style={styles.detailValue}>
                {property.lease_term || "12 months"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  gallery: {
    position: "relative",
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  noImage: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: Colors.mutedGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.5,
  },
  dots: {
    position: "absolute",
    bottom: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: FontFamily.bold,
  },
  content: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.navy,
    flex: 1,
    marginRight: 12,
  },
  location: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: Spacing.base,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  price: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.teal,
  },
  priceSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
  },
  nsfasBadge: {
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  nsfasText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statVal: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.xl,
    color: Colors.navy,
  },
  statLbl: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    marginTop: 2,
  },
  statDiv: {
    width: 1,
    height: 36,
    backgroundColor: Colors.mutedGrey,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.base,
    color: Colors.navy,
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    lineHeight: 22,
    opacity: 0.8,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    backgroundColor: "rgba(26,155,173,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  amenityText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    color: Colors.teal,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mutedGrey,
  },
  detailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  detailValue: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.navy,
  },
});
