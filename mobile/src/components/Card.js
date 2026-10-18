import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Contenedor tipo tarjeta
export default function Card({ title, action, children, style, contentStyle }) {
  return (
    <View style={[styles.card, style]}>
      {title || action ? (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {action}
        </View>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
