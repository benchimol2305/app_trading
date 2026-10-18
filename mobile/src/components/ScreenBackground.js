import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';

/**
 * Fondo profundo con orbes de luz difusa (estética futurista).
 * Se coloca como capa absoluta detrás del contenido de cada pantalla.
 */
export default function ScreenBackground({ children }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />

      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />
      <View style={[styles.orb, styles.orbViolet]} />

      <View style={styles.grid} pointerEvents="none" />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.5,
  },
  orbTop: {
    width: 320,
    height: 320,
    top: -120,
    right: -90,
    backgroundColor: 'rgba(45,224,138,0.22)',
  },
  orbBottom: {
    width: 280,
    height: 280,
    bottom: -110,
    left: -100,
    backgroundColor: 'rgba(34,211,238,0.16)',
  },
  orbViolet: {
    width: 220,
    height: 220,
    top: 220,
    left: -120,
    backgroundColor: 'rgba(139,92,246,0.14)',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'transparent',
  },
});
