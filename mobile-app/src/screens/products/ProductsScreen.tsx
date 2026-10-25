import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { searchProducts } from "../../services/productService";
import { Product } from "../../types";
import ProductCard from "../../components/ProductCard";
const categories = [
  ["all", "All"],
  ["water-purifiers", "Purifiers"],
  ["water-dispensers", "Dispensers"],
  ["water-pumps", "Pumps"],
  ["filters-cartridges", "Filters"],
  ["spare-parts", "Parts"],
];
export default function ProductsScreen({ route, navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState(route.params?.query || "");
  const [category, setCategory] = useState(route.params?.category || "all");
  const [sort, setSort] = useState("name");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setProducts(await searchProducts(""));
    } catch {
      setError("Unable to load products. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);
  const shown = products
    .filter(
      (p) =>
        (category === "all" || p.category === category) &&
        `${p.name} ${p.brand} ${p.description}`
          .toLowerCase()
          .includes(term.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
          : a.name.localeCompare(b.name),
    );
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        paddingTop: 48,
        backgroundColor: "#F4F8FA",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#0A2E4A" }}>
        Water solutions
      </Text>
      <TextInput
        accessibilityLabel="Search products"
        placeholder="Search products or brands"
        value={term}
        onChangeText={setTerm}
        style={{
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 12,
          marginVertical: 16,
        }}
      />
      <ScrollView
        horizontal
        style={{ maxHeight: 46 }}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(([id, label]) => (
          <TouchableOpacity
            key={id}
            onPress={() => setCategory(id)}
            style={{
              padding: 10,
              marginRight: 6,
              borderRadius: 18,
              backgroundColor: category === id ? "#0077B6" : "#fff",
            }}
          >
            <Text style={{ color: category === id ? "white" : "#0A2E4A" }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 18, marginVertical: 12 }}>
        {[
          ["name", "Name"],
          ["asc", "Price ↑"],
          ["desc", "Price ↓"],
        ].map(([id, label]) => (
          <TouchableOpacity key={id} onPress={() => setSort(id)}>
            <Text style={{ color: sort === id ? "#0077B6" : "#607080" }}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <TouchableOpacity onPress={load}>
          <Text accessibilityRole="alert">{error} Tap to retry.</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("ProductDetail", { productId: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={{ padding: 32 }}>No products match your search.</Text>
          }
        />
      )}
    </View>
  );
}
