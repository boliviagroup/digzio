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

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error?.response?.data?.message || "Invalid email or password. Please try again."
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
            <Text style={styles.heroTitle}>Digzio</Text>
            <Text style={styles.heroSubtitle}>
              South Africa's Student Housing Platform
            </Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to manage your properties and applications
            </Text>

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email}
              required
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              error={errors.password}
              required
              rightIcon={
                <Text style={styles.showHide}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Create an Account"
              onPress={() => navigation.navigate("Register")}
              variant="outline"
            />

            <Text style={styles.footer}>
              By signing in, you agree to Digzio's{" "}
              <Text style={styles.footerLink}>Terms of Service</Text> and{" "}
              <Text style={styles.footerLink}>Privacy Policy</Text>.
            </Text>
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
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  heroTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 48,
    color: Colors.white,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
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
  cardTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize["2xl"],
    color: Colors.navy,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.7,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  showHide: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.teal,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.lg,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    color: Colors.teal,
  },
  loginButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.mutedGrey,
  },
  dividerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    opacity: 0.5,
    marginHorizontal: 12,
  },
  footer: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.charcoal,
    opacity: 0.6,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.teal,
    fontFamily: FontFamily.semiBold,
  },
});
