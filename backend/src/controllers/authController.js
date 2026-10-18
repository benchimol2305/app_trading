const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { toSafeUser } = require('../lib/format');

function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'trading_dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: user.id }, secret, { expiresIn });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, email y contraseña son obligatorios' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const found = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    const existing = found.rows[0];

    if (existing && !existing.deleted_at) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    let user;
    if (existing) {
      const updated = await pool.query(
        `UPDATE users SET name = $1, password = $2, deleted_at = NULL, updated_at = now()
         WHERE id = $3 RETURNING *`,
        [name, await bcrypt.hash(password, 10), existing.id]
      );
      user = updated.rows[0];
    } else {
      const created = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *',
        [name, normalizedEmail, await bcrypt.hash(password, 10)]
      );
      user = created.rows[0];
    }

    return res.status(201).json({
      success: true,
      message: 'Registro completado',
      data: { token: generateToken(user), user: toSafeUser(user) },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];

    if (!user || user.deleted_at) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

    return res.json({ success: true, data: { token: generateToken(user), user: toSafeUser(user) } });
  } catch (err) {
    next(err);
  }
};
