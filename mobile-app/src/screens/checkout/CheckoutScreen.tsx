// src/screens/checkout/CheckoutScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  createRazorpayOrder,
  verifyAndCreateOrder,
} from "../../services/orderService";
import { Address } from "../../types";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";
import { openPayment } from "../../services/payment";
import PlaceSearch from "../../components/PlaceSearch";

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";

export default function CheckoutScreen({ navigation }: any) {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"address" | "review" | "payment">("address");
  const [address, setAddress] = useState<Partial<Address>>({
    fullName: user?.displayName || "",
    phone: user?.phone || "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    label: "Home",
    isDefault: false,
    ...(user?.addresses?.find((a) => a.isDefault) ||
      user?.addresses?.[0] ||
      {}),
  });
  const [addrErrors, setAddrErrors] = useState<
    Partial<Record<keyof Address, string>>
  >({});

  const deliveryFee = subtotal >= 10000 ? 0 : 200;
  const totalAmount = subtotal + deliveryFee;

  const validateAddress = () => {
    const e: typeof addrErrors = {};
    if (!address.fullName?.trim()) e.fullName = "Name is required";
    if (!address.phone?.match(/^\d{10}$/))
      e.phone = "Valid 10-digit phone required";
    if (!address.street?.trim()) e.street = "Street address is required";
    if (!address.city?.trim()) e.city = "City is required";
    if (!address.state?.trim()) e.state = "State is required";
    if (!address.pincode?.match(/^\d{6}$/))
      e.pincode = "Valid 6-digit pincode required";
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePayment = async () => {
    if (!validateAddress()) return;
    setLoading(true);

    try {
      // Step 1: Create Razorpay order (server-side price validation)
      const orderData = await createRazorpayOrder(items);

      // Step 2: Open Razorpay checkout
      const options = {
        description: "Water Purifier Purchase",
        currency: "INR",
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount.toString(),
        name: "AquaPure",
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: user?.email || "",
          contact: address.phone || "",
          name: address.fullName || "",
        },
        theme: { color: "#0A2E4A" },
      };

      const paymentData = await openPayment(options);

      // Step 3: Verify payment on server and create order
      const result = await verifyAndCreateOrder({
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        deliveryAddress: address as Address,
      });

      clearCart();
      navigation.replace("OrderConfirmation", { orderId: result.orderId });
    } catch (err: any) {
      if (err.code === 0) {
        // User cancelled payment
        Alert.alert(
          "Checkout closed",
          "If your bank shows a debit, keep the payment ID and contact support before retrying.",
        );
      } else {
        Alert.alert(
          "Checkout needs attention",
          err.message ||
            "The order could not be confirmed. If payment was debited, keep the payment ID and contact support.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAddressField = ({
    field,
    label,
    placeholder,
    keyboard,
    multiline,
  }: {
    field: keyof typeof address;
    label: string;
    placeholder: string;
    keyboard?: any;
    multiline?: boolean;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          multiline && styles.fieldMultiline,
          addrErrors[field] && styles.fieldInputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
        value={(address[field] as string) || ""}
        onChangeText={(v) => {
          setAddress((a) => ({ ...a, [field]: v }));
          setAddrErrors((e) => ({ ...e, [field]: undefined }));
        }}
        keyboardType={keyboard}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {addrErrors[field] && (
        <Text style={styles.fieldError}>{addrErrors[field]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.steps}>
        {["Address", "Review", "Payment"].map((s, i) => (
          <React.Fragment key={s}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  (step === "address" && i === 0) ||
                  (step === "review" && i <= 1) ||
                  (step === "payment" && i <= 2)
                    ? styles.stepCircleActive
                    : {},
                ]}
              >
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{s}</Text>
            </View>
            {i < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Address Form */}
        {step === "address" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <PlaceSearch
              onSelect={(place) =>
                setAddress((a) => ({
                  ...a,
                  city: place.city,
                  state: place.state,
                  pincode: place.pincode,
                }))
              }
            />
            {user?.addresses?.map((saved) => (
              <TouchableOpacity
                key={saved.id}
                onPress={() => setAddress(saved)}
                style={styles.card}
              >
                <Text>
                  {saved.label}: {saved.street}, {saved.city}
                </Text>
              </TouchableOpacity>
            ))}
            {renderAddressField({
              field: "fullName",
              label: "Full Name",
              placeholder: "John Doe",
            })}
            {renderAddressField({
              field: "phone",
              label: "Phone Number",
              placeholder: "10-digit mobile",
              keyboard: "phone-pad",
            })}
            {renderAddressField({
              field: "street",
              label: "Street Address",
              placeholder: "House no, Street, Area",
              multiline: true,
            })}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                {renderAddressField({
                  field: "city",
                  label: "City",
                  placeholder: "Mumbai",
                })}
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                {renderAddressField({
                  field: "pincode",
                  label: "Pincode",
                  placeholder: "400001",
                  keyboard: "numeric",
                })}
              </View>
            </View>
            {renderAddressField({
              field: "state",
              label: "State",
              placeholder: "Maharashtra",
            })}
            {renderAddressField({
              field: "landmark",
              label: "Landmark (Optional)",
              placeholder: "Near school, park, etc.",
            })}

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                if (validateAddress()) setStep("review");
              }}
            >
              <Text style={styles.continueBtnText}>Continue to Review</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Order Review */}
        {step === "review" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Review</Text>

            {/* Delivery Address Summary */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="location" size={18} color={colors.accent} />
                <Text style={styles.cardTitle}>Delivery To</Text>
                <TouchableOpacity onPress={() => setStep("address")}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.addressLine}>{address.fullName}</Text>
              <Text style={styles.addressLine}>{address.street}</Text>
              <Text style={styles.addressLine}>
                {address.city}, {address.state} — {address.pincode}
              </Text>
              <Text style={styles.addressLine}>📞 {address.phone}</Text>
            </View>

            {/* Order Items */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Items ({items.length})</Text>
              {items.map((item) => (
                <View key={item.productId} style={styles.orderItem}>
                  <Text style={styles.orderItemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.orderItemMeta}>
                    {item.quantity} ×{" "}
                    {formatPrice(
                      user?.role === "dealer" &&
                        user.dealerStatus === "approved"
                        ? item.product.wholesalePrice
                        : item.product.price,
                    )}{" "}
                    ={" "}
                    {formatPrice(
                      (user?.role === "dealer" &&
                      user.dealerStatus === "approved"
                        ? item.product.wholesalePrice
                        : item.product.price) * item.quantity,
                    )}
                  </Text>
                </View>
              ))}
            </View>

            {/* Price Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Price Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery</Text>
                <Text
                  style={[
                    styles.priceValue,
                    deliveryFee === 0 && { color: colors.success },
                  ]}
                >
                  {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                </Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => setStep("payment")}
            >
              <Text style={styles.continueBtnText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Payment */}
        {step === "payment" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Complete Payment</Text>
            <View style={styles.card}>
              <View style={styles.paymentLogo}>
                <Ionicons
                  name="shield-checkmark"
                  size={40}
                  color={colors.success}
                />
              </View>
              <Text style={styles.paymentTitle}>
                Secure Payment via Razorpay
              </Text>
              <Text style={styles.paymentSubtitle}>
                You will be redirected to Razorpay?s secure payment gateway to
                complete your purchase of {formatPrice(totalAmount)}.
              </Text>
              <View style={styles.paymentMethods}>
                <Text style={styles.paymentMethodsTitle}>
                  Accepted Payment Methods:
                </Text>
                <Text style={styles.paymentMethodsList}>
                  💳 Credit/Debit Cards • 📱 UPI • 🏦 Net Banking • 💰 Wallets
                </Text>
              </View>
              <Text style={styles.testModeNote}>
                ℹ️ Test Mode: Use test card 4111 1111 1111 1111 with any future
                expiry and CVV 111
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.payBtn, loading && styles.payBtnDisabled]}
              onPress={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color={colors.white} />
                  <Text style={styles.payBtnText}>
                    Pay {formatPrice(totalAmount)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNum: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.sm,
  },
  stepLabel: { fontSize: 10, color: colors.gray500 },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray200,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  scrollContent: { padding: 16, paddingBottom: 48 },
  section: { gap: 16 },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
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
  fieldInputError: { borderColor: colors.error },
  fieldMultiline: { minHeight: 80, textAlignVertical: "top" },
  fieldError: { fontSize: fontSizes.xs, color: colors.error, marginTop: 4 },
  row: { flexDirection: "row" },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    ...shadow.md,
  },
  continueBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...shadow.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  editLink: {
    color: colors.accent,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  addressLine: { fontSize: fontSizes.sm, color: colors.gray600 },
  orderItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  orderItemName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray900,
  },
  orderItemMeta: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
    marginTop: 2,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: fontSizes.base, color: colors.gray600 },
  priceValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
  },
  totalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  totalValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
  },
  paymentLogo: { alignItems: "center", paddingVertical: 8 },
  paymentTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    textAlign: "center",
  },
  paymentSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    textAlign: "center",
    lineHeight: 20,
  },
  paymentMethods: {
    backgroundColor: colors.gray100,
    borderRadius: 10,
    padding: 12,
  },
  paymentMethodsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.gray700,
    marginBottom: 4,
  },
  paymentMethodsList: { fontSize: fontSizes.sm, color: colors.gray600 },
  testModeNote: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    backgroundColor: `${colors.warning}15`,
    padding: 10,
    borderRadius: 8,
    lineHeight: 16,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    height: 56,
    borderRadius: 14,
    ...shadow.md,
  },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: {
    color: colors.white,
    fontWeight: fontWeights.extrabold,
    fontSize: fontSizes.lg,
  },
});
