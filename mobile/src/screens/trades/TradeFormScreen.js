import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

import Input from '../../components/Input';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Feedback from '../../components/Feedback';
import { api } from '../../api/client';
import { colors, spacing } from '../../theme/colors';
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Feedback type="error" message={error} />

        <Card title="Operación">
          <Input
            label="Activo / par"
            value={symbol}
            onChangeText={(t) => setSymbol(t.toUpperCase())}
            placeholder="BTCUSDT, ETHUSDT, AAPL..."
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Dirección</Text>
          <View style={styles.rowWrap}>
            <Chip label="LONG (compra)" tone="success" selected={direction === 'LONG'} onPress={() => setDirection('LONG')} />
            <Chip label="SHORT (venta)" tone="danger" selected={direction === 'SHORT'} onPress={() => setDirection('SHORT')} />
          </View>

          <Text style={styles.label}>Estado</Text>
          <View style={styles.rowWrap}>
            <Chip label="Cerrada" selected={status === 'CLOSED'} onPress={() => setStatus('CLOSED')} />
            <Chip label="Abierta" selected={status === 'OPEN'} onPress={() => setStatus('OPEN')} />
          </View>

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
            <View style={{ width: 110 }}>
              <Input
                label="Apalancamiento"
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
              <Input
                label="Precio de entrada"
                value={entryPrice}
                onChangeText={setEntryPrice}
                keyboardType="decimal-pad"
                placeholder="Opcional"
              />
            </View>
            <View style={{ width: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Precio de salida"
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
              <Input label="Fecha de entrada" value={openedAt} onChangeText={setOpenedAt} placeholder="AAAA-MM-DD" hint="Formato 2026-03-15" />
            </View>
          </View>

          {status === 'CLOSED' ? (
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Input label="Fecha de salida" value={closedAt} onChangeText={setClosedAt} placeholder="AAAA-MM-DD" />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                {!hasPrices ? (
                  <Input
                    label="Resultado manual"
                    value={manualResult}
                    onChangeText={setManualResult}
                    keyboardType="decimal-pad"
                    placeholder="Ej: 25 o -10"
                    suffix="USDT"
                  />
                ) : (
                  <View />
                )}
              </View>
            </View>
          ) : null}
        </Card>

        {status === 'CLOSED' ? (
          <Card title="Resultado calculado">
            {preview ? (
              <View>
                <Text style={[styles.result, { color: colorForResult(preview.amount) }]}>
                  {formatMoney(preview.amount, true)}
                </Text>
                <Text style={[styles.resultPct, { color: colorForResult(preview.amount) }]}>
                  {formatPct(preview.pct)} sobre tu capital
                </Text>
                <Text style={styles.hint}>
                  {hasPrices
                    ? 'Calculado con precio de entrada/salida, apalancamiento y comisiones.'
                    : 'Usando el resultado manual que escribiste.'}
                </Text>
              </View>
            ) : (
              <Text style={styles.hint}>
                Escribe precio de entrada y salida (recomendado) o el resultado en dinero para ver el cálculo.
              </Text>
            )}
          </Card>
        ) : null}

        <Card title="Detalles opcionales">
          <Input label="Estrategia / setup" value={strategy} onChangeText={setStrategy} placeholder="Ej: ruptura, soporte, scalping" />
          <Input
            label="Notas"
            value={notes}
            onChangeText={setNotes}
            placeholder="Qué hiciste bien o mal, emociones, plan..."
            multiline
            numberOfLines={4}
          />
        </Card>

        <Button title={editing ? 'Guardar cambios' : 'Registrar operación'} onPress={submit} loading={saving} />
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
  rowFields: { flexDirection: 'row' },
  result: { fontSize: 30, fontWeight: '800' },
  resultPct: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
});
