import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, type } from '../theme/colors';

/**
 * Tarjeta de vidrio (glassmorphism):
 * gradiente translúcido + borde luminoso + brillo superior.
 */
export default function GlassCard({ title, subtitle, action, children, contentStyle, style, tone = 'neutral' }) {
  const toneGradient =
    tone === 'positive' ? gradients.successCard : tone === 'negative' ? gradients.dangerCard : gradients.card;

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient colors={toneGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View style={styles.padding}>
        {title || action ? (
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {action}
          </View>
        ) : null}
        <View style={contentStyle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  padding: { padding: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...type.micro, color: colors.textMuted },
  subtitle: { color: colors.textDim, fontSize: 11, marginTop: 4 },
});
