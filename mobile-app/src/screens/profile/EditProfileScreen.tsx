import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!user || !name.trim() || (phone && !/^\d{10}$/.test(phone))) {
      Alert.alert("Check your name and 10-digit phone number");
      return;
    }
    setBusy(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: name.trim(),
        phone,
      });
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert("Could not save profile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text>Display name</Text>
      <TextInput
        accessibilityLabel="Display name"
        value={name}
        onChangeText={setName}
        style={{ padding: 14, backgroundColor: "white", borderRadius: 10 }}
      />
      <Text>Phone number</Text>
      <TextInput
        accessibilityLabel="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
        style={{ padding: 14, backgroundColor: "white", borderRadius: 10 }}
      />
      <Text>{user?.email}</Text>
      <TouchableOpacity
        disabled={busy}
        onPress={save}
        style={{ padding: 16, backgroundColor: "#0077B6", borderRadius: 12 }}
      >
        <Text style={{ color: "white" }}>
          {busy ? "Saving…" : "Save profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
