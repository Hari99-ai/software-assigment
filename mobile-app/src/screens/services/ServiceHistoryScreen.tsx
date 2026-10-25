import React, { useEffect, useState } from "react";
import { FlatList, Text, View, ActivityIndicator } from "react-native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
export default function ServiceHistoryScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(
        collection(db, "serviceBookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      ),
      (s) => {
        setRows(s.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      () => {
        setError("Unable to load service history.");
        setLoading(false);
      },
    );
  }, [user]);
  if (loading) return <ActivityIndicator />;
  return (
    <FlatList
      contentContainerStyle={{ padding: 20, gap: 14 }}
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={<Text>{error || "No service bookings yet."}</Text>}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 12,
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {item.serviceType}
          </Text>
          <Text>{item.status.replaceAll("_", " ")}</Text>
          <Text>
            {item.preferredDate?.toDate().toLocaleDateString("en-IN")} ·{" "}
            {item.preferredTime}
          </Text>
          <Text>
            {item.address.street}, {item.address.city}
          </Text>
          {item.assignedTechnician && (
            <Text>Technician: {item.assignedTechnician}</Text>
          )}
          {item.notes && <Text>{item.notes}</Text>}
        </View>
      )}
    />
  );
}
