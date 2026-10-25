// src/components/CategoryChip.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSizes, fontWeights } from "../theme";

interface Props {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

export default function CategoryChip({
  label,
  icon,
  selected,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={selected ? colors.white : colors.gray600}
      />
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray600,
  },
  labelSelected: { color: colors.white },
});
