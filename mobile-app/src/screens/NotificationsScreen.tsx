import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
export default function NotificationsScreen() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(
        collection(db, `notifications/${user.uid}/messages`),
        orderBy("createdAt", "desc"),
      ),
      (s) => {
        setRows(s.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      () => {
        setError("Unable to load notifications.");
        setLoading(false);
      },
    );
  }, [user]);
  async function enable() {
    try {
      if (Platform.OS !== "android")
        throw new Error(
          "Push setup is available on the Android development build.",
        );
      await Notifications.setNotificationChannelAsync("orders", {
        name: "Orders and service",
        importance: 3,
      });
      const p = await Notifications.requestPermissionsAsync();
      if (p.status !== "granted") return;
      const token = await Notifications.getDevicePushTokenAsync();
      if (user)
        await updateDoc(doc(db, "users", user.uid), {
          fcmToken: String(token.data),
        });
      Alert.alert("Notifications enabled");
    } catch (e) {
      Alert.alert("Push setup", (e as Error).message);
    }
  }
  return (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
      <TouchableOpacity
        onPress={enable}
        style={{ padding: 16, backgroundColor: "#DDF1F7", borderRadius: 12 }}
      >
        <Text>Enable order and service push notifications</Text>
      </TouchableOpacity>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={
          <Text>
            {loading
              ? "Loading notifications…"
              : error || "You are all caught up."}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              updateDoc(
                doc(db, `notifications/${user!.uid}/messages/${item.id}`),
                { read: true },
              ).catch(() => Alert.alert("Unable to mark as read"))
            }
            style={{
              padding: 18,
              marginBottom: 10,
              backgroundColor: item.read ? "#fff" : "#E8F5FA",
              borderRadius: 12,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{item.title}</Text>
            <Text>{item.body}</Text>
            <Text>{item.createdAt?.toDate().toLocaleString("en-IN")}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
