import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/colors';

/** Estado vacío con ícono dentro de un halo. */
export default function EmptyState({ icon = 'analytics-outline', title, message }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.halo}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 1.4,
    paddingHorizontal: spacing.lg,
  },
  halo: {
    width: 72,
    height: 72,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(45,224,138,0.28)',
  },
  title: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: spacing.md, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
});
