const { num, round, isUuid } = require('./format');

/**
 * Calcula el resultado de una operación.
 *
 * Reglas:
 *   - Si la operación está ABIERTA (OPEN) no tiene resultado.
 *   - Si se envían precio de entrada y salida, el resultado se calcula:
 *       LONG : (salida - entrada) / entrada * (capital * apalancamiento) - comisiones
 *       SHORT: (entrada - salida) / entrada * (capital * apalancamiento) - comisiones
 *     El % de rentabilidad se calcula sobre TU capital invertido (margen).
 *   - Si el usuario envía el resultado ($) directamente, se respeta ese valor
 *     (útil cuando no se registran precios).
 */
function computeResult(trade) {
  const { direction, status, capital, leverage, entryPrice, exitPrice, fees, manualResult } = trade;

  if (status === 'OPEN') return { resultAmount: null, resultPct: null };

  const cap = num(capital);
  const lev = num(leverage, 1) || 1;
  const fee = num(fees);

  const hasPrices = num(entryPrice, 0) > 0 && num(exitPrice, 0) > 0;
  let amount;

  if (hasPrices) {
    const move = direction === 'SHORT'
      ? (num(entryPrice) - num(exitPrice)) / num(entryPrice)
      : (num(exitPrice) - num(entryPrice)) / num(entryPrice);
    amount = move * cap * lev - fee;
  } else if (manualResult !== undefined && manualResult !== null && manualResult !== '') {
    amount = num(manualResult);
  } else {
    return { resultAmount: null, resultPct: null };
  }

  const pct = cap > 0 ? (amount / cap) * 100 : 0;
  return { resultAmount: round(amount, 2), resultPct: round(pct, 2) };
}

/** Normaliza el cuerpo de una operación recibida del cliente. */
function normalizeTrade(body) {
  const status = (body.status || 'CLOSED').toUpperCase() === 'OPEN' ? 'OPEN' : 'CLOSED';
  const direction = (body.direction || 'LONG').toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG';

  const entryPrice = body.entryPrice === '' || body.entryPrice === undefined ? null : num(body.entryPrice, null);
  const exitPrice = body.exitPrice === '' || body.exitPrice === undefined ? null : num(body.exitPrice, null);

  const openedAt = body.openedAt ? new Date(body.openedAt) : new Date();
  const closedAt = body.closedAt ? new Date(body.closedAt) : (status === 'CLOSED' ? new Date() : null);

  const normalized = {
    symbol: (body.symbol || '').trim().toUpperCase(),
    direction,
    status,
    capital: Math.max(0, num(body.capital)),
    leverage: Math.max(0, num(body.leverage, 1)) || 1,
    entryPrice,
    exitPrice: status === 'OPEN' ? null : exitPrice,
    fees: num(body.fees),
    strategy: (body.strategy || '').trim(),
    notes: (body.notes || '').trim(),
    openedAt,
    closedAt: status === 'OPEN' ? null : closedAt,
    manualResult: body.resultAmount,
  };

  const result = computeResult(normalized);
  return { ...normalized, ...result };
}

/** Filtros de fecha/estado reutilizables para las consultas. */
function buildTradeFilters(query, userId) {
  const where = ['t.deleted_at IS NULL', 't.user_id = $1'];
  const params = [userId];

  if (query.status) {
    params.push(String(query.status).toUpperCase());
    where.push(`t.status = $${params.length}`);
  }
  if (query.direction) {
    params.push(String(query.direction).toUpperCase());
    where.push(`t.direction = $${params.length}`);
  }
  if (query.symbol) {
    params.push(`%${String(query.symbol).trim()}%`);
    where.push(`t.symbol ILIKE $${params.length}`);
  }
  if (query.result === 'win') where.push('COALESCE(t.result_amount, 0) > 0');
  if (query.result === 'loss') where.push('COALESCE(t.result_amount, 0) < 0');
  if (isUuidOrDate(query.from)) {
    params.push(query.from);
    where.push(`COALESCE(t.closed_at, t.opened_at) >= $${params.length}`);
  }
  if (isUuidOrDate(query.to)) {
    params.push(query.to);
    where.push(`COALESCE(t.closed_at, t.opened_at) <= $${params.length}`);
  }

  return { where: where.join(' AND '), params, from: query.from, to: query.to };
}

function isUuidOrDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

module.exports = { computeResult, normalizeTrade, buildTradeFilters, isUuid };
