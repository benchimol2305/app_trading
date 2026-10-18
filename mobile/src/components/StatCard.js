import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Tarjeta de métrica (valor grande + etiqueta)
export default function StatCard({ label, value, hint, tone = 'neutral', style }) {
  const toneColor =
    tone === 'positive' ? colors.success : tone === 'negative' ? colors.danger : colors.text;

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.hint} numberOfLines={1}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 4,
  },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
