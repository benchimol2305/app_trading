import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, gradients, spacing, radius, type, glow } from '../../theme/colors';
import { formatMoney, formatPct, formatDate, formatPrice, colorForResult } from '../../lib/format';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
      setTrade(await api.get(`/trades/${id}`));
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
      <ScreenBackground>
        <View style={styles.center}>
          <Text style={styles.muted}>Cargando...</Text>
        </View>
      </ScreenBackground>
    );
  }

  if (!trade) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <Feedback type="error" message={error || 'Operación no encontrada'} />
        </View>
      </ScreenBackground>
    );
  }

  const closed = trade.status === 'CLOSED';
  const tone = closed ? colorForResult(trade.resultAmount) : colors.info;
  const accent = trade.direction === 'SHORT' ? colors.warning : colors.primary;
  const heroGradient = !closed ? gradients.card : trade.resultAmount >= 0 ? gradients.successCard : gradients.dangerCard;

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Feedback type="error" message={error} />

        <View style={[styles.hero, glow(tone, 0.25, 24, 8)]}>
          <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

          <View style={styles.heroTop}>
            <View style={[styles.dirBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}66` }]}>
              <Text style={[styles.dirText, { color: accent }]}>{trade.direction}</Text>
            </View>
            <Text style={styles.symbol}>{trade.symbol}</Text>
            {!closed ? (
              <View style={styles.openBadge}>
                <Text style={styles.openText}>ABIERTA</Text>
              </View>
            ) : null}
          </View>

          {closed ? (
            <>
              <Text style={[styles.result, { color: tone }]}>{formatMoney(trade.resultAmount, true)}</Text>
              <Text style={[styles.resultPct, { color: tone }]}>{formatPct(trade.resultPct)} sobre tu capital</Text>
            </>
          ) : (
            <Text style={[styles.result, { color: colors.info, fontSize: 22 }]}>Operación en curso</Text>
          )}
        </View>

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
            {trade.strategy ? (
              <View style={styles.strategyPill}>
                <Ionicons name="bookmark-outline" size={12} color={colors.primary} />
                <Text style={styles.strategyText}>{trade.strategy}</Text>
              </View>
            ) : null}
            {trade.notes ? <Text style={styles.notes}>{trade.notes}</Text> : null}
          </Card>
        ) : null}

        <Button title="Editar operación" variant="ghost" onPress={() => navigation.navigate('TradeForm', { trade })} />
        <View style={{ height: spacing.sm }} />
        <Button title="Eliminar operación" variant="danger" onPress={confirmDelete} />
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  muted: { color: colors.textMuted },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  dirBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, marginRight: spacing.sm, borderWidth: 1 },
  dirText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  symbol: { color: colors.text, fontWeight: '800', fontSize: 20, letterSpacing: 0.3, flex: 1 },
  openBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: `${colors.info}66`, backgroundColor: `${colors.info}18` },
  openText: { color: colors.info, fontWeight: '800', fontSize: 9, letterSpacing: 0.6 },
  result: { ...type.hero, marginTop: spacing.sm },
  resultPct: { fontSize: 13, fontWeight: '700', marginTop: 2, opacity: 0.9 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  strategyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(45,224,138,0.3)',
    marginBottom: spacing.sm,
  },
  strategyText: { color: colors.primary, fontSize: 11, fontWeight: '800', marginLeft: 5, letterSpacing: 0.3 },
  notes: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: 4 },
});
