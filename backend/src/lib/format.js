/** Utilidades de formato, validación y mapeo de filas SQL -> JSON. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function toSafeUser(row) {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTrade(row) {
  return {
    _id: row.id,
    symbol: row.symbol,
    direction: row.direction,
    status: row.status,
    capital: num(row.capital),
    leverage: num(row.leverage, 1),
    entryPrice: row.entry_price === null ? null : num(row.entry_price),
    exitPrice: row.exit_price === null ? null : num(row.exit_price),
    fees: num(row.fees),
    resultAmount: row.result_amount === null ? null : num(row.result_amount),
    resultPct: row.result_pct === null ? null : num(row.result_pct),
    strategy: row.strategy,
    notes: row.notes,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDeposit(row) {
  return {
    _id: row.id,
    amount: num(row.amount),
    kind: row.kind,
    note: row.note,
    depositedAt: row.deposited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { isUuid, num, round, toSafeUser, toTrade, toDeposit };
