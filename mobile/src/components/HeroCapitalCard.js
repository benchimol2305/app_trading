import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, type, glow } from '../theme/colors';
import { formatMoney, formatPct, colorForResult } from '../lib/format';
import { Sparkline } from './Charts';

/**
 * Tarjeta principal: capital actual, resultado y mini gráfico.
 * Es el elemento visual dominante del dashboard.
 */
export default function HeroCapitalCard({ equity, pnl, pnlPct, equitySeries = [], stats = [] }) {
  const tone = pnl >= 0 ? colors.success : colors.danger;
  const badgeGradient = pnl >= 0 ? gradients.successCard : gradients.dangerCard;

  return (
    <View style={[styles.wrap, glow(tone, 0.28, 26, 10)]}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${tone}33`, 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topLine}>
        <Text style={styles.label}>Capital actual</Text>
        <View style={styles.livePill}>
          <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.liveText}>En vivo</Text>
        </View>
      </View>

      <Text style={styles.equity}>{formatMoney(equity)}</Text>

      <View style={styles.pnlRow}>
        <LinearGradient colors={badgeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pnlBadge}>
          <Ionicons name={pnl >= 0 ? 'trending-up' : 'trending-down'} size={15} color={tone} />
          <Text style={[styles.pnlText, { color: tone }]}>{formatMoney(pnl, true)}</Text>
          <Text style={[styles.pnlPct, { color: tone }]}>{formatPct(pnlPct)}</Text>
        </LinearGradient>
      </View>

      <Sparkline data={equitySeries} color={tone} height={58} />

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
            <Text style={styles.statLabel} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={[styles.statValue, s.tone ? { color: s.tone } : null]} numberOfLines={1}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  topLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...type.micro, color: colors.textMuted },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
    backgroundColor: 'rgba(45,224,138,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,224,138,0.3)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  liveText: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  equity: { ...type.hero, color: colors.text, marginTop: spacing.sm },
  pnlRow: { flexDirection: 'row', marginTop: spacing.sm, marginBottom: spacing.sm },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pnlText: { fontSize: 14, fontWeight: '800', marginLeft: 6, fontVariant: ['tabular-nums'] },
  pnlPct: { fontSize: 12, fontWeight: '700', marginLeft: 6, opacity: 0.9, fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statLabel: { color: colors.textDim, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  statValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 5, fontVariant: ['tabular-nums'] },
});
