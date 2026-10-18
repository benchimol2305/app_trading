import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import Chip from '../../components/Chip';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import FAB from '../../components/FAB';
import { api } from '../../api/client';
import { colors, gradients, spacing, radius, glow, type } from '../../theme/colors';
import { formatMoney, formatPct, formatDate, colorForResult } from '../../lib/format';

export default function TradesScreen({ navigation }) {
  const [trades, setTrades] = useState([]);
  const [result, setResult] = useState('all');
  const [direction, setDirection] = useState('all');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError('');
      try {
        const params = [];
        if (result !== 'all') params.push(`result=${result}`);
        if (direction !== 'all') params.push(`direction=${direction}`);
        if (symbol.trim()) params.push(`symbol=${encodeURIComponent(symbol.trim())}`);
        const query = params.length ? `?${params.join('&')}` : '';
        setTrades(await api.get(`/trades${query}`));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [result, direction, symbol]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totals = trades.reduce(
    (acc, t) => {
      if (t.status === 'CLOSED' && t.resultAmount !== null) {
        acc.pnl += Number(t.resultAmount);
        if (Number(t.resultAmount) > 0) acc.wins += 1;
        else if (Number(t.resultAmount) < 0) acc.losses += 1;
      }
      return acc;
    },
    { pnl: 0, wins: 0, losses: 0 }
  );

  return (
    <ScreenBackground>
      <View style={styles.filters}>
        <Input
          value={symbol}
          onChangeText={setSymbol}
          placeholder="Buscar activo: BTC, ETH, AAPL..."
          style={styles.search}
        />

        <View style={styles.chipRow}>
          {[
            { label: 'Todas', value: 'all' },
            { label: 'Ganadas', value: 'win' },
            { label: 'Perdidas', value: 'loss' },
          ].map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={result === opt.value} onPress={() => setResult(opt.value)} />
          ))}
          <View style={styles.chipSeparator} />
          {[
            { label: 'LONG', value: 'LONG', tone: 'success' },
            { label: 'SHORT', value: 'SHORT', tone: 'danger' },
          ].map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              tone={opt.tone}
              selected={direction === opt.value}
              onPress={() => setDirection(direction === opt.value ? 'all' : opt.value)}
            />
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {trades.length} operaciones · {totals.wins}G / {totals.losses}P
          </Text>
          <Text style={[styles.summaryPnl, { color: colorForResult(totals.pnl) }]}>{formatMoney(totals.pnl, true)}</Text>
        </View>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={<Feedback type="error" message={error} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Cargando operaciones...</Text>
          ) : (
            <EmptyState
              icon="swap-vertical-outline"
              title="No hay operaciones"
              message="Registra tu primera operación con el botón + y aparecerán aquí con su resultado."
            />
          )
        }
        renderItem={({ item }) => {
          const closed = item.status === 'CLOSED';
          const tone = colorForResult(item.resultAmount);
          const isShort = item.direction === 'SHORT';
          const accent = isShort ? colors.warning : colors.primary;

          return (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('TradeDetail', { id: item._id })}
              android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
            >
              <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={[styles.accent, { backgroundColor: accent }]} />

              <View style={styles.itemContent}>
                <View style={styles.itemTop}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.dirBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}66` }]}>
                      <Text style={[styles.dirText, { color: accent }]}>{item.direction}</Text>
                    </View>
                    <Text style={styles.symbol}>{item.symbol}</Text>
                    {!closed ? (
                      <View style={styles.openBadge}>
                        <Text style={styles.openText}>ABIERTA</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    {closed ? (
                      <>
                        <Text style={[styles.result, { color: tone }]}>{formatMoney(item.resultAmount, true)}</Text>
                        <Text style={[styles.resultPct, { color: tone }]}>{formatPct(item.resultPct)}</Text>
                      </>
                    ) : (
                      <Text style={styles.pending}>En curso</Text>
                    )}
                  </View>
                </View>

                <View style={styles.itemBottom}>
                  <Text style={styles.meta}>{formatDate(item.closedAt || item.openedAt)}</Text>
                  <Text style={styles.meta}>
                    {formatMoney(item.capital)}
                    {Number(item.leverage) > 1 ? ` · x${item.leverage}` : ''}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textDim} style={{ marginLeft: spacing.sm }} />
            </Pressable>
          );
        }}
      />

      <FAB onPress={() => navigation.navigate('TradeForm', {})} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  filters: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  search: { marginBottom: spacing.sm - 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chipSeparator: { width: spacing.sm },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  summaryText: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  summaryPnl: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  list: { paddingHorizontal: spacing.md, paddingBottom: 110 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    overflow: 'hidden',
    ...glow('#000000', 0.35, 14, 4),
  },
  accent: { width: 3, alignSelf: 'stretch' },
  itemContent: { flex: 1, padding: spacing.md },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  dirBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, marginRight: spacing.sm, borderWidth: 1 },
  dirText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.5 },
  symbol: { color: colors.text, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  openBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: `${colors.info}66`,
    backgroundColor: `${colors.info}18`,
  },
  openText: { color: colors.info, fontWeight: '800', fontSize: 9, letterSpacing: 0.6 },
  result: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  resultPct: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pending: { color: colors.info, fontWeight: '800', fontSize: 13 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm + 2 },
  meta: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
});
