import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { Address } from "../../types";
const empty = {
  id: "",
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};
export default function AddressesScreen() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<Address>(empty);
  const [busy, setBusy] = useState(false);
  async function persist(addresses: Address[]) {
    if (!user) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { addresses });
      await refreshUser();
      setForm(empty);
    } catch {
      Alert.alert("Could not save addresses");
    } finally {
      setBusy(false);
    }
  }
  function save() {
    if (
      !form.fullName.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !/^\d{10}$/.test(form.phone) ||
      !/^\d{6}$/.test(form.pincode)
    ) {
      Alert.alert("Complete the address, phone and pincode");
      return;
    }
    const rows = [
      ...(user?.addresses || []).filter((a) => a.id !== form.id),
      { ...form, id: form.id || Date.now().toString() },
    ];
    persist(rows);
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      {user?.addresses?.map((a) => (
        <View
          key={a.id}
          style={{
            padding: 18,
            borderRadius: 12,
            backgroundColor: "white",
            gap: 8,
          }}
        >
          <Text style={{ fontWeight: "700" }}>
            {a.label} {a.isDefault ? "· Default" : ""}
          </Text>
          <Text>
            {a.fullName}
            {"\n"}
            {a.street}, {a.city} {a.pincode}
          </Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <TouchableOpacity disabled={busy} onPress={() => setForm(a)}>
              <Text>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy}
              onPress={() =>
                persist(
                  user.addresses!.map((row) => ({
                    ...row,
                    isDefault: row.id === a.id,
                  })),
                )
              }
            >
              <Text>Set default</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={busy}
              onPress={() =>
                persist(user.addresses!.filter((row) => row.id !== a.id))
              }
            >
              <Text>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        {form.id ? "Edit address" : "Add address"}
      </Text>
      {(
        [
          "label",
          "fullName",
          "phone",
          "street",
          "city",
          "state",
          "pincode",
        ] as const
      ).map((field) => (
        <View key={field}>
          <Text>{field.replace("fullName", "Full name")}</Text>
          <TextInput
            accessibilityLabel={field}
            value={form[field]}
            onChangeText={(value) => setForm((f) => ({ ...f, [field]: value }))}
            keyboardType={
              ["phone", "pincode"].includes(field) ? "number-pad" : "default"
            }
            style={{
              padding: 12,
              backgroundColor: "white",
              borderRadius: 8,
              marginTop: 6,
            }}
          />
        </View>
      ))}
      <TouchableOpacity
        disabled={busy}
        onPress={save}
        style={{ padding: 18, backgroundColor: "#0077B6", borderRadius: 12 }}
      >
        <Text style={{ color: "white" }}>
          {busy ? "Saving…" : "Save address"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
