// src/components/ProductCard.tsx
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "../types";
import { colors, fontSizes, fontWeights } from "../theme";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { productImage } from "../data/catalogImages";

interface Props {
  product: Product;
  onPress: () => void;
  horizontal?: boolean;
}

const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ProductCard({
  product,
  onPress,
  horizontal = false,
}: Props) {
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const price =
    user?.role === "dealer" && user.dealerStatus === "approved"
      ? product.wholesalePrice
      : product.price;
  const inCart = isInCart(product.id);

  return (
    <TouchableOpacity
      style={[styles.card, horizontal ? styles.horizontal : styles.grid]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Badge */}
      {product.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>Featured</Text>
        </View>
      )}
      {product.stock < 10 && product.stock > 0 && (
        <View style={styles.lowStockBadge}>
          <Text style={styles.lowStockText}>Only {product.stock} left</Text>
        </View>
      )}

      {/* Image */}
      <Image
        source={productImage(product)}
        style={[
          styles.image,
          horizontal ? styles.imageHorizontal : styles.imageGrid,
        ]}
        resizeMode="cover"
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating */}
        <View style={styles.rating}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(price)}</Text>
          <TouchableOpacity
            style={[styles.addBtn, inCart && styles.addBtnActive]}
            onPress={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
          >
            <Ionicons
              name={inCart ? "checkmark" : "add"}
              size={18}
              color={inCart ? colors.white : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  grid: { width: "47.5%" },
  horizontal: { width: 180 },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  lowStockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  image: { width: "100%", backgroundColor: colors.gray100 },
  imageGrid: { height: 140 },
  imageHorizontal: { height: 130 },
  content: { padding: 12 },
  brand: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.gray900,
    marginTop: 2,
    lineHeight: 18,
  },
  rating: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  ratingText: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.gray700,
  },
  reviewCount: { fontSize: 10, color: colors.gray400 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  addBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
