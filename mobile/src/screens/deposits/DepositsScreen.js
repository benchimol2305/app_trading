import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, spacing, radius } from '../../theme/colors';
import { formatMoney, formatDate } from '../../lib/format';

export default function DepositsScreen({ navigation }) {
  const [deposits, setDeposits] = useState([]);
  const [totals, setTotals] = useState({ deposited: 0, withdrawn: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const response = await api.getRaw('/deposits');
      setDeposits(response?.data || []);
      if (response?.totals) setTotals(response.totals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (item) => {
    Alert.alert('Eliminar movimiento', `¿Eliminar ${item.kind === 'WITHDRAWAL' ? 'retiro' : 'aporte'} de ${formatMoney(item.amount)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/deposits/${item._id}`);
            load(true);
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  const summary = totals || {
    deposited: deposits.filter((d) => d.kind !== 'WITHDRAWAL').reduce((a, d) => a + d.amount, 0),
    withdrawn: deposits.filter((d) => d.kind === 'WITHDRAWAL').reduce((a, d) => a + d.amount, 0),
    net: 0,
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={deposits}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <Feedback type="error" message={error} />
            <Card title="Resumen de capital">
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.label}>Aportado</Text>
                  <Text style={[styles.value, { color: colors.success }]}>{formatMoney(summary.deposited)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Retirado</Text>
                  <Text style={[styles.value, { color: colors.danger }]}>{formatMoney(summary.withdrawn)}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Capital neto</Text>
                  <Text style={styles.value}>{formatMoney(summary.net)}</Text>
                </View>
              </View>
            </Card>
            <Text style={styles.sectionTitle}>Movimientos</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.loading}>Cargando movimientos...</Text>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="Sin aportes registrados"
              message="Registra el dinero que metes o sacas de tu cuenta para que la rentabilidad sea exacta."
            />
          )
        }
        renderItem={({ item }) => {
          const isWithdrawal = item.kind === 'WITHDRAWAL';
          return (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('DepositForm', { deposit: item })}
              onLongPress={() => confirmDelete(item)}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={isWithdrawal ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                  size={26}
                  color={isWithdrawal ? colors.danger : colors.success}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.itemTitle}>{isWithdrawal ? 'Retiro' : 'Aporte'}</Text>
                <Text style={styles.meta}>
                  {formatDate(item.depositedAt)}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <Text style={[styles.amount, { color: isWithdrawal ? colors.danger : colors.success }]}>
                {isWithdrawal ? '-' : '+'}
                {formatMoney(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('DepositForm', {})}>
        <Ionicons name="add" size={30} color="#052611" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: 96 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  value: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.sm },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  iconWrap: { width: 34, alignItems: 'center' },
  itemTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800' },
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
