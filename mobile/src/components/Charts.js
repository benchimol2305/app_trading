import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, radius, spacing } from '../theme/colors';
import { formatShortDate } from '../lib/format';

const PAD = 10;

/** Curva de capital: línea con área degradada. */
export function EquityChart({ data = [], height = 170, showLabels = true }) {
  const [width, setWidth] = useState(0);
  const points = data.filter((d) => Number.isFinite(Number(d.equity)));

  if (!points.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sin datos todavía</Text>
      </View>
    );
  }

  const values = points.map((p) => Number(p.equity));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(1, Math.abs(max) * 0.1);
  const lo = min - span * 0.12;
  const hi = max + span * 0.12;
  const innerH = height - PAD * 2;
  const innerW = Math.max(1, width - PAD * 2);

  const x = (i) => PAD + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD + innerH - ((v - lo) / (hi - lo)) * innerH;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(Number(p.equity)).toFixed(2)}`).join(' ');
  const area = `${line} L ${x(points.length - 1).toFixed(2)} ${height - PAD} L ${x(0).toFixed(2)} ${height - PAD} Z`;

  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? colors.primary : colors.danger;

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
                <Stop offset="1" stopColor={stroke} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <Line
                key={t}
                x1={PAD}
                y1={PAD + innerH * t}
                x2={PAD + innerW}
                y2={PAD + innerH * t}
                stroke={colors.border}
                strokeWidth="1"
              />
            ))}

            <Path d={area} fill="url(#equityFill)" />
            <Path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
            <Circle cx={x(points.length - 1)} cy={y(values[values.length - 1])} r="4" fill={stroke} />
          </Svg>
        ) : null}
      </View>

      {showLabels ? (
        <View style={styles.axis}>
          <Text style={styles.axisText}>{formatShortDate(points[0].date)}</Text>
          <Text style={styles.axisText}>{formatShortDate(points[points.length - 1].date)}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Barras de ganancia/pérdida por período. */
export function PnlBars({ data = [], height = 170 }) {
  const [width, setWidth] = useState(0);
  const points = data.filter((d) => Number.isFinite(Number(d.pnl)));

  if (!points.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Sin datos todavía</Text>
      </View>
    );
  }

  const values = points.map((p) => Number(p.pnl));
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const innerH = height - PAD * 2;
  const innerW = Math.max(1, width - PAD * 2);
  const step = innerW / points.length;
  const barW = Math.max(3, Math.min(28, step * 0.62));

  const y = (v) => PAD + innerH - ((v - min) / span) * innerH;
  const zeroY = y(0);

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Line x1={PAD} y1={zeroY} x2={PAD + innerW} y2={zeroY} stroke={colors.border} strokeWidth="1.5" />
            {points.map((p, i) => {
              const value = Number(p.pnl);
              const cx = PAD + step * i + step / 2;
              const top = value >= 0 ? y(value) : zeroY;
              const h = Math.max(2, Math.abs(zeroY - y(value)));
              return (
                <Rect
                  key={`${p.period}-${i}`}
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={h}
                  rx="3"
                  fill={value >= 0 ? colors.primary : colors.danger}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisText}>{points[0].period}</Text>
        <Text style={styles.axisText}>{points[points.length - 1].period}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  axisText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
});
