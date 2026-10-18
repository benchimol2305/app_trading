import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, type, glow } from '../theme/colors';

/** Tarjeta de métrica con ícono, valor y etiqueta. */
export default function MetricCard({ icon, label, value, hint, tone = 'neutral', style }) {
  const toneColor =
    tone === 'positive' ? colors.success : tone === 'negative' ? colors.danger : tone === 'info' ? colors.info : colors.text;

  const iconGradient =
    tone === 'positive'
      ? ['rgba(45,224,138,0.28)', 'rgba(34,211,238,0.12)']
      : tone === 'negative'
      ? ['rgba(244,63,94,0.28)', 'rgba(244,63,94,0.08)']
      : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)'];

  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <LinearGradient colors={iconGradient} style={StyleSheet.absoluteFill} />
          {icon ? <Ionicons name={icon} size={15} color={toneColor} /> : null}
        </View>
        {hint ? (
          <Text style={styles.hint} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.value, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
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
    padding: spacing.sm + 4,
    ...glow('#000000', 0.4, 14, 4),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.textDim, fontSize: 10, fontWeight: '600', maxWidth: '62%', textAlign: 'right' },
  value: { ...type.metric, marginTop: spacing.sm },
  label: { ...type.micro, color: colors.textMuted, marginTop: 4 },
});
