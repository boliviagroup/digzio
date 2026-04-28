import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import {
  Colors,
  FontFamily,
  FontSize,
  Gradients,
  Spacing,
  BorderRadius,
} from "../../theme";

interface RegisterScreenProps {
  navigation: any;
}

type Role = "provider" | "student";

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, isLoading } = useAuth();
  const [role, setRole] = useState<Role>("provider");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        phone: phone.trim() || undefined,
      });
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error?.response?.data?.message || "Could not create account. Please try again."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>Join Digzio today</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Role Selector */}
            <Text style={styles.sectionLabel}>I AM A</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "provider" && styles.roleOptionActive,
                ]}
                onPress={() => setRole("provider")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "provider" && styles.roleTextActive,
                  ]}
                >
                  Property Provider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "student" && styles.roleOptionActive,
                ]}
                onPress={() => setRole("student")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "student" && styles.roleTextActive,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Siphiwe"
                  error={errors.firstName}
                  required
                />
              </View>
              <View style={styles.halfWidthRight}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Dlamini"
                  error={errors.lastName}
                  required
                />
              </View>
            </View>

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              error={errors.email}
              required
            />

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+27 82 000 0000"
              hint="Optional — used for application notifications"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Minimum 8 characters"
              error={errors.password}
              required
              rightIcon={
                <Text style={styles.showHide}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholder="Repeat your password"
              error={errors.confirmPassword}
              required
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{" "}
                <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  backText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
  },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["3xl"],
    color: Colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: "rgba(255,255,255,0.7)",
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
    flex: 1,
  },
  sectionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xs,
    color: Colors.navy,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  roleSelector: {
    flexDirection: "row",
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  roleOptionActive: {
    backgroundColor: Colors.navy,
  },
  roleText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
  },
  roleTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  halfWidthRight: {
    flex: 1,
  },
  showHide: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.teal,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: Spacing.lg,
  },
  loginLink: {
    alignItems: "center",
  },
  loginLinkText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
  },
  loginLinkBold: {
    fontFamily: FontFamily.bold,
    color: Colors.teal,
    opacity: 1,
  },
});
