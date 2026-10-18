import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, glow } from '../theme/colors';

/** Chip seleccionable con gradiente al activarse. */
export default function Chip({ label, selected = false, onPress, tone = 'default', style }) {
  const gradient =
    tone === 'danger' ? gradients.negative : tone === 'info' ? gradients.violet : gradients.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? glow(tone === 'danger' ? colors.danger : colors.primary, 0.3, 12, 4) : null, style]}
    >
      {selected ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  text: { fontSize: 13, color: colors.textMuted, fontWeight: '700' },
  textSelected: { color: '#03140C' },
});
