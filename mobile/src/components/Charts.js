import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, spacing } from '../theme/colors';
import { formatShortDate } from '../lib/format';

const PAD = 12;

function buildPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

/** Curva de capital (área con gradiente + última posición resaltada). */
export function EquityChart({ data = [], height = 180 }) {
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
  const lo = min - span * 0.14;
  const hi = max + span * 0.14;
  const innerH = height - PAD * 2;
  const innerW = Math.max(1, width - PAD * 2);

  const coords = points.map((p, i) => ({
    x: PAD + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
    y: PAD + innerH - ((Number(p.equity) - lo) / (hi - lo)) * innerH,
  }));

  const line = buildPath(coords);
  const area = `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${height - PAD} L ${coords[0].x.toFixed(2)} ${height - PAD} Z`;
  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? colors.primary : colors.danger;

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <SvgGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity="0.42" />
                <Stop offset="1" stopColor={stroke} stopOpacity="0.02" />
              </SvgGradient>
            </Defs>

            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <Line
                key={t}
                x1={PAD}
                y1={PAD + innerH * t}
                x2={PAD + innerW}
                y2={PAD + innerH * t}
                stroke="rgba(255,255,255,0.055)"
                strokeWidth="1"
                strokeDasharray="2 7"
              />
            ))}

            <Path d={area} fill="url(#equityFill)" />
            <Path d={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

            <Circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="9" fill={`${stroke}22`} />
            <Circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="4.5" fill={stroke} />
          </Svg>
        ) : null}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisText}>{formatShortDate(points[0].date)}</Text>
        <Text style={styles.axisText}>{formatShortDate(points[points.length - 1].date)}</Text>
      </View>
    </View>
  );
}

/** Mini gráfico para la tarjeta principal. */
export function Sparkline({ data = [], height = 54, color }) {
  const [width, setWidth] = useState(0);
  const values = data.map((d) => Number(d.equity)).filter(Number.isFinite);

  if (values.length < 2) return <View style={{ height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stroke = color || (values[values.length - 1] >= values[0] ? colors.primary : colors.danger);

  const coords = values.map((v, i) => ({
    x: (i / (values.length - 1)) * Math.max(1, width - 4) + 2,
    y: height - 4 - ((v - min) / span) * (height - 8),
  }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0.35" />
              <Stop offset="1" stopColor={stroke} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Path
            d={`${buildPath(coords)} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`}
            fill="url(#sparkFill)"
          />
          <Path d={buildPath(coords)} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}

/** Barras de P&L por período (positivas/negativas). */
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
  const barW = Math.max(4, Math.min(26, step * 0.6));

  const y = (v) => PAD + innerH - ((v - min) / span) * innerH;
  const zeroY = y(0);

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              {points.map((p, i) => (
                <SvgGradient key={i} id={`barPos${i}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#5EEAD4" />
                  <Stop offset="1" stopColor="#10B981" />
                </SvgGradient>
              ))}
              {points.map((p, i) => (
                <SvgGradient key={`n${i}`} id={`barNeg${i}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#FDA4AF" />
                  <Stop offset="1" stopColor="#BE123C" />
                </SvgGradient>
              ))}
            </Defs>

            <Line x1={PAD} y1={zeroY} x2={PAD + innerW} y2={zeroY} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

            {points.map((p, i) => {
              const value = Number(p.pnl);
              const cx = PAD + step * i + step / 2;
              const top = value >= 0 ? y(value) : zeroY;
              const h = Math.max(3, Math.abs(zeroY - y(value)));
              return (
                <Rect
                  key={`${p.period}-${i}`}
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={h}
                  rx={4}
                  fill={value >= 0 ? `url(#barPos${i})` : `url(#barNeg${i})`}
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
  axisText: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
