import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import EmptyState from '../../components/EmptyState';
import Feedback from '../../components/Feedback';
import FAB from '../../components/FAB';
import { api } from '../../api/client';
import { colors, gradients, spacing, radius, glow, type } from '../../theme/colors';
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
    Alert.alert(
      'Eliminar movimiento',
      `¿Eliminar ${item.kind === 'WITHDRAWAL' ? 'retiro' : 'aporte'} de ${formatMoney(item.amount)}?`,
      [
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
      ]
    );
  };

  return (
    <ScreenBackground>
      <FlatList
        data={deposits}
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
        ListHeaderComponent={
          <View>
            <Feedback type="error" message={error} />

            <View style={[styles.hero, glow(colors.primary, 0.22, 22, 8)]}>
              <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Text style={styles.heroLabel}>Capital neto aportado</Text>
              <Text style={styles.heroValue}>{formatMoney(totals.net)}</Text>

              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Ionicons name="arrow-down-circle-outline" size={16} color={colors.success} />
                  <Text style={styles.heroStatLabel}>Aportado</Text>
                  <Text style={[styles.heroStatValue, { color: colors.success }]}>{formatMoney(totals.deposited)}</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Ionicons name="arrow-up-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.heroStatLabel}>Retirado</Text>
                  <Text style={[styles.heroStatValue, { color: colors.danger }]}>{formatMoney(totals.withdrawn)}</Text>
                </View>
              </View>
            </View>

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
          const accent = isWithdrawal ? colors.danger : colors.success;

          return (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('DepositForm', { deposit: item })}
              onLongPress={() => confirmDelete(item)}
              android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
            >
              <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

              <View style={[styles.iconWrap, { backgroundColor: `${accent}1E`, borderColor: `${accent}55` }]}>
                <Ionicons name={isWithdrawal ? 'arrow-up' : 'arrow-down'} size={16} color={accent} />
              </View>

              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.itemTitle}>{isWithdrawal ? 'Retiro' : 'Aporte'}</Text>
                <Text style={styles.meta}>
                  {formatDate(item.depositedAt)}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>

              <Text style={[styles.amount, { color: accent }]}>
                {isWithdrawal ? '-' : '+'}
                {formatMoney(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />

      <FAB onPress={() => navigation.navigate('DepositForm', {})} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: 110 },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroLabel: { ...type.micro, color: colors.textMuted },
  heroValue: { ...type.hero, fontSize: 32, color: colors.text, marginTop: spacing.sm },
  heroRow: { flexDirection: 'row', marginTop: spacing.md, alignItems: 'center' },
  heroStat: { flex: 1 },
  heroStatDivider: { width: 1, height: 34, backgroundColor: colors.border, marginHorizontal: spacing.md },
  heroStatLabel: { ...type.micro, color: colors.textDim, marginTop: 4 },
  heroStatValue: { fontSize: 14, fontWeight: '800', marginTop: 3, fontVariant: ['tabular-nums'] },
  sectionTitle: { ...type.micro, color: colors.textMuted, marginBottom: spacing.sm + 2 },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    overflow: 'hidden',
    ...glow('#000000', 0.35, 14, 4),
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 11, marginTop: 3, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
