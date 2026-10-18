import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Chip from '../../components/Chip';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, spacing, radius } from '../../theme/colors';
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
        const data = await api.get(`/trades${query}`);
        setTrades(data);
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
    <View style={styles.screen}>
      <View style={styles.filters}>
        <Input
          value={symbol}
          onChangeText={setSymbol}
          placeholder="Buscar por activo (BTC, ETH, AAPL...)"
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
          <Text style={styles.summaryText}>{trades.length} operaciones</Text>
          <Text style={[styles.summaryPnl, { color: colorForResult(totals.pnl) }]}>
            {formatMoney(totals.pnl, true)}
          </Text>
        </View>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={<Feedback type="error" message={error} />}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Cargando operaciones...</Text>
          ) : (
            <EmptyState
              icon="swap-vertical-outline"
              title="No hay operaciones"
              message="Registra tu primera operación con el botón + e irán apareciendo aquí."
            />
          )
        }
        renderItem={({ item }) => {
          const win = Number(item.resultAmount) > 0;
          const loss = Number(item.resultAmount) < 0;
          return (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('TradeDetail', { id: item._id })}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
            >
              <View style={styles.itemTop}>
                <View style={styles.itemLeft}>
                  <View style={[styles.dirBadge, { backgroundColor: item.direction === 'SHORT' ? colors.warning : colors.primary }]}>
                    <Text style={styles.dirText}>{item.direction}</Text>
                  </View>
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  {item.status === 'OPEN' ? (
                    <View style={styles.openBadge}>
                      <Text style={styles.openText}>ABIERTA</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  {item.status === 'OPEN' ? (
                    <Text style={styles.pending}>En curso</Text>
                  ) : (
                    <>
                      <Text style={[styles.result, { color: colorForResult(item.resultAmount) }]}>
                        {formatMoney(item.resultAmount, true)}
                      </Text>
                      <Text style={[styles.resultPct, { color: colorForResult(item.resultAmount) }]}>
                        {formatPct(item.resultPct)}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.itemBottom}>
                <Text style={styles.meta}>{formatDate(item.closedAt || item.openedAt)}</Text>
                <Text style={styles.meta}>
                  Capital {formatMoney(item.capital)}
                  {Number(item.leverage) > 1 ? ` · x${item.leverage}` : ''}
                  {win || loss ? '' : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('TradeForm', {})}>
        <Ionicons name="add" size={30} color="#052611" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: spacing.md, paddingTop: spacing.md, backgroundColor: colors.background },
  search: { marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  chipSeparator: { width: spacing.sm },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  summaryPnl: { fontSize: 16, fontWeight: '800' },
  list: { padding: spacing.md, paddingBottom: 96 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  dirBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: spacing.sm },
  dirText: { color: '#052611', fontWeight: '800', fontSize: 10 },
  symbol: { color: colors.text, fontWeight: '800', fontSize: 16 },
  openBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.info,
  },
  openText: { color: colors.info, fontWeight: '700', fontSize: 10 },
  result: { fontSize: 16, fontWeight: '800' },
  resultPct: { fontSize: 12, fontWeight: '700' },
  pending: { color: colors.info, fontWeight: '700', fontSize: 13 },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 12 },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
