import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Chip seleccionable (dirección, tipo de movimiento, filtros)
export default function Chip({ label, selected = false, onPress, tone = 'default', style }) {
  const selectedColor =
    tone === 'danger' ? colors.danger : tone === 'success' ? colors.primary : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: selectedColor, borderColor: selectedColor },
        style,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  textSelected: { color: '#052611' },
});
