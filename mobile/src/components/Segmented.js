import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Selector segmentado (día / semana / mes, filtros)
export default function Segmented({ options = [], value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange && onChange(opt.value)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  itemActive: { backgroundColor: colors.primary },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  textActive: { color: '#052611' },
});
