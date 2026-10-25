import React, { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
function Routes() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  useEffect(() => {
    if (loading) return;
    const authRoute = ["Login", "Register"].includes(segments[0] || "");
    if (!user && !authRoute) router.replace("/Login");
    if (user && authRoute) router.replace("/(tabs)");
  }, [user, loading, segments]);
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0A2E4A" },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
    </Stack>
  );
}
export default function Layout() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes />
      </CartProvider>
    </AuthProvider>
  );
}
