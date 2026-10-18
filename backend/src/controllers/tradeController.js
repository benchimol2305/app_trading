const { pool } = require('../config/db');
const { toTrade, isUuid } = require('../lib/format');
const { normalizeTrade, buildTradeFilters } = require('../lib/calc');

/** GET /api/trades -> lista con filtros (symbol, direction, result, status, from, to) */
exports.getAll = async (req, res, next) => {
  try {
    const { where, params } = buildTradeFilters(req.query, req.user.id);
    const { rows } = await pool.query(
      `SELECT * FROM trades t
       WHERE ${where}
       ORDER BY COALESCE(t.closed_at, t.opened_at) DESC, t.created_at DESC`,
      params
    );

    return res.json({ success: true, count: rows.length, data: rows.map(toTrade) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/trades/:id */
exports.getOne = async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    return res.json({ success: true, data: toTrade(rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** POST /api/trades */
exports.create = async (req, res, next) => {
  try {
    const t = normalizeTrade(req.body);
    if (!t.symbol) {
      return res.status(400).json({ success: false, message: 'El activo/par es obligatorio' });
    }
    if (!t.capital) {
      return res.status(400).json({ success: false, message: 'El capital invertido debe ser mayor a 0' });
    }

    const { rows } = await pool.query(
      `INSERT INTO trades
         (user_id, symbol, direction, status, capital, leverage, entry_price, exit_price, fees,
          result_amount, result_pct, strategy, notes, opened_at, closed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id, t.symbol, t.direction, t.status, t.capital, t.leverage, t.entryPrice, t.exitPrice,
        t.fees, t.resultAmount, t.resultPct, t.strategy, t.notes, t.openedAt, t.closedAt,
      ]
    );

    return res.status(201).json({ success: true, data: toTrade(rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/trades/:id -> permite cerrar una operación (status CLOSED + precio salida) */
exports.update = async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    const found = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!found.rows[0]) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    const current = toTrade(found.rows[0]);
    const merged = {
      ...current,
      ...req.body,
      entryPrice: req.body.entryPrice !== undefined ? req.body.entryPrice : current.entryPrice,
      exitPrice: req.body.exitPrice !== undefined ? req.body.exitPrice : current.exitPrice,
      openedAt: req.body.openedAt || current.openedAt,
      closedAt: req.body.closedAt || current.closedAt,
      resultAmount: req.body.resultAmount !== undefined ? req.body.resultAmount : current.resultAmount,
    };

    const t = normalizeTrade(merged);
    if (!t.symbol) {
      return res.status(400).json({ success: false, message: 'El activo/par es obligatorio' });
    }

    const { rows } = await pool.query(
      `UPDATE trades SET
         symbol = $1, direction = $2, status = $3, capital = $4, leverage = $5,
         entry_price = $6, exit_price = $7, fees = $8, result_amount = $9, result_pct = $10,
         strategy = $11, notes = $12, opened_at = $13, closed_at = $14, updated_at = now()
       WHERE id = $15 RETURNING *`,
      [
        t.symbol, t.direction, t.status, t.capital, t.leverage, t.entryPrice, t.exitPrice, t.fees,
        t.resultAmount, t.resultPct, t.strategy, t.notes, t.openedAt, t.closedAt, current._id,
      ]
    );

    return res.json({ success: true, data: toTrade(rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/trades/:id -> borrado lógico */
exports.remove = async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    const result = await pool.query(
      'UPDATE trades SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Operación no encontrada' });
    }

    return res.json({ success: true, message: 'Operación eliminada' });
  } catch (err) {
    next(err);
  }
};
