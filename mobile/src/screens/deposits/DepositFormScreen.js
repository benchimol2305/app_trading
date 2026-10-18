import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';

import Input from '../../components/Input';
import Chip from '../../components/Chip';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, spacing } from '../../theme/colors';
import { parseNumber } from '../../lib/format';

function toDateInput(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function DepositFormScreen({ navigation, route }) {
  const editing = route?.params?.deposit || null;

  const [kind, setKind] = useState(editing?.kind || 'DEPOSIT');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [depositedAt, setDepositedAt] = useState(toDateInput(editing?.depositedAt));
  const [note, setNote] = useState(editing?.note || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError('');
    const value = Math.abs(parseNumber(amount) || 0);
    if (!value) return setError('Escribe un monto mayor a 0');

    setSaving(true);
    try {
      const payload = { amount: value, kind, note: note.trim(), depositedAt: toIso(depositedAt) };
      if (editing?._id) await api.put(`/deposits/${editing._id}`, payload);
      else await api.post('/deposits', payload);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar movimiento', '¿Eliminar este movimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.del(`/deposits/${editing._id}`);
            navigation.goBack();
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Feedback type="error" message={error} />

        <Card title="Movimiento de capital">
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.rowWrap}>
            <Chip label="Aporte (meto dinero)" tone="success" selected={kind === 'DEPOSIT'} onPress={() => setKind('DEPOSIT')} />
            <Chip label="Retiro (saco dinero)" tone="danger" selected={kind === 'WITHDRAWAL'} onPress={() => setKind('WITHDRAWAL')} />
          </View>

          <Input
            label="Monto"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="1000"
            suffix="USDT"
          />
          <Input
            label="Fecha"
            value={depositedAt}
            onChangeText={setDepositedAt}
            placeholder="AAAA-MM-DD"
            hint="Formato 2026-03-15"
          />
          <Input label="Nota (opcional)" value={note} onChangeText={setNote} placeholder="Ej: aporte mensual, retiro de ganancias" />
        </Card>

        <Button title={editing ? 'Guardar cambios' : 'Registrar movimiento'} onPress={submit} loading={saving} />

        {editing ? (
          <>
            <View style={{ height: spacing.sm }} />
            <Button title="Eliminar movimiento" variant="danger" onPress={confirmDelete} />
          </>
        ) : null}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
});
