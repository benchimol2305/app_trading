import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '../theme/colors';

/** Selector segmentado con píldora animada y gradiente. */
export default function Segmented({ options = [], value, onChange, style }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const anim = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: index, useNativeDriver: true, stiffness: 220, damping: 24 }).start();
  }, [index, anim]);

  const inner = 4;
  const itemWidth = width ? (width - inner * 2) / options.length : 0;
  const translateX = anim.interpolate({
    inputRange: [0, Math.max(1, options.length - 1)],
    outputRange: [0, Math.max(0, (options.length - 1) * itemWidth)],
  });

  return (
    <View style={[styles.wrap, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Animated.View
          style={[
            styles.pill,
            { width: itemWidth, transform: [{ translateX }] },
          ]}
        >
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pillGradient} />
        </Animated.View>
      ) : null}

      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={String(opt.value)} onPress={() => onChange && onChange(opt.value)} style={styles.item}>
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: radius.sm, overflow: 'hidden' },
  pillGradient: { flex: 1 },
  item: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  text: { color: colors.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 0.4 },
  textActive: { color: '#03140C' },
});
