import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

// Mensaje para listas vacías
export default function EmptyState({ icon = 'analytics-outline', title, message }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={42} color={colors.textMuted} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl * 1.5, paddingHorizontal: spacing.lg },
  title: { color: colors.text, fontWeight: '700', fontSize: 16, marginTop: spacing.sm + 2, textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
});
