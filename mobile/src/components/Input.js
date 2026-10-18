import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Campo de texto con etiqueta, sufijo y estilos unificados
export default function Input({
  label,
  error,
  hint,
  suffix,
  multiline,
  numberOfLines,
  style,
  ...props
}) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, multiline && styles.rowMultiline, error && styles.rowError, props.editable === false && styles.disabled]}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[styles.input, multiline && styles.multiline, style]}
          {...props}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  rowMultiline: { alignItems: 'flex-start' },
  rowError: { borderColor: colors.danger },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  suffix: { color: colors.textMuted, fontSize: 14, fontWeight: '600', marginLeft: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});
