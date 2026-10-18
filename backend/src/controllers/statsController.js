const { pool } = require('../config/db');
const { toTrade, toDeposit, num, round } = require('../lib/format');

/**
 * Estadísticas del diario de trading.
 *
 * Todas aceptan filtros de fecha: ?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   - summary -> resumen general (capital, P&L, aciertos, profit factor, long vs short)
 *   - equity  -> curva de capital (aportes + resultado acumulado)
 *   - pnl     -> ganancia/pérdida por período (?groupBy=day|week|month)
 */

async function loadData(userId, from, to) {
  const params = [userId];
  const tradeWhere = ['t.user_id = $1', 't.deleted_at IS NULL'];
  const depositWhere = ['d.user_id = $1', 'd.deleted_at IS NULL'];

  if (from) {
    params.push(from);
    tradeWhere.push(`COALESCE(t.closed_at, t.opened_at) >= $${params.length}`);
    depositWhere.push(`d.deposited_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    tradeWhere.push(`COALESCE(t.closed_at, t.opened_at) <= $${params.length}`);
    depositWhere.push(`d.deposited_at <= $${params.length}`);
  }

  const [trades, deposits] = await Promise.all([
    pool.query(`SELECT * FROM trades t WHERE ${tradeWhere.join(' AND ')} ORDER BY COALESCE(t.closed_at, t.opened_at) ASC`, params),
    pool.query(`SELECT * FROM deposits d WHERE ${depositWhere.join(' AND ')} ORDER BY d.deposited_at ASC`, params),
  ]);

  return { trades: trades.rows.map(toTrade), deposits: deposits.rows.map(toDeposit) };
}

function sum(list, pick) {
  return list.reduce((acc, item) => acc + pick(item), 0);
}

function isWin(t) {
  return num(t.resultAmount, 0) > 0;
}
function isLoss(t) {
  return num(t.resultAmount, 0) < 0;
}

function periodKey(date, groupBy) {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  if (groupBy === 'month') return `${y}-${m}`;
  if (groupBy === 'week') {
    const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }
  return d.toISOString().slice(0, 10);
}

/** GET /api/stats/summary */
exports.summary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { trades, deposits } = await loadData(req.user.id, from, to);

    const closed = trades.filter((t) => t.status === 'CLOSED' && t.resultAmount !== null);
    const open = trades.filter((t) => t.status === 'OPEN');

    const deposited = sum(deposits.filter((d) => d.kind !== 'WITHDRAWAL'), (d) => Math.abs(d.amount));
    const withdrawn = sum(deposits.filter((d) => d.kind === 'WITHDRAWAL'), (d) => Math.abs(d.amount));
    const netCapital = round(deposited - withdrawn);

    const totalPnl = round(sum(closed, (t) => num(t.resultAmount)));
    const grossProfit = round(sum(closed.filter(isWin), (t) => num(t.resultAmount)));
    const grossLoss = round(sum(closed.filter(isLoss), (t) => num(t.resultAmount)));
    const wins = closed.filter(isWin);
    const losses = closed.filter(isLoss);

    const byDirection = (dir) => {
      const list = closed.filter((t) => t.direction === dir);
      const pnl = round(sum(list, (t) => num(t.resultAmount)));
      const w = list.filter(isWin).length;
      return {
        trades: list.length,
        wins: w,
        losses: list.filter(isLoss).length,
        winRate: list.length ? round((w / list.length) * 100, 1) : 0,
        pnl,
        pnlPct: netCapital ? round((pnl / netCapital) * 100, 2) : 0,
        capital: round(sum(list, (t) => num(t.capital))),
      };
    };

    const best = closed.reduce((acc, t) => (!acc || num(t.resultAmount) > num(acc.resultAmount) ? t : acc), null);
    const worst = closed.reduce((acc, t) => (!acc || num(t.resultAmount) < num(acc.resultAmount) ? t : acc), null);

    return res.json({
      success: true,
      data: {
        range: { from: from || null, to: to || null },
        capital: {
          deposited: round(deposited),
          withdrawn: round(withdrawn),
          net: netCapital,
          equity: round(netCapital + totalPnl),
          openPositions: open.length,
          openCapital: round(sum(open, (t) => num(t.capital))),
        },
        pnl: { total: totalPnl, totalPct: netCapital ? round((totalPnl / netCapital) * 100, 2) : 0, grossProfit, grossLoss },
        trades: {
          total: trades.length,
          closed: closed.length,
          open: open.length,
          wins: wins.length,
          losses: losses.length,
          breakeven: closed.length - wins.length - losses.length,
          winRate: closed.length ? round((wins.length / closed.length) * 100, 1) : 0,
        },
        averages: {
          win: wins.length ? round(grossProfit / wins.length) : 0,
          loss: losses.length ? round(Math.abs(grossLoss) / losses.length) : 0,
          perTrade: closed.length ? round(totalPnl / closed.length) : 0,
        },
        profitFactor: grossLoss !== 0 ? round(Math.abs(grossProfit / grossLoss), 2) : (grossProfit > 0 ? null : 0),
        best: best ? { symbol: best.symbol, amount: num(best.resultAmount), pct: num(best.resultPct), date: best.closedAt || best.openedAt } : null,
        worst: worst ? { symbol: worst.symbol, amount: num(worst.resultAmount), pct: num(worst.resultPct), date: worst.closedAt || worst.openedAt } : null,
        long: byDirection('LONG'),
        short: byDirection('SHORT'),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/stats/equity -> [{ date, equity, pnl, flow, label }] */
exports.equity = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const { trades, deposits } = await loadData(req.user.id, from, to);

    const events = [
      ...deposits.map((d) => ({
        date: new Date(d.depositedAt),
        flow: (d.kind === 'WITHDRAWAL' ? -1 : 1) * Math.abs(d.amount),
        pnl: 0,
        label: d.kind === 'WITHDRAWAL' ? 'Retiro' : 'Aporte',
      })),
      ...trades
        .filter((t) => t.status === 'CLOSED' && t.resultAmount !== null)
        .map((t) => ({
          date: new Date(t.closedAt || t.openedAt),
          flow: 0,
          pnl: num(t.resultAmount),
          label: t.symbol,
        })),
    ].sort((a, b) => a.date - b.date);

    let equity = 0;
    let pnl = 0;
    const points = events.map((e) => {
      equity += e.flow + e.pnl;
      pnl += e.pnl;
      return {
        date: e.date.toISOString(),
        label: e.label,
        flow: round(e.flow),
        pnl: round(pnl),
        equity: round(equity),
      };
    });

    return res.json({ success: true, data: points });
  } catch (err) {
    next(err);
  }
};

/** GET /api/stats/pnl?groupBy=day|week|month */
exports.pnlSeries = async (req, res, next) => {
  try {
    const groupBy = ['day', 'week', 'month'].includes(req.query.groupBy) ? req.query.groupBy : 'month';
    const { from, to } = req.query;
    const { trades, deposits } = await loadData(req.user.id, from, to);

    const closed = trades.filter((t) => t.status === 'CLOSED' && t.resultAmount !== null);
    const buckets = new Map();

    closed.forEach((t) => {
      const date = new Date(t.closedAt || t.openedAt);
      const key = periodKey(date, groupBy);
      const bucket = buckets.get(key) || { period: key, pnl: 0, wins: 0, losses: 0, trades: 0 };
      bucket.pnl += num(t.resultAmount);
      bucket.trades += 1;
      if (isWin(t)) bucket.wins += 1;
      if (isLoss(t)) bucket.losses += 1;
      if (!bucket.start || date < bucket.start) bucket.start = date;
      buckets.set(key, bucket);
    });

    const netAt = (date) =>
      deposits
        .filter((d) => new Date(d.depositedAt) <= date)
        .reduce((acc, d) => acc + (d.kind === 'WITHDRAWAL' ? -1 : 1) * Math.abs(d.amount), 0);

    let cumulative = 0;
    const data = [...buckets.values()]
      .sort((a, b) => a.start - b.start)
      .map((b) => {
        cumulative += b.pnl;
        const capital = netAt(b.start);
        return {
          period: b.period,
          start: b.start.toISOString(),
          pnl: round(b.pnl),
          pnlPct: capital ? round((b.pnl / capital) * 100, 2) : 0,
          cumulative: round(cumulative),
          trades: b.trades,
          wins: b.wins,
          losses: b.losses,
        };
      });

    return res.json({ success: true, groupBy, data });
  } catch (err) {
    next(err);
  }
};
