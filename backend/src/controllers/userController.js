const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { toSafeUser } = require('../lib/format');

exports.getMe = async (req, res, next) => {
  try {
    return res.json({ success: true, data: toSafeUser(req.user) });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = req.user;

    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(name);
    }

    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const normalized = email.toLowerCase().trim();
      const exists = await pool.query(
        'SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL AND id <> $2',
        [normalized, user.id]
      );
      if (exists.rowCount > 0) {
        return res.status(400).json({ success: false, message: 'El email ya está en uso por otro usuario' });
      }
      fields.push(`email = $${i++}`);
      values.push(normalized);
    }

    if (password) {
      fields.push(`password = $${i++}`);
      values.push(await bcrypt.hash(password, 10));
    }

    if (fields.length) {
      values.push(user.id);
      const updated = await pool.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING *`,
        values
      );
      req.user = updated.rows[0];
    }

    return res.json({ success: true, data: toSafeUser(req.user) });
  } catch (err) {
    next(err);
  }
};

/** Borrado lógico de la cuenta + cascada (operaciones y aportes). */
exports.deleteMe = async (req, res, next) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET deleted_at = now(), updated_at = now() WHERE id = $1', [req.user.id]);
      await client.query('UPDATE trades SET deleted_at = now(), updated_at = now() WHERE user_id = $1 AND deleted_at IS NULL', [req.user.id]);
      await client.query('UPDATE deposits SET deleted_at = now(), updated_at = now() WHERE user_id = $1 AND deleted_at IS NULL', [req.user.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (err) {
    next(err);
  }
};
