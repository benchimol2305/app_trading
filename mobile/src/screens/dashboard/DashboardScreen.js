import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import Segmented from '../../components/Segmented';
import Donut from '../../components/Donut';
import SplitBar from '../../components/SplitBar';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import Button from '../../components/Button';
import HeroCapitalCard from '../../components/HeroCapitalCard';
import { EquityChart, PnlBars } from '../../components/Charts';
import { api } from '../../api/client';
import { colors, spacing, radius, type } from '../../theme/colors';
import { formatMoney, formatPct, formatDate, colorForResult } from '../../lib/format';

export default function DashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [equity, setEquity] = useState([]);
  const [series, setSeries] = useState([]);
  const [groupBy, setGroupBy] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const [sum, eq] = await Promise.all([api.get('/stats/summary'), api.get('/stats/equity')]);
      setSummary(sum);
      setEquity(eq);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadSeries = useCallback(async (group) => {
    try {
      setSeries(await api.get(`/stats/pnl?groupBy=${group}`));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    loadSeries(groupBy);
  }, [groupBy, loadSeries]);

  const pnl = summary?.pnl?.total ?? 0;
  const capital = summary?.capital ?? {};
  const trades = summary?.trades ?? {};
  const averages = summary?.averages ?? {};
  const long = summary?.long ?? { trades: 0, pnl: 0, pnlPct: 0, winRate: 0 };
  const short = summary?.short ?? { trades: 0, pnl: 0, pnlPct: 0, winRate: 0 };
  const hasData = Boolean(summary) && (trades.total > 0 || capital.net !== 0);

  if (loading && !summary) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <Text style={styles.muted}>Cargando resumen...</Text>
        </View>
      </ScreenBackground>
    );
  }

  const longShare = long.trades + short.trades > 0 ? (long.trades / (long.trades + short.trades)) * 100 : 50;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
              loadSeries(groupBy);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Feedback type="error" message={error} />

        <HeroCapitalCard
          equity={capital.equity}
          pnl={pnl}
          pnlPct={summary?.pnl?.totalPct}
          equitySeries={equity}
          stats={[
            { label: 'Aportado', value: formatMoney(capital.deposited) },
            { label: 'Retirado', value: formatMoney(capital.withdrawn) },
            { label: 'Neto', value: formatMoney(capital.net) },
            { label: 'Abiertas', value: capital.openPositions ?? 0 },
          ]}
        />

        {!hasData ? (
          <>
            <EmptyState
              icon="wallet-outline"
              title="Empieza registrando tu capital"
              message="Agrega un aporte y registra tus operaciones para ver gráficos, rentabilidad y estadísticas."
            />
            <Button title="Registrar aporte" onPress={() => navigation.navigate('DepositForm', {})} />
          </>
        ) : (
          <>
            <View style={styles.row}>
              <MetricCard
                icon="trophy-outline"
                label="Aciertos"
                value={`${trades.winRate ?? 0}%`}
                hint={`${trades.wins}/${trades.closed}`}
                tone={(trades.winRate ?? 0) >= 50 ? 'positive' : 'neutral'}
              />
              <View style={styles.gap} />
              <MetricCard
                icon="flash-outline"
                label="Profit factor"
                value={summary.profitFactor === null ? '∞' : summary.profitFactor}
                hint={`+${formatMoney(summary.pnl.grossProfit)}`}
                tone={(summary.profitFactor ?? 0) >= 1 || summary.profitFactor === null ? 'positive' : 'negative'}
              />
            </View>

            <View style={[styles.row, styles.rowSpaced]}>
              <MetricCard
                icon="arrow-up-outline"
                label="Ganancia media"
                value={formatMoney(averages.win)}
                hint="por operación"
                tone="positive"
              />
              <View style={styles.gap} />
              <MetricCard
                icon="arrow-down-outline"
                label="Pérdida media"
                value={formatMoney(-Math.abs(averages.loss))}
                hint="por operación"
                tone="negative"
              />
            </View>

            <View style={{ height: spacing.md }} />

            <Card title="Curva de capital" subtitle="Evolución de tu capital aportado + resultados">
              <EquityChart data={equity} />
            </Card>

            <Card
              title="Rendimiento"
              action={
                <Segmented
                  style={{ width: 200 }}
                  value={groupBy}
                  onChange={setGroupBy}
                  options={[
                    { label: 'Día', value: 'day' },
                    { label: 'Sem', value: 'week' },
                    { label: 'Mes', value: 'month' },
                  ]}
                />
              }
            >
              <PnlBars data={series} />
              {series.length > 0 ? (
                <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
                  <View>
                    <Text style={styles.smallLabel}>Mejor período</Text>
                    <Text style={[styles.smallValue, { color: colors.success }]}>
                      {formatMoney(Math.max(...series.map((s) => s.pnl)), true)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.smallLabel}>Períodos</Text>
                    <Text style={styles.smallValue}>{series.length}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.smallLabel}>Peor período</Text>
                    <Text style={[styles.smallValue, { color: colors.danger }]}>
                      {formatMoney(Math.min(...series.map((s) => s.pnl)), true)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </Card>

            <Card title="Distribución" subtitle="Aciertos y balance LONG / SHORT">
              <View style={styles.donutRow}>
                <Donut progress={trades.winRate ?? 0} label="aciertos" color={colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendLabel}>Ganadas</Text>
                    <Text style={styles.legendValue}>{trades.wins}</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                    <Text style={styles.legendLabel}>Perdidas</Text>
                    <Text style={styles.legendValue}>{trades.losses}</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: colors.textDim }]} />
                    <Text style={styles.legendLabel}>Sin cambio</Text>
                    <Text style={styles.legendValue}>{trades.breakeven}</Text>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: spacing.md }}>
                <SplitBar left={longShare} leftColor={colors.primary} rightColor={colors.warning} />
                <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
                  <Text style={styles.legendLabel}>
                    LONG {long.trades} · {formatPct(long.pnlPct)}
                  </Text>
                  <Text style={styles.legendLabel}>
                    SHORT {short.trades} · {formatPct(short.pnlPct)}
                  </Text>
                </View>

                <View style={styles.directionGrid}>
                  {[
                    { label: 'LONG', data: long, color: colors.primary },
                    { label: 'SHORT', data: short, color: colors.warning },
                  ].map(({ label, data, color }) => (
                    <View key={label} style={[styles.directionCard, { borderColor: `${color}44` }]}>
                      <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                        <Text style={[styles.badgeText, { color }]}>{label}</Text>
                      </View>
                      <Text style={[styles.directionPnl, { color: colorForResult(data.pnl) }]}>
                        {formatMoney(data.pnl, true)}
                      </Text>
                      <Text style={styles.smallLabel}>
                        {data.trades} ops · {data.winRate}% aciertos
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>

            {summary.best && summary.worst ? (
              <Card title="Extremos" subtitle="Tu mejor y peor operación">
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.smallLabel}>Mejor · {summary.best.symbol}</Text>
                    <Text style={[styles.smallValue, { color: colors.success }]}>
                      {formatMoney(summary.best.amount, true)} ({formatPct(summary.best.pct)})
                    </Text>
                    <Text style={styles.tiny}>{formatDate(summary.best.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.smallLabel}>Peor · {summary.worst.symbol}</Text>
                    <Text style={[styles.smallValue, { color: colors.danger }]}>
                      {formatMoney(summary.worst.amount, true)} ({formatPct(summary.worst.pct)})
                    </Text>
                    <Text style={styles.tiny}>{formatDate(summary.worst.date)}</Text>
                  </View>
                </View>
              </Card>
            ) : null}

            <Button title="Nueva operación" onPress={() => navigation.navigate('TradeForm', {})} />
          </>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  row: { flexDirection: 'row' },
  rowSpaced: { marginTop: spacing.sm + 4 },
  gap: { width: spacing.sm + 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { ...type.micro, color: colors.textMuted },
  smallValue: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  tiny: { color: colors.textDim, fontSize: 11, marginTop: 3 },
  donutRow: { flexDirection: 'row', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  legendLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
  legendValue: { color: colors.text, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  directionGrid: { flexDirection: 'row', marginTop: spacing.md },
  directionCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginRight: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  directionPnl: { fontSize: 17, fontWeight: '800', marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
});
