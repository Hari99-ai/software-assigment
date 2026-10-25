// src/screens/orders/OrdersScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserOrders } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import { Order, OrderStatus } from "../../types";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";

const STATUS_CONFIG: Record<
  OrderStatus,
  { color: string; icon: string; label: string }
> = {
  confirmed: {
    color: colors.info,
    icon: "checkmark-circle",
    label: "Confirmed",
  },
  processing: { color: colors.warning, icon: "hourglass", label: "Processing" },
  shipped: { color: colors.accent, icon: "airplane", label: "Shipped" },
  out_for_delivery: {
    color: colors.accent,
    icon: "bicycle",
    label: "Out for Delivery",
  },
  delivered: {
    color: colors.success,
    icon: "checkmark-done-circle",
    label: "Delivered",
  },
  cancelled: { color: colors.error, icon: "close-circle", label: "Cancelled" },
};

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const formatDate = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function OrdersScreen({ navigation }: any) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserOrders(user.uid);
      setOrders(data);
      setError("");
    } catch {
      setError("Unable to load orders. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="person-circle-outline"
          size={60}
          color={colors.gray300}
        />
        <Text style={styles.emptyTitle}>Sign in to view orders</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  if (error)
    return (
      <TouchableOpacity style={styles.center} onPress={load}>
        <Text>{error} Tap to retry.</Text>
      </TouchableOpacity>
    );

  const renderOrder = ({ item }: { item: Order }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.confirmed;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>
            Order #{item.id.slice(-8).toUpperCase()}
          </Text>
          <View
            style={[styles.statusBadge, { backgroundColor: `${cfg.color}20` }]}
          >
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        <View style={styles.orderItems}>
          {item.items.slice(0, 2).map((it, i) => (
            <Text key={i} style={styles.orderItemText} numberOfLines={1}>
              • {it.name} × {it.quantity}
            </Text>
          ))}
          {item.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.items.length - 2} more items
            </Text>
          )}
        </View>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatPrice(item.totalAmount)}</Text>
          <View style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accent} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray100 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={60} color={colors.gray200} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Your orders will appear here once you make a purchase
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.navigate("Products")}
            >
              <Text style={styles.btnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 40,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  list: { padding: 16, gap: 12 },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...shadow.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: fontSizes.xs, fontWeight: fontWeights.semibold },
  orderDate: { fontSize: fontSizes.xs, color: colors.gray400 },
  orderItems: { gap: 2 },
  orderItemText: { fontSize: fontSizes.sm, color: colors.gray600 },
  moreItems: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  orderTotal: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  viewBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewBtnText: {
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: fontWeights.medium,
  },
  empty: {
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray400,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: colors.white, fontWeight: fontWeights.bold },
});
