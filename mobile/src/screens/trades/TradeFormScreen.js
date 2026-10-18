import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import ScreenBackground from '../../components/ScreenBackground';
import Input from '../../components/Input';
import Segmented from '../../components/Segmented';
import Button from '../../components/Button';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, gradients, spacing, radius, type, glow } from '../../theme/colors';
import { formatMoney, formatPct, colorForResult, parseNumber } from '../../lib/format';
import { computeResultPreview } from '../../lib/calc';

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

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

export default function TradeFormScreen({ navigation, route }) {
  const editing = route?.params?.trade || null;

  const [symbol, setSymbol] = useState(editing?.symbol || '');
  const [direction, setDirection] = useState(editing?.direction || 'LONG');
  const [status, setStatus] = useState(editing?.status || 'CLOSED');
  const [capital, setCapital] = useState(editing ? String(editing.capital) : '');
  const [leverage, setLeverage] = useState(editing ? String(editing.leverage) : '1');
  const [entryPrice, setEntryPrice] = useState(editing?.entryPrice ? String(editing.entryPrice) : '');
  const [exitPrice, setExitPrice] = useState(editing?.exitPrice ? String(editing.exitPrice) : '');
  const [fees, setFees] = useState(editing ? String(editing.fees) : '');
  const [manualResult, setManualResult] = useState(
    editing && !editing.entryPrice && editing.resultAmount !== null ? String(editing.resultAmount) : ''
  );
  const [openedAt, setOpenedAt] = useState(toDateInput(editing?.openedAt));
  const [closedAt, setClosedAt] = useState(toDateInput(editing?.closedAt));
  const [strategy, setStrategy] = useState(editing?.strategy || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const hasPrices = Number(parseNumber(entryPrice)) > 0 && Number(parseNumber(exitPrice)) > 0;

  const preview = useMemo(
    () =>
      computeResultPreview({
        direction,
        status,
        capital: parseNumber(capital),
        leverage: parseNumber(leverage) || 1,
        entryPrice: parseNumber(entryPrice),
        exitPrice: parseNumber(exitPrice),
        fees: parseNumber(fees) || 0,
        manualResult: parseNumber(manualResult),
      }),
    [direction, status, capital, leverage, entryPrice, exitPrice, fees, manualResult]
  );

  const submit = async () => {
    setError('');
    if (!symbol.trim()) return setError('Escribe el activo o par que operaste (ej: BTCUSDT)');
    if (!(Number(parseNumber(capital)) > 0)) return setError('El capital invertido debe ser mayor a 0');
    if (status === 'CLOSED' && !hasPrices && parseNumber(manualResult) === null) {
      return setError('Ingresa el precio de entrada y salida, o el resultado en dinero');
    }

    const payload = {
      symbol: symbol.trim().toUpperCase(),
      direction,
      status,
      capital: parseNumber(capital),
      leverage: parseNumber(leverage) || 1,
      entryPrice: parseNumber(entryPrice),
      exitPrice: status === 'OPEN' ? null : parseNumber(exitPrice),
      fees: parseNumber(fees) || 0,
      openedAt: toIso(openedAt),
      closedAt: status === 'OPEN' ? null : toIso(closedAt),
      strategy: strategy.trim(),
      notes: notes.trim(),
    };
    if (status === 'CLOSED' && !hasPrices) payload.resultAmount = parseNumber(manualResult);

    setSaving(true);
    try {
      if (editing?._id) await api.put(`/trades/${editing._id}`, payload);
      else await api.post('/trades', payload);
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tone = preview ? colorForResult(preview.amount) : colors.textMuted;

  return (
    <ScreenBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Feedback type="error" message={error} />

          {status === 'CLOSED' ? (
            <View style={[styles.preview, glow(tone, 0.25, 22, 8)]}>
              <LinearGradient
                colors={preview ? (preview.amount >= 0 ? gradients.successCard : gradients.dangerCard) : gradients.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.previewLabel}>Resultado estimado</Text>
              {preview ? (
                <>
                  <Text style={[styles.previewValue, { color: tone }]}>{formatMoney(preview.amount, true)}</Text>
                  <Text style={[styles.previewPct, { color: tone }]}>{formatPct(preview.pct)} sobre tu capital</Text>
                </>
              ) : (
                <Text style={styles.previewHint}>
                  Escribe los precios de entrada y salida (recomendado) o el resultado en dinero.
                </Text>
              )}
            </View>
          ) : (
            <View style={[styles.preview, glow(colors.info, 0.2, 22, 8)]}>
              <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
              <Text style={styles.previewLabel}>Operación abierta</Text>
              <Text style={[styles.previewValue, { color: colors.info, fontSize: 22 }]}>En curso</Text>
              <Text style={styles.previewHint}>Se calculará el resultado cuando la cierres.</Text>
            </View>
          )}

          <Section title="Operación">
            <Input
              label="Activo / par"
              value={symbol}
              onChangeText={(t) => setSymbol(t.toUpperCase())}
              placeholder="BTCUSDT, ETHUSDT, AAPL..."
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Dirección</Text>
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { label: 'LONG', value: 'LONG' },
                { label: 'SHORT', value: 'SHORT' },
              ]}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Estado</Text>
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { label: 'Cerrada', value: 'CLOSED' },
                { label: 'Abierta', value: 'OPEN' },
              ]}
            />
          </Section>

          <Section title="Capital y precios">
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Capital invertido"
                  value={capital}
                  onChangeText={setCapital}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  suffix="USDT"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ width: 112 }}>
                <Input
                  label="Apalancam."
                  value={leverage}
                  onChangeText={setLeverage}
                  keyboardType="decimal-pad"
                  placeholder="1"
                  suffix="x"
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Input label="Precio entrada" value={entryPrice} onChangeText={setEntryPrice} keyboardType="decimal-pad" placeholder="Opcional" />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Precio salida"
                  value={exitPrice}
                  onChangeText={setExitPrice}
                  keyboardType="decimal-pad"
                  placeholder={status === 'OPEN' ? '—' : 'Opcional'}
                  editable={status !== 'OPEN'}
                />
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Input label="Comisiones" value={fees} onChangeText={setFees} keyboardType="decimal-pad" placeholder="0" suffix="USDT" />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input label="Fecha entrada" value={openedAt} onChangeText={setOpenedAt} placeholder="AAAA-MM-DD" hint="2026-03-15" />
              </View>
            </View>

            {status === 'CLOSED' ? (
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Input label="Fecha salida" value={closedAt} onChangeText={setClosedAt} placeholder="AAAA-MM-DD" />
                </View>
                <View style={{ width: spacing.md }} />
                {!hasPrices ? (
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Resultado manual"
                      value={manualResult}
                      onChangeText={setManualResult}
                      keyboardType="decimal-pad"
                      placeholder="25 o -10"
                      suffix="USDT"
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ) : null}
          </Section>

          <Section title="Detalles opcionales">
            <Input label="Estrategia / setup" value={strategy} onChangeText={setStrategy} placeholder="Ruptura, soporte, scalping..." />
            <Input
              label="Notas"
              value={notes}
              onChangeText={setNotes}
              placeholder="Qué hiciste bien o mal, emociones, plan..."
              multiline
              numberOfLines={4}
            />
          </Section>

          <Button
            title={editing ? 'Guardar cambios' : 'Registrar operación'}
            onPress={submit}
            loading={saving}
            style={{ marginTop: spacing.xs }}
          />
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  preview: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  previewLabel: { ...type.micro, color: colors.textMuted },
  previewValue: { fontSize: 32, fontWeight: '800', marginTop: 6, fontVariant: ['tabular-nums'] },
  previewPct: { fontSize: 13, fontWeight: '700', marginTop: 2, opacity: 0.9 },
  previewHint: { color: colors.textMuted, fontSize: 12, marginTop: 8, lineHeight: 18 },
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
  rowFields: { flexDirection: 'row' },
});
