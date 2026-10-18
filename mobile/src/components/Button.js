import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, glow } from '../theme/colors';

/** Botón con gradiente para la acción principal. */
export default function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, style, textStyle, children }) {
  const config = {
    primary: { gradient: gradients.primary, text: '#03140C', border: 'transparent', shadow: colors.primary },
    danger: { gradient: gradients.negative, text: '#1B0308', border: 'transparent', shadow: colors.danger },
    ghost: { gradient: gradients.card, text: colors.text, border: colors.border },
    outline: { gradient: null, text: colors.primary, border: colors.primary },
  }[variant] || {};

  const label = children || title;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255,255,255,0.14)' }}
      style={({ pressed }) => [
        styles.touch,
        {
          borderColor: config.border,
          borderWidth: variant === 'outline' || variant === 'ghost' ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        variant === 'primary' || variant === 'danger' ? glow(config.shadow, 0.35, 16, 6) : null,
        style,
      ]}
    >
      {config.gradient ? (
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} />
      )}

      {loading ? (
        <ActivityIndicator color={config.text} />
      ) : (
        <Text style={[styles.text, { color: config.text }, textStyle]}>{label}</Text>
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
    overflow: 'hidden',
  },
  text: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
