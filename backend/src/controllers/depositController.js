const { pool } = require('../config/db');
const { num, toDeposit, isUuid } = require('../lib/format');

/** GET /api/deposits -> aportes y retiros del usuario, más recientes primero */
exports.getAll = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM deposits
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY deposited_at DESC, created_at DESC`,
      [req.user.id]
    );

    const totals = rows.reduce(
      (acc, row) => {
        const amount = num(row.amount);
        if (row.kind === 'WITHDRAWAL') acc.withdrawn += Math.abs(amount);
        else acc.deposited += Math.abs(amount);
        return acc;
      },
      { deposited: 0, withdrawn: 0 }
    );

    return res.json({
      success: true,
      data: rows.map(toDeposit),
      totals: { ...totals, net: totals.deposited - totals.withdrawn },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/deposits -> registra un aporte (DEPOSIT) o un retiro (WITHDRAWAL) */
exports.create = async (req, res, next) => {
  try {
    const amount = Math.abs(num(req.body.amount));
    if (!amount) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    const kind = String(req.body.kind || 'DEPOSIT').toUpperCase() === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT';
    const depositedAt = req.body.depositedAt ? new Date(req.body.depositedAt) : new Date();

    const { rows } = await pool.query(
      `INSERT INTO deposits (user_id, amount, kind, note, deposited_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, amount, kind, (req.body.note || '').trim(), depositedAt]
    );

    return res.status(201).json({ success: true, data: toDeposit(rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/deposits/:id */
exports.update = async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    const found = await pool.query(
      'SELECT * FROM deposits WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (!found.rows[0]) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    const row = found.rows[0];
    const amount = req.body.amount !== undefined ? Math.abs(num(req.body.amount)) : num(row.amount);
    if (!amount) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    const kind = req.body.kind
      ? (String(req.body.kind).toUpperCase() === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'DEPOSIT')
      : row.kind;
    const note = req.body.note !== undefined ? String(req.body.note).trim() : row.note;
    const depositedAt = req.body.depositedAt ? new Date(req.body.depositedAt) : row.deposited_at;

    const { rows } = await pool.query(
      `UPDATE deposits SET amount = $1, kind = $2, note = $3, deposited_at = $4, updated_at = now()
       WHERE id = $5 RETURNING *`,
      [amount, kind, note, depositedAt, row.id]
    );

    return res.json({ success: true, data: toDeposit(rows[0]) });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/deposits/:id -> borrado lógico */
exports.remove = async (req, res, next) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    const result = await pool.query(
      'UPDATE deposits SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Movimiento no encontrado' });
    }

    return res.json({ success: true, message: 'Movimiento eliminado' });
  } catch (err) {
    next(err);
  }
};
