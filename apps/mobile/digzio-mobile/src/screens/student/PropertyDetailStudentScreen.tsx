import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { applicationAPI } from "../../services/api";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const PropertyDetailStudentScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { property } = route.params;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    move_in_date: "",
    message: "",
  });

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

  const handleApply = async () => {
    if (!form.move_in_date) {
      Alert.alert("Missing Field", "Please enter your preferred move-in date.");
      return;
    }
    setSubmitting(true);
    try {
      await applicationAPI.submit({
        property_id: property.property_id,
        move_in_date: form.move_in_date,
        message: form.message,
      });
      setApplyModalVisible(false);
      Alert.alert(
        "Application Submitted! 🎉",
        "Your application has been sent to the provider. You will be notified by email once reviewed.",
        [
          {
            text: "View My Applications",
            onPress: () => navigation.navigate("MyApplications"),
          },
          { text: "OK" },
        ]
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Could not submit application. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

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
                      style={[styles.dot, idx === activeImageIndex && styles.dotActive]}
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
          {property.nsfas_accredited && (
            <View style={styles.nsfasTag}>
              <Text style={styles.nsfasTagText}>✓ NSFAS Accredited</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.location}>
            📍 {property.address}, {property.city}, {property.province}
          </Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>
                R{Number(property.price_per_month || 0).toLocaleString()}
              </Text>
              <Text style={styles.priceSub}>per month</Text>
            </View>
            <View style={styles.bedsChip}>
              <Text style={styles.bedsText}>🛏 {property.total_beds || 0} beds</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, Shadow.sm]}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{property.total_beds || 0}</Text>
              <Text style={styles.statLbl}>Total Beds</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: Colors.success }]}>
                {(property.total_beds || 0) - (property.occupied_beds || 0)}
              </Text>
              <Text style={styles.statLbl}>Available</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: property.nsfas_accredited ? Colors.success : Colors.charcoal }]}>
                {property.nsfas_accredited ? "✓" : "✗"}
              </Text>
              <Text style={styles.statLbl}>NSFAS</Text>
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

          {/* Property Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{property.property_type || "Student Residence"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender Policy</Text>
              <Text style={styles.detailValue}>{property.gender_policy || "Mixed"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lease Term</Text>
              <Text style={styles.detailValue}>{property.lease_term || "12 months"}</Text>
            </View>
          </View>

          {/* Apply Button */}
          <Button
            title="Apply Now"
            onPress={() => setApplyModalVisible(true)}
            variant="primary"
            style={styles.applyBtn}
          />
        </View>
      </ScrollView>

      {/* Apply Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply for Accommodation</Text>
            <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Property Summary */}
            <View style={[styles.propertySummary, Shadow.sm]}>
              <Text style={styles.propertySummaryName}>{property.title}</Text>
              <Text style={styles.propertySummaryLocation}>
                📍 {property.city}, {property.province}
              </Text>
              <Text style={styles.propertySummaryPrice}>
                R{Number(property.price_per_month || 0).toLocaleString()}/month
              </Text>
            </View>

            <Input
              label="Preferred Move-in Date *"
              value={form.move_in_date}
              onChangeText={(v) => setForm({ ...form, move_in_date: v })}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
            />
            <Input
              label="Message to Provider (optional)"
              value={form.message}
              onChangeText={(v) => setForm({ ...form, message: v })}
              placeholder="Introduce yourself or ask a question..."
              multiline
              numberOfLines={4}
            />

            <Button
              title={submitting ? "Submitting..." : "Submit Application"}
              onPress={handleApply}
              variant="primary"
              loading={submitting}
              style={styles.submitBtn}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  gallery: { position: "relative" },
  galleryImage: { width: SCREEN_WIDTH, height: 280 },
  noImage: { width: SCREEN_WIDTH, height: 280, backgroundColor: Colors.mutedGrey, alignItems: "center", justifyContent: "center" },
  noImageText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.5 },
  dots: { position: "absolute", bottom: 12, width: "100%", flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: Colors.white, width: 18 },
  backBtn: { position: "absolute", top: 16, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  backBtnText: { color: Colors.white, fontSize: 20, fontFamily: FontFamily.bold },
  nsfasTag: { position: "absolute", bottom: 12, left: 12, backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  nsfasTagText: { fontFamily: FontFamily.bold, fontSize: 11, color: Colors.white },
  content: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: Spacing.xl, paddingBottom: 40 },
  title: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.navy, marginBottom: 8 },
  location: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.7, marginBottom: Spacing.base },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.base },
  price: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.teal },
  priceSub: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6 },
  bedsChip: { backgroundColor: "rgba(15,45,74,0.08)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full },
  bedsText: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.navy },
  statsRow: { flexDirection: "row", backgroundColor: Colors.offWhite, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.xl },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.navy },
  statLbl: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: 2 },
  statDiv: { width: 1, height: 36, backgroundColor: Colors.mutedGrey },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: Spacing.md },
  description: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, lineHeight: 22, opacity: 0.8 },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: { backgroundColor: "rgba(26,155,173,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  amenityText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.xs, color: Colors.teal },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  detailLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.7 },
  detailValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  applyBtn: { marginTop: Spacing.xl },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.mutedGrey },
  modalTitle: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.navy },
  modalClose: { fontSize: 20, color: Colors.charcoal },
  modalBody: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  propertySummary: { backgroundColor: Colors.offWhite, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.xl },
  propertySummaryName: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: 4 },
  propertySummaryLocation: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.7, marginBottom: 4 },
  propertySummaryPrice: { fontFamily: FontFamily.extraBold, fontSize: FontSize.lg, color: Colors.teal },
  submitBtn: { marginTop: Spacing.xl, marginBottom: Spacing["2xl"] },
});
