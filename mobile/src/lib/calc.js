/** Cálculo del resultado de una operación (mismas reglas que el backend). */
export function computeResultPreview({ direction, status, capital, leverage, entryPrice, exitPrice, fees, manualResult }) {
  if (status === 'OPEN') return null;

  const cap = Number(capital) || 0;
  const lev = Number(leverage) || 1;
  const fee = Number(fees) || 0;

  let amount = null;

  if (Number(entryPrice) > 0 && Number(exitPrice) > 0) {
    const entry = Number(entryPrice);
    const exit = Number(exitPrice);
    const move = direction === 'SHORT' ? (entry - exit) / entry : (exit - entry) / entry;
    amount = move * cap * lev - fee;
  } else if (manualResult !== null && manualResult !== undefined && manualResult !== '') {
    amount = Number(manualResult);
  }

  if (amount === null || !Number.isFinite(amount)) return null;

  const pct = cap > 0 ? (amount / cap) * 100 : 0;
  return { amount: Math.round(amount * 100) / 100, pct: Math.round(pct * 100) / 100 };
}
