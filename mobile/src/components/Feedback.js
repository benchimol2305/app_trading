import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Aviso de error o éxito
export default function Feedback({ type = 'error', message }) {
  if (!message) return null;
  const error = type === 'error';

  return (
    <View style={[styles.wrap, { backgroundColor: error ? colors.dangerSoft : colors.successSoft, borderColor: error ? colors.danger : colors.success }]}>
      <Text style={[styles.text, { color: error ? '#FCA5A5' : '#86EFAC' }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 4,
    marginBottom: spacing.md,
  },
  text: { fontSize: 13, fontWeight: '600' },
});
