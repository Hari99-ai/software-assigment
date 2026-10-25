// src/screens/auth/RegisterScreen.tsx
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

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (val: string) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      e.phone = "Enter 10-digit phone number";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.email.trim(), form.password, form.name.trim());
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : "Registration failed. Please try again.";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: "name",
      label: "Full Name",
      icon: "person-outline",
      placeholder: "John Doe",
      keyboard: "default",
    },
    {
      key: "email",
      label: "Email Address",
      icon: "mail-outline",
      placeholder: "you@example.com",
      keyboard: "email-address",
    },
    {
      key: "phone",
      label: "Phone Number (Optional)",
      icon: "call-outline",
      placeholder: "10-digit mobile number",
      keyboard: "phone-pad",
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={["#0A2E4A", "#0077B6"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Ionicons name="water" size={40} color="#00B4D8" />
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join AquaPure today</Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.offWhite }}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {fields.map(({ key, label, icon, placeholder, keyboard }) => (
          <View key={key} style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View
              style={[styles.inputWrapper, errors[key] && styles.inputError]}
            >
              <Ionicons
                name={icon as any}
                size={20}
                color={colors.gray400}
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.gray400}
                value={(form as any)[key]}
                onChangeText={set(key)}
                keyboardType={keyboard as any}
                autoCapitalize={key === "name" ? "words" : "none"}
                autoCorrect={false}
              />
            </View>
            {errors[key] ? (
              <Text style={styles.error}>{errors[key]}</Text>
            ) : null}
          </View>
        ))}

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.gray400}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Minimum 8 characters"
              placeholderTextColor={colors.gray400}
              value={form.password}
              onChangeText={set("password")}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Ionicons
                name={showPw ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.gray400}
              />
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text style={styles.error}>{errors.password}</Text>
          ) : null}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View
            style={[styles.inputWrapper, errors.confirm && styles.inputError]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.gray400}
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.gray400}
              value={form.confirm}
              onChangeText={set("confirm")}
              secureTextEntry={true}
            />
          </View>
          {errors.confirm ? (
            <Text style={styles.error}>{errors.confirm}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backBtn: { position: "absolute", top: 52, left: 20 },
  headerTitle: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    color: colors.white,
    marginTop: 8,
  },
  headerSub: {
    fontSize: fontSizes.sm,
    color: colors.accentLight,
    marginTop: 4,
  },
  form: { padding: 24, paddingBottom: 48 },
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
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: fontSizes.base, color: colors.gray900 },
  error: {
    fontSize: fontSizes.xs,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: {
    color: colors.white,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  loginText: { fontSize: fontSizes.base, color: colors.gray600 },
  loginLink: {
    fontSize: fontSizes.base,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },
});
