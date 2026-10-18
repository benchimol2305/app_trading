import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Card from '../../components/Card';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, spacing } from '../../theme/colors';
import { formatMoney, formatPct, formatDate, formatPrice, colorForResult } from '../../lib/format';

function Row({ label, value, valueStyle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function TradeDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await api.get(`/trades/${id}`);
      setTrade(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = () => {
    Alert.alert('Eliminar operación', `¿Seguro que quieres eliminar ${trade?.symbol}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/trades/${id}`);
            navigation.goBack();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  if (loading && !trade) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Cargando...</Text>
      </View>
    );
  }

  if (!trade) {
    return (
      <View style={styles.center}>
        <Feedback type="error" message={error || 'Operación no encontrada'} />
      </View>
    );
  }

  const resultColor = colorForResult(trade.resultAmount);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Feedback type="error" message={error} />

      <Card>
        <View style={styles.header}>
          <View style={[styles.dirBadge, { backgroundColor: trade.direction === 'SHORT' ? colors.warning : colors.primary }]}>
            <Text style={styles.dirText}>{trade.direction}</Text>
          </View>
          <Text style={styles.symbol}>{trade.symbol}</Text>
          {trade.status === 'OPEN' ? (
            <View style={styles.openBadge}>
              <Text style={styles.openText}>ABIERTA</Text>
            </View>
          ) : null}
        </View>

        {trade.status === 'OPEN' ? (
          <Text style={[styles.result, { color: colors.info }]}>Operación en curso</Text>
        ) : (
          <>
            <Text style={[styles.result, { color: resultColor }]}>{formatMoney(trade.resultAmount, true)}</Text>
            <Text style={[styles.resultPct, { color: resultColor }]}>{formatPct(trade.resultPct)} sobre tu capital</Text>
          </>
        )}
      </Card>

      <Card title="Datos de la operación">
        <Row label="Capital invertido" value={formatMoney(trade.capital)} />
        <Row label="Apalancamiento" value={`x${trade.leverage}`} />
        <Row label="Precio de entrada" value={formatPrice(trade.entryPrice)} />
        <Row label="Precio de salida" value={formatPrice(trade.exitPrice)} />
        <Row label="Comisiones" value={formatMoney(trade.fees)} />
        <Row label="Fecha de entrada" value={formatDate(trade.openedAt, true)} />
        {trade.closedAt ? <Row label="Fecha de salida" value={formatDate(trade.closedAt, true)} /> : null}
      </Card>

      {trade.strategy || trade.notes ? (
        <Card title="Notas">
          {trade.strategy ? <Row label="Estrategia" value={trade.strategy} /> : null}
          {trade.notes ? <Text style={styles.notes}>{trade.notes}</Text> : null}
        </Card>
      ) : null}

      <Button title="Editar operación" variant="ghost" onPress={() => navigation.navigate('TradeForm', { trade })} />
      <View style={{ height: spacing.sm }} />
      <Button title="Eliminar operación" variant="danger" onPress={confirmDelete} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.md },
  muted: { color: colors.textMuted },
  header: { flexDirection: 'row', alignItems: 'center' },
  dirBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: spacing.sm },
  dirText: { color: '#052611', fontWeight: '800', fontSize: 11 },
  symbol: { color: colors.text, fontWeight: '800', fontSize: 20 },
  openBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.info,
  },
  openText: { color: colors.info, fontWeight: '700', fontSize: 10 },
  result: { fontSize: 30, fontWeight: '800', marginTop: spacing.sm },
  resultPct: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  notes: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
});
