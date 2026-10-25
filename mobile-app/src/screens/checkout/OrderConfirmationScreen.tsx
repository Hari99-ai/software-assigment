// src/screens/checkout/OrderConfirmationScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getOrderById } from "../../services/orderService";
import { Order } from "../../types";
import { colors, fontSizes, fontWeights } from "../../theme";

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function OrderConfirmationScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0A2E4A", "#0077B6"]} style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        </View>
        <Text style={styles.successTitle}>Order Confirmed! 🎉</Text>
        <Text style={styles.orderId}>
          Order #{orderId.slice(-8).toUpperCase()}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : order ? (
          <>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="bag-check-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>Items</Text>
                <Text style={styles.infoValue}>
                  {order.items.length} product(s)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={colors.accent} />
                <Text style={styles.infoLabel}>Total Paid</Text>
                <Text style={styles.infoValue}>
                  {formatPrice(order.totalAmount)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.infoLabel}>Deliver To</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.accent} />
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Confirmed</Text>
                </View>
              </View>
            </View>

            <Text style={styles.deliveryInfo}>
              📦 Your order will be delivered within 5-7 working days. You will
              receive push notifications as your order progresses.
            </Text>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate("Orders")}
        >
          <Ionicons name="location-outline" size={18} color={colors.white} />
          <Text style={styles.trackBtnText}>Track Your Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopAgainBtn}
          onPress={() => navigation.navigate("Main")}
        >
          <Text style={styles.shopAgainText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { paddingTop: 60, paddingBottom: 40, alignItems: "center", gap: 12 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.extrabold,
    color: colors.white,
  },
  orderId: { fontSize: fontSizes.sm, color: colors.accentLight },
  content: { flex: 1, padding: 24, gap: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { flex: 1, fontSize: fontSizes.base, color: colors.gray600 },
  infoValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
  },
  statusBadge: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: colors.success,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  deliveryInfo: {
    fontSize: fontSizes.sm,
    color: colors.gray600,
    backgroundColor: `${colors.accent}12`,
    padding: 14,
    borderRadius: 12,
    lineHeight: 20,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
  },
  trackBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
  shopAgainBtn: { height: 52, justifyContent: "center", alignItems: "center" },
  shopAgainText: {
    color: colors.accent,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.base,
  },
});
