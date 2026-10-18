import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

// Botón reutilizable con variantes
export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  children,
}) {
  const map = {
    primary: { bg: colors.primary, border: 'transparent', text: '#052611' },
    outline: { bg: 'transparent', border: colors.primary, text: colors.primary },
    ghost: { bg: colors.surfaceAlt, border: colors.border, text: colors.text },
    danger: { bg: colors.danger, border: 'transparent', text: colors.white },
  };
  const v = map[variant] || map.primary;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      style={({ pressed }) => [
        styles.touch,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }, textStyle]}>{children || title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 16, fontWeight: '700' },
});
