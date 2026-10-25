// src/screens/home/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import {
  getFeaturedProducts,
  getProducts,
} from "../../services/productService";
import { Product, ProductCategory } from "../../types";
import { colors, fontSizes, fontWeights } from "../../theme";
import ProductCard from "../../components/ProductCard";
import CategoryChip from "../../components/CategoryChip";

const CATEGORIES: {
  id: ProductCategory | "all";
  label: string;
  icon: string;
}[] = [
  { id: "all", label: "All", icon: "apps-outline" },
  { id: "water-purifiers", label: "Purifiers", icon: "water-outline" },
  { id: "water-dispensers", label: "Dispensers", icon: "cube-outline" },
  { id: "water-pumps", label: "Pumps", icon: "cog-outline" },
  { id: "filters-cartridges", label: "Filters", icon: "filter-outline" },
  { id: "spare-parts", label: "Spare Parts", icon: "construct-outline" },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | "all"
  >("all");

  const loadData = useCallback(async () => {
    try {
      const [featuredData, recentData] = await Promise.all([
        getFeaturedProducts(),
        getProducts({ pageSize: 8 }),
      ]);
      setFeatured(featuredData);
      setRecent(recentData.products);
    } catch (err) {
      console.error("Failed to load home data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCategorySelect = (cat: ProductCategory | "all") => {
    setSelectedCategory(cat);
    navigation.navigate("Products", {
      category: cat === "all" ? undefined : cat,
    });
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={["#0A2E4A", "#0077B6"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              {greeting()}, {user?.displayName?.split(" ")[0] || "Guest"} 👋
            </Text>
            <Text style={styles.subGreeting}>
              Find your perfect water solution
            </Text>
          </View>
          <View style={styles.headerActions}>
            {user?.role === "dealer" && (
              <View style={styles.dealerBadge}>
                <Ionicons name="business" size={12} color={colors.white} />
                <Text style={styles.dealerBadgeText}>Dealer</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => navigation.navigate("Cart")}
            >
              <Ionicons name="cart-outline" size={26} color={colors.white} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={26}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate("Search")}
          activeOpacity={0.9}
        >
          <Ionicons name="search-outline" size={20} color={colors.gray500} />
          <Text style={styles.searchPlaceholder}>
            Search purifiers, filters, pumps...
          </Text>
          <Ionicons name="mic-outline" size={20} color={colors.gray400} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Category Chips */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              selected={selectedCategory === cat.id}
              onPress={() => handleCategorySelect(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Banner / Promo */}
      <LinearGradient
        colors={["#00B4D8", "#0077B6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.promoBanner}
      >
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>💧 Pure Water, Pure Life</Text>
          <Text style={styles.promoSubtitle}>
            Free installation on orders above ₹10,000
          </Text>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => navigation.navigate("Products")}
          >
            <Text style={styles.promoBtnText}>Shop Now →</Text>
          </TouchableOpacity>
        </View>
        <Ionicons
          name="water"
          size={80}
          color="rgba(255,255,255,0.15)"
          style={styles.promoIcon}
        />
      </LinearGradient>

      {/* Featured Products */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Products</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Products", { featured: true })
              }
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={featured}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
                horizontal
              />
            )}
          />
        </View>
      )}

      {/* Service Booking Banner */}
      <TouchableOpacity
        style={styles.serviceBanner}
        onPress={() => navigation.navigate("ServiceBooking")}
        activeOpacity={0.9}
      >
        <View style={styles.serviceContent}>
          <View style={styles.serviceIconBg}>
            <Ionicons name="construct" size={28} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>Need Service?</Text>
            <Text style={styles.serviceSubtitle}>
              Book a water purifier service at your doorstep
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
        </View>
      </TouchableOpacity>

      {/* Recent Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 All Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Products")}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {recent.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: item.id })
              }
            />
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.offWhite,
    gap: 16,
  },
  loadingText: { color: colors.gray500, fontSize: fontSizes.base },
  header: { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  subGreeting: {
    fontSize: fontSizes.sm,
    color: colors.accentLight,
    marginTop: 4,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  dealerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.dealer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dealerBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  cartBtn: { position: "relative" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeights.bold,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.gray400,
    fontSize: fontSizes.base,
  },
  categoriesContainer: { backgroundColor: colors.white },
  categories: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  promoBanner: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  promoContent: { zIndex: 1 },
  promoTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  promoSubtitle: {
    fontSize: fontSizes.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  promoBtn: {
    marginTop: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  promoBtnText: {
    color: colors.primaryDark,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.sm,
  },
  promoIcon: { position: "absolute", right: -10, bottom: -20 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  seeAll: {
    fontSize: fontSizes.sm,
    color: colors.accent,
    fontWeight: fontWeights.semibold,
  },
  productList: { paddingRight: 16, gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  serviceBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  serviceIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.accent}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.gray900,
  },
  serviceSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray500,
    marginTop: 2,
  },
});
