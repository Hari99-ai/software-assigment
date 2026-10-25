import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Linking } from "react-native";
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
export type Place = {
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  pincode: string;
};
export default function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Place[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  async function search() {
    setBusy(true);
    setError("");
    try {
      const response = await httpsCallable<{ query: string }, Place[]>(
        functions,
        "searchPlaces",
      )({ query });
      setRows(response.data);
      if (!response.data.length)
        setError("No places found. You can enter the address manually.");
    } catch {
      setError("Place search unavailable. You can enter the address manually.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View
      style={{
        gap: 10,
        backgroundColor: "#EAF4F8",
        padding: 16,
        borderRadius: 12,
      }}
    >
      <Text style={{ fontWeight: "600" }}>Find delivery locality</Text>
      <TextInput
        accessibilityLabel="Search city or locality"
        placeholder="City or locality (exclude personal details)"
        value={query}
        onChangeText={setQuery}
        style={{ padding: 12, backgroundColor: "white", borderRadius: 8 }}
      />
      <TouchableOpacity
        disabled={busy || query.trim().length < 3}
        onPress={search}
      >
        <Text style={{ color: "#0077B6" }}>
          {busy ? "Searching…" : "Search places"}
        </Text>
      </TouchableOpacity>
      {error && <Text>{error}</Text>}
      {rows.map((p, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            onSelect(p);
            setSelected(p);
            setRows([]);
          }}
        >
          <Text style={{ paddingVertical: 10 }}>{p.name}</Text>
        </TouchableOpacity>
      ))}
      {selected && (
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              `https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`,
            )
          }
        >
          <Text>View selected location on map ↗</Text>
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 11, color: "#607080" }}>
        © OpenStreetMap contributors · Verify the complete delivery address
        below.
      </Text>
    </View>
  );
}
