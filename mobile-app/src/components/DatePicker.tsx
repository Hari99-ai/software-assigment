import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
export default function DatePicker({
  value,
  minimumDate,
  onChange,
}: {
  value: Date;
  minimumDate: Date;
  mode?: string;
  onChange: (event: unknown, date?: Date) => void;
}) {
  const [text, setText] = useState(
    () =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`,
  );
  return (
    <View>
      <Text>Preferred date (YYYY-MM-DD)</Text>
      <TextInput
        value={text}
        onChangeText={(s) => {
          setText(s);
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const date = new Date(s + "T12:00:00");
            if (!Number.isNaN(date.getTime()) && date >= minimumDate)
              onChange(null, date);
          }
        }}
        style={{ padding: 12, backgroundColor: "white" }}
      />
    </View>
  );
}
