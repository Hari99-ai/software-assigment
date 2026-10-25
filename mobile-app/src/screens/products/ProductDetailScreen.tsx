// src/screens/products/ProductDetailScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProductById } from "../../services/productService";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types";
import { productImage } from "../../data/catalogImages";
import { colors, fontSizes, fontWeights, shadow } from "../../theme";

const { width, height } = Dimensions.get("window");
const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ProductDetailScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const { addToCart, getItemQuantity } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [qty, setQty] = useState(1);

  const isDealer = user?.role === "dealer" && user?.dealerStatus === "approved";
  const displayPrice = isDealer ? product?.wholesalePrice : product?.price;
  const cartQty = product ? getItemQuantity(product.id) : 0;

  useEffect(() => {
    getProductById(productId)
      .then((p) => {
        setProduct(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={colors.gray300}
        />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backBtn2}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtn2Text}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      Alert.alert("Out of Stock", "This product is currently unavailable.");
      return;
    }
    addToCart(product, qty);
    Alert.alert(
      "Added to Cart! 🛒",
      `${product.name} has been added to your cart.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => navigation.navigate("Cart") },
      ],
    );
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image with Back Button */}
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.gray800} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setZoomVisible(true)}
            activeOpacity={0.95}
          >
            <Image
              source={productImage(product)}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.zoomHint}>
              <Ionicons name="expand-outline" size={16} color={colors.white} />
              <Text style={styles.zoomHintText}>Tap to zoom</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Brand + Category */}
          <View style={styles.meta}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{product.brand}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {product.category.replace(/-/g, " ")}
              </Text>
            </View>
          </View>

          {/* Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={
                  s <= Math.floor(product.rating)
                    ? "star"
                    : s - 0.5 <= product.rating
                      ? "star-half"
                      : "star-outline"
                }
                size={18}
                color="#F59E0B"
              />
            ))}
            <Text style={styles.ratingNum}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({product.reviewCount} reviews)
            </Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            {isDealer && product.wholesalePrice && (
              <View style={styles.dealerPriceContainer}>
                <View style={styles.dealerPriceBadge}>
                  <Ionicons name="business" size={12} color={colors.dealer} />
                  <Text style={styles.dealerLabel}>Wholesale Price</Text>
                </View>
                <Text style={styles.originalPrice}>
                  {formatPrice(product.price)}
                </Text>
              </View>
            )}
            <Text style={styles.price}>
              {formatPrice(displayPrice || product.price)}
            </Text>
            {isDealer && (
              <Text style={styles.savingsText}>
                You save{" "}
                {formatPrice(product.price - (product.wholesalePrice || 0))}
              </Text>
            )}
          </View>

          {/* Stock */}
          <View
            style={[styles.stockBadge, product.stock === 0 && styles.stockOut]}
          >
            <Ionicons
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={16}
              color={product.stock > 0 ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.stockText,
                product.stock === 0 && styles.stockTextOut,
              ]}
            >
              {product.stock > 0
                ? `In Stock (${product.stock} available)`
                : "Out of Stock"}
            </Text>
          </View>

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity:</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={qty <= 1 ? colors.gray300 : colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{qty}</Text>
                <TouchableOpacity
                  style={[
                    styles.qtyBtn,
                    qty >= product.stock && styles.qtyBtnDisabled,
                  ]}
                  onPress={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={qty >= product.stock}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      qty >= product.stock ? colors.gray300 : colors.primary
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Specifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(product.specifications).map(([key, value]) => (
              <View key={key} style={styles.specRow}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {product.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.serviceBtn}
          onPress={() => navigation.navigate("ServiceBooking")}
        >
          <Ionicons name="construct-outline" size={20} color={colors.primary} />
          <Text style={styles.serviceBtnText}>Book Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cartBtnFull,
            product.stock === 0 && styles.cartBtnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={product.stock === 0}
        >
          <Ionicons name="cart-outline" size={20} color={colors.white} />
          <Text style={styles.cartBtnText}>
            {cartQty > 0
              ? `In Cart (${cartQty})`
              : product.stock === 0
                ? "Out of Stock"
                : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zoom Modal */}
      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomVisible(false)}
      >
        <TouchableOpacity
          style={styles.zoomModal}
          onPress={() => setZoomVisible(false)}
        >
          <Image
            source={productImage(product)}
            style={styles.zoomedImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeZoom}
            onPress={() => setZoomVisible(false)}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.offWhite,
  },
  errorText: { fontSize: fontSizes.lg, color: colors.gray500 },
  imageContainer: { position: "relative" },
  backBtn: {
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
    ...shadow.md,
  },
  image: { width, height: width * 0.85, backgroundColor: colors.gray100 },
  zoomHint: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  zoomHintText: { color: colors.white, fontSize: fontSizes.xs },
  content: { padding: 20 },
  meta: { flexDirection: "row", gap: 8, marginBottom: 10 },
  brandBadge: {
    backgroundColor: `${colors.accent}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandText: {
    color: colors.accentDark,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  categoryBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: colors.gray600,
    fontSize: fontSizes.xs,
    textTransform: "capitalize",
  },
  productName: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    lineHeight: 30,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  ratingNum: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.gray800,
    marginLeft: 4,
  },
  reviewCount: { fontSize: fontSizes.sm, color: colors.gray400 },
  priceSection: { marginTop: 16, marginBottom: 12 },
  dealerPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  dealerPriceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.dealerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealerLabel: {
    color: colors.dealer,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  originalPrice: {
    color: colors.gray400,
    fontSize: fontSizes.base,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 32,
    fontWeight: fontWeights.extrabold,
    color: colors.primary,
  },
  savingsText: {
    fontSize: fontSizes.sm,
    color: colors.success,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  stockOut: { backgroundColor: `${colors.error}15` },
  stockText: {
    fontSize: fontSizes.sm,
    color: colors.success,
    fontWeight: fontWeights.medium,
  },
  stockTextOut: { color: colors.error },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  qtyLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.gray700,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    overflow: "hidden",
  },
  qtyBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  qtyBtnDisabled: { backgroundColor: colors.gray50 },
  qtyNum: {
    width: 44,
    textAlign: "center",
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
    marginBottom: 10,
  },
  description: {
    fontSize: fontSizes.base,
    color: colors.gray600,
    lineHeight: 24,
  },
  specRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  specKey: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.gray500,
    fontWeight: fontWeights.medium,
  },
  specValue: {
    flex: 1.5,
    fontSize: fontSizes.sm,
    color: colors.gray800,
    fontWeight: fontWeights.medium,
    textAlign: "right",
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: fontSizes.xs, color: colors.gray500 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    ...shadow.lg,
  },
  serviceBtn: {
    flex: 0.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  serviceBtnText: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.sm,
  },
  cartBtnFull: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  cartBtnDisabled: { backgroundColor: colors.gray300 },
  cartBtnText: {
    color: colors.white,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.base,
  },
  backBtn2: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtn2Text: { color: colors.white, fontWeight: fontWeights.semibold },
  zoomModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: { width: width, height: height * 0.8 },
  closeZoom: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
});
