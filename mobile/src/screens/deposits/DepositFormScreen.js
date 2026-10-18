import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenBackground from '../../components/ScreenBackground';
import Input from '../../components/Input';
import Segmented from '../../components/Segmented';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, gradients, spacing, radius, type } from '../../theme/colors';
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
    <ScreenBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Feedback type="error" message={error} />

          <View style={styles.section}>
            <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
            <View style={styles.sectionPadding}>
              <Text style={styles.sectionTitle}>Movimiento de capital</Text>

              <Text style={styles.label}>Tipo</Text>
              <Segmented
                value={kind}
                onChange={setKind}
                options={[
                  { label: 'Aporte', value: 'DEPOSIT' },
                  { label: 'Retiro', value: 'WITHDRAWAL' },
                ]}
              />

              <View style={{ height: spacing.md }} />

              <Input
                label="Monto"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="1000"
                suffix="USDT"
              />
              <Input label="Fecha" value={depositedAt} onChangeText={setDepositedAt} placeholder="AAAA-MM-DD" hint="2026-03-15" />
              <Input label="Nota (opcional)" value={note} onChangeText={setNote} placeholder="Aporte mensual, retiro de ganancias..." />
            </View>
          </View>

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
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionPadding: { padding: spacing.md },
  sectionTitle: { ...type.micro, color: colors.textMuted, marginBottom: spacing.md },
  label: { ...type.micro, color: colors.textMuted, marginBottom: 7 },
});
