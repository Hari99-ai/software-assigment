import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
export default function ProfileScreen({ navigation }: any) {
  const { user, logout, refreshUser } = useAuth();
  const [orders, setOrders] = useState<number | null>(null);
  const [services, setServices] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    const queryFor = (name: string) =>
      query(collection(db, name), where("userId", "==", user.uid));
    const stop = [
      onSnapshot(
        queryFor("orders"),
        (s) => setOrders(s.size),
        () => setOrders(null),
      ),
      onSnapshot(
        queryFor("serviceBookings"),
        (s) => setServices(s.size),
        () => setServices(null),
      ),
    ];
    return () => stop.forEach((fn) => fn());
  }, [user]);
  if (!user) return null;
  const menus = [
    ["Edit profile", "EditProfile"],
    ["Saved addresses", "Addresses"],
    ["Order history", "Orders"],
    ["Book a service", "ServiceBooking"],
    ["Service history", "ServiceHistory"],
    ["Notifications", "Notifications"],
  ];
  return (
    <ScrollView style={styles.page}>
      <LinearGradient colors={["#0A2E4A", "#0077B6"]} style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32, color: "white" }}>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={{ color: "#BCEBFF" }}>{user.email}</Text>
        <Text style={{ color: "white", marginTop: 12 }}>
          {user.role === "dealer"
            ? "Approved dealer · Wholesale catalog"
            : "Customer account"}
        </Text>
      </LinearGradient>
      <View style={styles.stats}>
        {[
          [orders ?? "—", "Orders"],
          [services ?? "—", "Services"],
          [user.addresses?.length || 0, "Addresses"],
        ].map(([n, label]) => (
          <View key={String(label)} style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#0A2E4A" }}>
              {n}
            </Text>
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.menu}>
        {menus.map(([label, route]) => (
          <TouchableOpacity
            key={route}
            onPress={() => navigation.navigate(route)}
            style={styles.row}
          >
            <Text style={styles.rowText}>{label}</Text>
            <Text>→</Text>
          </TouchableOpacity>
        ))}
      </View>
      {user.role !== "dealer" && (
        <TouchableOpacity
          style={styles.dealer}
          onPress={() => navigation.navigate("DealerApply")}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#6D28D9" }}>
            Become an AquaPure dealer
          </Text>
          <Text style={{ marginTop: 8 }}>
            Apply for wholesale pricing and bulk ordering. Applications require
            admin approval.
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          refreshUser().catch(() => Alert.alert("Could not refresh account"))
        }
      >
        <Text>Refresh account and dealer approval</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.logout}
        onPress={() => logout().catch(() => Alert.alert("Unable to sign out"))}
      >
        <Text style={{ color: "#B73838", fontWeight: "600" }}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F4F8FA" },
  header: { paddingTop: 64, paddingBottom: 32, alignItems: "center", gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffffff30",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 25, fontWeight: "700", color: "white" },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 24,
    backgroundColor: "white",
  },
  menu: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "white",
  },
  row: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E9F0F3",
  },
  rowText: { fontSize: 16, color: "#0A2E4A" },
  dealer: {
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    padding: 22,
    margin: 20,
    marginTop: 0,
  },
  logout: {
    padding: 22,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    alignItems: "center",
  },
});
