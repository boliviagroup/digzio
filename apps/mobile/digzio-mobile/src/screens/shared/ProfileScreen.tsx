import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../theme";

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  student: { label: "Student", icon: "🎓", color: Colors.teal },
  provider: { label: "Provider", icon: "🏢", color: Colors.navy },
  institution: { label: "Institution", icon: "🏛️", color: Colors.warning },
  admin: { label: "Administrator", icon: "🔑", color: Colors.error },
};

const KYC_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not Verified", color: Colors.error },
  PENDING: { label: "Under Review", color: Colors.warning },
  VERIFIED: { label: "Verified ✓", color: Colors.success },
  REJECTED: { label: "Rejected", color: Colors.error },
};

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const role = user?.role?.toLowerCase() || "student";
  const roleConfig = ROLE_LABELS[role] || ROLE_LABELS.student;
  const kycConfig = KYC_STATUS_LABELS[user?.kyc_status || "NOT_STARTED"];

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.first_name?.[0] || "?").toUpperCase()}
                {(user?.last_name?.[0] || "").toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: `${roleConfig.color}30` }]}>
              <Text style={styles.roleIcon}>{roleConfig.icon}</Text>
              <Text style={[styles.roleLabel, { color: roleConfig.color }]}>
                {roleConfig.label}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Account Info */}
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={[styles.card, Shadow.sm]}>
            {[
              { label: "First Name", value: user?.first_name || "—" },
              { label: "Last Name", value: user?.last_name || "—" },
              { label: "Email", value: user?.email || "—" },
              { label: "Phone", value: user?.phone || "—" },
              { label: "Role", value: roleConfig.label },
              ...(role === "student"
                ? [
                    {
                      label: "KYC Status",
                      value: kycConfig.label,
                      valueColor: kycConfig.color,
                    },
                  ]
                : []),
            ].map((item, index, arr) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      (item as any).valueColor ? { color: (item as any).valueColor } : {},
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
                {index < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* KYC Verification CTA for students */}
          {role === "student" && user?.kyc_status !== "VERIFIED" && (
            <TouchableOpacity
              style={[styles.kycCTA, Shadow.sm]}
              onPress={() => navigation.navigate("KYC")}
              activeOpacity={0.85}
            >
              <Text style={styles.kycCTAIcon}>🔍</Text>
              <View style={styles.kycCTAContent}>
                <Text style={styles.kycCTATitle}>Complete Identity Verification</Text>
                <Text style={styles.kycCTADesc}>
                  {user?.kyc_status === "PENDING"
                    ? "Your documents are under review."
                    : "Verify your identity to apply for properties."}
                </Text>
              </View>
              <Text style={styles.kycCTAArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Preferences */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDesc}>Application updates and alerts</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.mutedGrey, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* App Info */}
          <Text style={styles.sectionTitle}>About</Text>
          <View style={[styles.card, Shadow.sm]}>
            {[
              { label: "Version", value: "1.0.0" },
              { label: "Environment", value: "Production" },
              { label: "Region", value: "af-south-1 (Cape Town)" },
            ].map((item, index, arr) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
                {index < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutBtn, Shadow.sm]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Digzio — Student Housing Platform{"\n"}
            © 2026 Digzio (Pty) Ltd. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: { padding: Spacing.xl, paddingBottom: Spacing["3xl"] },
  backBtn: { marginBottom: Spacing.lg },
  backBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: "rgba(255,255,255,0.8)" },
  avatarContainer: { alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: Spacing.md, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  avatarText: { fontFamily: FontFamily.extraBold, fontSize: FontSize["2xl"], color: Colors.white },
  userName: { fontFamily: FontFamily.extraBold, fontSize: FontSize.xl, color: Colors.white, marginBottom: 4 },
  userEmail: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: "rgba(255,255,255,0.75)", marginBottom: Spacing.md },
  roleBadge: { flexDirection: "row", alignItems: "center", borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
  roleIcon: { fontSize: 14 },
  roleLabel: { fontFamily: FontFamily.bold, fontSize: FontSize.sm },
  content: { padding: Spacing.xl, paddingBottom: Spacing["3xl"] },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.navy, marginBottom: Spacing.md, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: Spacing.sm },
  infoLabel: { fontFamily: FontFamily.regular, fontSize: FontSize.sm, color: Colors.charcoal, opacity: 0.6 },
  infoValue: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy, flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.mutedGrey },
  kycCTA: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  kycCTAIcon: { fontSize: 24, marginRight: Spacing.md },
  kycCTAContent: { flex: 1 },
  kycCTATitle: { fontFamily: FontFamily.bold, fontSize: FontSize.sm, color: Colors.navy, marginBottom: 2 },
  kycCTADesc: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.7 },
  kycCTAArrow: { fontFamily: FontFamily.bold, fontSize: FontSize.lg, color: Colors.teal },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  settingLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.sm, color: Colors.navy },
  settingDesc: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.6, marginTop: 2 },
  signOutBtn: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: "center", marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.error + "40" },
  signOutText: { fontFamily: FontFamily.bold, fontSize: FontSize.base, color: Colors.error },
  footer: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, color: Colors.charcoal, opacity: 0.4, textAlign: "center", lineHeight: 18 },
});
