import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

/** Barra de progreso doble (ej: proporción LONG vs SHORT). */
export default function SplitBar({ left = 50, leftColor = colors.primary, rightColor = colors.warning, height = 8 }) {
  const safeLeft = Math.max(0, Math.min(100, Number(left) || 0));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={[styles.segment, { flex: safeLeft, backgroundColor: leftColor }]} />
      <View style={[styles.segment, { flex: Math.max(0.001, 100 - safeLeft), backgroundColor: rightColor, opacity: 0.85 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.round,
  },
  segment: { height: '100%' },
});
