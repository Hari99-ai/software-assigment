// src/screens/cart/CartScreen.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";
import { productImage } from "../../data/catalogImages";
import { CartItem } from "../../types";

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function CartScreen({ navigation }: any) {
  const {
    items,
    itemCount,
    subtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to checkout.", [
        { text: "Cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    navigation.navigate("Checkout");
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={80} color={colors.gray200} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Explore our products and add items to your cart
        </Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate("Products")}
        >
          <Text style={styles.shopBtnText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image
        source={productImage(item.product)}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemContent}>
        <Text style={styles.itemBrand}>{item.product.brand}</Text>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.itemPrice}>
          {formatPrice(
            user?.role === "dealer" && user.dealerStatus === "approved"
              ? item.product.wholesalePrice
              : item.product.price,
          )}
        </Text>
        <View style={styles.itemFooter}>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{item.quantity}</Text>
            <TouchableOpacity
              style={[
                styles.qtyBtn,
                item.quantity >= item.product.stock && styles.qtyBtnDisabled,
              ]}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
            >
              <Ionicons
                name="add"
                size={16}
                color={
                  item.quantity >= item.product.stock
                    ? colors.gray300
                    : colors.primary
                }
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => removeFromCart(item.productId)}
            style={styles.removeBtn}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart ({itemCount})</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart },
            ])
          }
        >
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({itemCount} items)
              </Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {subtotal >= 10000 ? "FREE" : "₹200"}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(subtotal + (subtotal >= 10000 ? 0 : 200))}
              </Text>
            </View>
            {subtotal < 10000 && (
              <Text style={styles.freeShippingHint}>
                Add {formatPrice(10000 - subtotal)} more for free shipping!
              </Text>
            )}
          </View>
        )}
      />

      {/* Checkout Bar */}
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>
            {formatPrice(subtotal + (subtotal >= 10000 ? 0 : 200))}
          </Text>
          <Text style={styles.checkoutLabel}>Total Amount</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 40,
    backgroundColor: colors.offWhite,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: fontSizes.base,
    color: colors.gray400,
    textAlign: "center",
  },
  shopBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  shopBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  clearText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  list: { padding: 16, gap: 12 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    ...shadow.sm,
  },
  itemImage: { width: 100, height: 100, backgroundColor: colors.gray100 },
  itemContent: { flex: 1, padding: 12 },
  itemBrand: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
    marginTop: 2,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyNum: {
    width: 36,
    textAlign: "center",
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  removeBtn: { padding: 6 },
  summary: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 10,
    ...shadow.sm,
  },
  summaryTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: fontSizes.base, color: colors.gray600 },
  summaryValue: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
  },
  totalRow: {
    paddingTop: 12,
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
  freeShippingHint: {
    fontSize: fontSizes.sm,
    color: colors.success,
    textAlign: "center",
    backgroundColor: `${colors.success}12`,
    padding: 10,
    borderRadius: 8,
  },
  checkoutBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadow.lg,
  },
  checkoutTotal: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
  },
  checkoutLabel: { fontSize: fontSizes.xs, color: colors.gray500 },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    ...shadow.md,
  },
  checkoutBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
});
