import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

/** Campo de texto con foco luminoso, sufijo y estilos unificados. */
export default function Input({ label, error, hint, suffix, multiline, numberOfLines, style, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.row,
          multiline && styles.rowMultiline,
          focused && styles.rowFocused,
          error && styles.rowError,
          props.editable === false && styles.disabled,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textDim}
          selectionColor={colors.primary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
  label: { ...type.micro, color: colors.textMuted, marginBottom: 7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  rowMultiline: { alignItems: 'flex-start' },
  rowFocused: { borderColor: 'rgba(45,224,138,0.55)', backgroundColor: 'rgba(45,224,138,0.05)' },
  rowError: { borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 5,
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top', fontWeight: '500' },
  suffix: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginLeft: spacing.sm },
  hint: { color: colors.textDim, fontSize: 11, marginTop: 5 },
  error: { color: colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
});
