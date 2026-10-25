// src/screens/dealer/DealerApplyScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";

export default function DealerApplyScreen({ navigation }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: user?.phone || "",
    email: user?.email || "",
    yearsInBusiness: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to apply.");
      return;
    }
    if (
      !form.businessName.trim() ||
      !form.businessType.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !/^\d{10}$/.test(form.phone) ||
      !/^\d{6}$/.test(form.pincode) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    ) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, "dealerApplications", user.uid), {
        userId: user.uid,
        ...form,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      Alert.alert(
        "Application Submitted! 🎉",
        "Your dealer application has been submitted. We will review it and notify you within 2-3 business days.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert(
        "Submission Failed",
        "Could not submit application. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: "businessName",
      label: "Business Name *",
      placeholder: "Your Company Name",
    },
    {
      key: "businessType",
      label: "Business Type *",
      placeholder: "e.g., Retailer, Distributor, Plumber",
    },
    {
      key: "gstNumber",
      label: "GST Number (if applicable)",
      placeholder: "22AAAAA0000A1Z5",
    },
    {
      key: "phone",
      label: "Business Phone *",
      placeholder: "10-digit phone",
      keyboard: "phone-pad",
    },
    {
      key: "email",
      label: "Business Email *",
      placeholder: "business@example.com",
      keyboard: "email-address",
    },
    {
      key: "address",
      label: "Business Address *",
      placeholder: "Street, Area",
    },
    { key: "city", label: "City *", placeholder: "Mumbai" },
    { key: "state", label: "State *", placeholder: "Maharashtra" },
    {
      key: "pincode",
      label: "Pincode *",
      placeholder: "400001",
      keyboard: "numeric",
    },
    {
      key: "yearsInBusiness",
      label: "Years in Business",
      placeholder: "e.g., 5",
      keyboard: "numeric",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray100 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Ionicons name="business" size={40} color={colors.dealer} />
        <Text style={styles.headerTitle}>Dealer Application</Text>
        <Text style={styles.headerSubtitle}>
          Apply to become an AquaPure dealer and get access to wholesale
          pricing, bulk order discounts, and priority support.
        </Text>
        <View style={styles.benefitsList}>
          {[
            "Wholesale prices (up to 25% off)",
            "Bulk ordering support",
            "Dedicated account manager",
            "Priority delivery",
          ].map((b) => (
            <View key={b} style={styles.benefit}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Business Details</Text>
      {fields.map(({ key, label, placeholder, keyboard }) => (
        <View key={key} style={styles.field}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.gray400}
            value={(form as any)[key]}
            onChangeText={set(key)}
            keyboardType={(keyboard as any) || "default"}
            autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Ionicons name="send-outline" size={20} color={colors.white} />
            <Text style={styles.submitBtnText}>Submit Application</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.note}>
        * Required fields. Applications are reviewed within 2-3 business days.
        You will be notified via push notification and email once reviewed.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    alignItems: "center",
    marginBottom: 24,
    ...shadow.sm,
    borderTopWidth: 3,
    borderTopColor: colors.dealer,
  },
  headerTitle: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    color: colors.dealer,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
    textAlign: "center",
    lineHeight: 20,
  },
  benefitsList: { alignSelf: "stretch", gap: 8 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 8 },
  benefitText: { fontSize: fontSizes.sm, color: colors.gray700 },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.gray900,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.dealer,
    height: 54,
    borderRadius: 14,
    marginTop: 8,
    ...shadow.md,
  },
  submitBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
  note: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
