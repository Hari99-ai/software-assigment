import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
export default function Layout() {
  const { itemCount } = useCart();
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarActiveTintColor: "#0077B6" }}
    >
      {[
        ["index", "Home", "home-outline"],
        ["products", "Products", "grid-outline"],
        ["cart", "Cart", "cart-outline"],
        ["orders", "Orders", "receipt-outline"],
        ["profile", "Profile", "person-outline"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarBadge: name === "cart" && itemCount ? itemCount : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={icon as any}
                color={color == null ? "#0077B6" : (color as any)}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
