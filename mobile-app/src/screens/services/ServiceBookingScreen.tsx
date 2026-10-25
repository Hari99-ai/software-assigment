// src/screens/services/ServiceBookingScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "../../components/DatePicker";
import {
  createServiceBooking,
  SERVICE_TYPES,
} from "../../services/serviceBookingService";
import { useAuth } from "../../context/AuthContext";
import { Address, ServiceType } from "../../types";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";

const TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function ServiceBookingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null,
  );
  const [purifierDetails, setPurifierDetails] = useState("");
  const [address, setAddress] = useState({
    fullName: user?.displayName || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    label: "Home",
    isDefault: false,
    id: "",
  });
  const [minimumDate] = useState(() => new Date(Date.now() + 86400000));
  const [preferredDate, setPreferredDate] = useState(minimumDate);
  const [selectedTime, setSelectedTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !selectedService ||
      !address.fullName.trim() ||
      !address.street.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !/^\d{6}$/.test(address.pincode) ||
      !/^\d{10}$/.test(address.phone) ||
      !selectedTime
    ) {
      Alert.alert("Missing Details", "Please fill in all required fields.");
      return;
    }
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to book a service.");
      return;
    }

    setLoading(true);
    try {
      const bookingId = await createServiceBooking({
        userId: user.uid,
        serviceType: selectedService,
        purifierDetails,
        address: address as Address,
        preferredDate,
        preferredTime: selectedTime,
        contactName: address.fullName,
        contactPhone: address.phone,
      });
      Alert.alert(
        "Booking Confirmed! 🔧",
        `Your service has been booked. Booking ID: ${bookingId.slice(-8).toUpperCase()}`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert(
        "Booking Failed",
        "Could not create booking. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.gray100 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      {/* Step 1: Service Type */}
      <Text style={styles.sectionTitle}>Select Service Type</Text>
      <View style={styles.serviceGrid}>
        {SERVICE_TYPES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[
              styles.serviceCard,
              selectedService === s.value && styles.serviceCardSelected,
            ]}
            onPress={() => setSelectedService(s.value)}
          >
            <Ionicons
              name="construct"
              size={24}
              color={selectedService === s.value ? colors.white : colors.accent}
            />
            <Text
              style={[
                styles.serviceLabel,
                selectedService === s.value && styles.serviceLabelSelected,
              ]}
            >
              {s.label}
            </Text>
            <Text
              style={[
                styles.serviceDesc,
                selectedService === s.value && {
                  color: "rgba(255,255,255,0.8)",
                },
              ]}
            >
              {s.description}
            </Text>
            <Text
              style={[
                styles.servicePrice,
                selectedService === s.value && {
                  color: "rgba(255,255,255,0.9)",
                },
              ]}
            >
              {s.price}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Purifier Details */}
      <Text style={styles.sectionTitle}>
        Purifier/Product Details (Optional)
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder="e.g., Kent Grand Plus, 3 years old, not purifying properly"
        placeholderTextColor={colors.gray400}
        value={purifierDetails}
        onChangeText={setPurifierDetails}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Date & Time */}
      <Text style={styles.sectionTitle}>Preferred Date & Time</Text>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.accent} />
        <Text style={styles.dateBtnText}>{preferredDate.toDateString()}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={preferredDate}
          mode="date"
          minimumDate={minimumDate}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setPreferredDate(date);
          }}
        />
      )}

      <View style={styles.timeGrid}>
        {TIME_SLOTS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.timeChip,
              selectedTime === t && styles.timeChipSelected,
            ]}
            onPress={() => setSelectedTime(t)}
          >
            <Text
              style={[
                styles.timeChipText,
                selectedTime === t && styles.timeChipTextSelected,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Address */}
      <Text style={styles.sectionTitle}>Service Address</Text>
      {[
        { key: "fullName", label: "Full Name", placeholder: "Contact name" },
        {
          key: "phone",
          label: "Phone",
          placeholder: "10-digit phone",
          keyboard: "phone-pad",
        },
        {
          key: "street",
          label: "Street Address",
          placeholder: "House no, street, area",
        },
        { key: "city", label: "City", placeholder: "Mumbai" },
        { key: "state", label: "State", placeholder: "Maharashtra" },
        {
          key: "pincode",
          label: "Pincode",
          placeholder: "400001",
          keyboard: "numeric",
        },
      ].map(({ key, label, placeholder, keyboard }) => (
        <View key={key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder={placeholder}
            placeholderTextColor={colors.gray400}
            value={(address as any)[key]}
            onChangeText={(v) => setAddress((a) => ({ ...a, [key]: v }))}
            keyboardType={keyboard as any}
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
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.white}
            />
            <Text style={styles.submitBtnText}>Confirm Booking</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginBottom: 12,
    marginTop: 16,
  },
  serviceGrid: { gap: 10 },
  serviceCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray200,
    gap: 4,
    ...shadow.sm,
  },
  serviceCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  serviceLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  serviceLabelSelected: { color: colors.white },
  serviceDesc: { fontSize: fontSizes.sm, color: colors.gray500 },
  servicePrice: {
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    padding: 12,
    fontSize: fontSizes.base,
    color: colors.gray900,
    minHeight: 80,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  dateBtnText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.gray800,
    fontWeight: fontWeights.medium,
  },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  timeChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeChipText: { fontSize: fontSizes.sm, color: colors.gray600 },
  timeChipTextSelected: {
    color: colors.white,
    fontWeight: fontWeights.semibold,
  },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
    marginBottom: 6,
  },
  fieldInput: {
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
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 14,
    marginTop: 20,
    ...shadow.md,
  },
  submitBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
});
