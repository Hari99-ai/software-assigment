import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
export default function OrderDetailScreen({ route }: any) {
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(
    () =>
      onSnapshot(
        doc(db, "orders", String(route.params.orderId)),
        (s) => {
          if (s.exists()) setOrder(s.data());
          else setError("Order not found.");
        },
        () => setError("Unable to load order."),
      ),
    [route.params.orderId],
  );
  if (error) return <Text style={{ padding: 24 }}>{error}</Text>;
  if (!order) return <ActivityIndicator />;
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        backgroundColor: "#F4F8FA",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "700" }}>
        Order #{String(route.params.orderId).slice(-8)}
      </Text>
      <Text>Status: {order.status.replaceAll("_", " ")}</Text>
      <Text>Payment: {order.paymentStatus}</Text>
      {order.items.map((i: any) => (
        <View
          key={i.productId}
          style={{ padding: 16, backgroundColor: "white", borderRadius: 12 }}
        >
          <Text>{i.name}</Text>
          <Text>
            {i.quantity} × ₹{i.price.toLocaleString("en-IN")}
          </Text>
        </View>
      ))}
      <Text style={{ fontWeight: "700" }}>
        Total: ₹{order.totalAmount.toLocaleString("en-IN")}
      </Text>
      <Text>
        {order.deliveryAddress.fullName}
        {"\n"}
        {order.deliveryAddress.street}
        {"\n"}
        {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
        {order.deliveryAddress.pincode}
        {"\n"}
        {order.deliveryAddress.phone}
      </Text>
      <Text style={{ fontSize: 20 }}>Tracking history</Text>
      {order.statusHistory?.map((h: any, i: number) => (
        <Text key={i}>
          {h.status.replaceAll("_", " ")} ·{" "}
          {h.updatedAt?.toDate().toLocaleString("en-IN")}
          {"\n"}
          {h.note}
        </Text>
      ))}
    </ScrollView>
  );
}
