import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import Segmented from '../../components/Segmented';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import Button from '../../components/Button';
import { EquityChart, PnlBars } from '../../components/Charts';
import { api } from '../../api/client';
import { colors, spacing } from '../../theme/colors';
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
      const data = await api.get(`/stats/pnl?groupBy=${group}`);
      setSeries(data);
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
  const hasData = Boolean(summary) && (trades.total > 0 || capital.net !== 0);

  if (loading && !summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Cargando resumen...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />
      }
    >
      <Feedback type="error" message={error} />

      <Card>
        <Text style={styles.label}>CAPITAL ACTUAL</Text>
        <Text style={styles.equity}>{formatMoney(capital.equity)}</Text>

        <View style={styles.pnlRow}>
          <Ionicons
            name={pnl >= 0 ? 'trending-up' : 'trending-down'}
            size={20}
            color={colorForResult(pnl)}
          />
          <Text style={[styles.pnl, { color: colorForResult(pnl) }]}>
            {formatMoney(pnl, true)} ({formatPct(summary?.pnl?.totalPct)})
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.smallLabel}>Aportado</Text>
            <Text style={styles.smallValue}>{formatMoney(capital.deposited)}</Text>
          </View>
          <View>
            <Text style={styles.smallLabel}>Retirado</Text>
            <Text style={styles.smallValue}>{formatMoney(capital.withdrawn)}</Text>
          </View>
          <View>
            <Text style={styles.smallLabel}>Capital neto</Text>
            <Text style={styles.smallValue}>{formatMoney(capital.net)}</Text>
          </View>
          <View>
            <Text style={styles.smallLabel}>Abiertas</Text>
            <Text style={styles.smallValue}>{capital.openPositions ?? 0}</Text>
          </View>
        </View>
      </Card>

      {!hasData ? (
        <>
          <EmptyState
            icon="wallet-outline"
            title="Empieza registrando tu capital"
            message="Agrega un aporte y luego registra tus operaciones para ver gráficos y rentabilidad."
          />
          <Button title="Registrar aporte" onPress={() => navigation.navigate('DepositForm')} />
        </>
      ) : (
        <>
          <View style={styles.row}>
            <StatCard label="Aciertos" value={`${trades.winRate ?? 0}%`} hint={`${trades.wins}/${trades.closed} ganadas`} tone={(trades.winRate ?? 0) >= 50 ? 'positive' : 'neutral'} />
            <View style={{ width: spacing.sm + 4 }} />
            <StatCard
              label="Profit factor"
              value={summary.profitFactor === null ? '∞' : summary.profitFactor}
              hint={`Ganado ${formatMoney(summary.pnl.grossProfit)}`}
              tone={(summary.profitFactor ?? 0) >= 1 || summary.profitFactor === null ? 'positive' : 'negative'}
            />
          </View>

          <View style={[styles.row, { marginTop: spacing.sm + 4 }]}>
            <StatCard label="Ganancia media" value={formatMoney(averages.win)} tone="positive" hint="Por operación ganada" />
            <View style={{ width: spacing.sm + 4 }} />
            <StatCard label="Pérdida media" value={formatMoney(-Math.abs(averages.loss))} tone="negative" hint="Por operación perdida" />
          </View>

          <Card title="Curva de capital" style={{ marginTop: spacing.md }}>
            <EquityChart data={equity} />
          </Card>

          <Card
            title="Ganancia / pérdida"
            action={
              <Segmented
                style={{ width: 210 }}
                value={groupBy}
                onChange={setGroupBy}
                options={[
                  { label: 'Día', value: 'day' },
                  { label: 'Semana', value: 'week' },
                  { label: 'Mes', value: 'month' },
                ]}
              />
            }
          >
            <PnlBars data={series} />
            {(series.length > 0) && (
              <View style={[styles.rowBetween, { marginTop: spacing.md }]}>
                <View>
                  <Text style={styles.smallLabel}>Mejor período</Text>
                  <Text style={[styles.smallValue, { color: colors.success }]}>
                    {formatMoney(Math.max(...series.map((s) => s.pnl)), true)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.smallLabel}>Peor período</Text>
                  <Text style={[styles.smallValue, { color: colors.danger }]}>
                    {formatMoney(Math.min(...series.map((s) => s.pnl)), true)}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          <Card title="Long vs Short">
            {[
              { key: 'long', label: 'LONG', color: colors.primary, data: summary.long },
              { key: 'short', label: 'SHORT', color: colors.warning, data: summary.short },
            ].map(({ key, label, color, data }) => (
              <View key={key} style={styles.directionRow}>
                <View style={[styles.badge, { backgroundColor: color }]}>
                  <Text style={styles.badgeText}>{label}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={[styles.smallValue, { color: colorForResult(data.pnl) }]}>
                    {formatMoney(data.pnl, true)} ({formatPct(data.pnlPct)})
                  </Text>
                  <Text style={styles.smallLabel}>
                    {data.trades} operaciones · {data.winRate}% aciertos
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {summary.best && summary.worst ? (
            <Card title="Mejor y peor operación">
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

          <Button
            title="Nueva operación"
            onPress={() => navigation.navigate('TradeForm', {})}
            style={{ marginTop: spacing.xs }}
          />
        </>
      )}

      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  muted: { color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  equity: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: 4 },
  pnlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pnl: { fontSize: 17, fontWeight: '700', marginLeft: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  row: { flexDirection: 'row', marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  smallValue: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 },
  tiny: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  directionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 6, borderRadius: 8, minWidth: 66, alignItems: 'center' },
  badgeText: { color: '#052611', fontWeight: '800', fontSize: 12 },
});
