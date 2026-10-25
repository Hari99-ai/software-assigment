// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors, fontSizes, fontWeights } from "../../theme";

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { login, resetPassword } = useAuth();
  const [dealerOnly, setDealerOnly] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password, dealerOnly);
      // Navigation handled by auth state change in navigator
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Invalid email or password."
          : err.code === "auth/too-many-requests"
            ? "Too many failed attempts. Please try again later."
            : err.message || "Login failed. Please try again.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Enter Email", "Please enter your email address first.");
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert(
        "Email Sent",
        "Check your inbox for password reset instructions.",
      );
    } catch {
      Alert.alert(
        "Error",
        "Could not send reset email. Please check the email address.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#0A2E4A", "#0077B6"]} style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="water" size={48} color="#00B4D8" />
          <Text style={styles.brandName}>AquaPure</Text>
          <Text style={styles.brandTagline}>Premium Water Solutions</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View
            style={[styles.inputWrapper, errors.email && styles.inputError]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.gray400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.gray400}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.gray400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.gray400}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotBtn}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don?t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Dealer info */}
        <TouchableOpacity
          style={styles.dealerHint}
          onPress={() => setDealerOnly((value) => !value)}
        >
          <Text>
            {dealerOnly
              ? "Dealer sign in selected · Switch to customer"
              : "Sign in as an approved dealer"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dealerHint}
          onPress={() => navigation.navigate("DealerApply")}
        >
          <Ionicons name="business-outline" size={16} color={colors.dealer} />
          <Text style={styles.dealerHintText}>Apply for Dealer Account →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { paddingTop: 60, paddingBottom: 40, alignItems: "center" },
  logoContainer: { alignItems: "center", gap: 8 },
  brandName: {
    fontSize: 32,
    fontWeight: fontWeights.extrabold,
    color: colors.white,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: fontSizes.sm,
    color: colors.accentLight,
    letterSpacing: 0.5,
  },
  formContainer: { flex: 1 },
  formContent: { padding: 24, paddingBottom: 48 },
  title: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginTop: 8,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.gray500,
    marginTop: 4,
    marginBottom: 28,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.gray700,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: colors.error },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: fontSizes.base, color: colors.gray900 },
  eyeButton: { padding: 4 },
  errorText: {
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: {
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: fontWeights.medium,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.gray200 },
  dividerText: { fontSize: fontSizes.sm, color: colors.gray400 },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { fontSize: fontSizes.base, color: colors.gray600 },
  registerLink: {
    fontSize: fontSizes.base,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },
  dealerHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    padding: 14,
    backgroundColor: colors.dealerLight,
    borderRadius: 12,
  },
  dealerHintText: {
    fontSize: fontSizes.sm,
    color: colors.dealer,
    fontWeight: fontWeights.medium,
  },
});
