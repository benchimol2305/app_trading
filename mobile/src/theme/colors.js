/**
 * Sistema de diseño "Mi Trading"
 * Estética: futurista, glassmorphism sobre fondo profundo, acentos neón.
 */

export const colors = {
  background: '#05080F',
  backgroundAlt: '#0A1120',

  surface: 'rgba(255,255,255,0.045)',
  surfaceSolid: '#0E1526',
  surfaceElevated: '#141C31',

  border: 'rgba(255,255,255,0.075)',
  borderStrong: 'rgba(255,255,255,0.16)',

  text: '#EAF2FF',
  textMuted: '#7C90B0',
  textDim: '#4C5D78',

  primary: '#2DE08A',
  primaryDark: '#10B981',
  primarySoft: 'rgba(45,224,138,0.12)',

  cyan: '#22D3EE',
  violet: '#8B5CF6',
  warning: '#FBBF24',
  info: '#38BDF8',

  danger: '#F43F5E',
  dangerSoft: 'rgba(244,63,94,0.14)',

  success: '#2DE08A',
  successSoft: 'rgba(45,224,138,0.14)',

  white: '#FFFFFF',
};

/** Gradientes reutilizables (usar con <LinearGradient colors={...}>) */
export const gradients = {
  positive: ['#5EEAD4', '#2DE08A', '#10B981'],
  negative: ['#FDA4AF', '#F43F5E', '#BE123C'],
  primary: ['#2DE08A', '#22D3EE'],
  violet: ['#A78BFA', '#6366F1'],
  card: ['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.02)'],
  hero: ['rgba(45,224,138,0.16)', 'rgba(34,211,238,0.07)', 'rgba(255,255,255,0.015)'],
  dangerCard: ['rgba(244,63,94,0.18)', 'rgba(244,63,94,0.03)'],
  successCard: ['rgba(45,224,138,0.18)', 'rgba(45,224,138,0.03)'],
  screen: ['#070C17', '#05080F', '#04060B'],
  tabBar: ['rgba(10,17,32,0.96)', 'rgba(6,10,20,0.92)'],
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 10, md: 16, lg: 22, xl: 28, round: 999 };

/** Sombra con brillo de color (iOS) + elevación (Android) */
export function glow(color, opacity = 0.4, radius = 20, elevation = 8) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 8 },
    elevation,
  };
}

export const type = {
  micro: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  body: { fontSize: 14 },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  hero: { fontSize: 40, fontWeight: '800', letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  metric: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
};
