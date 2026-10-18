const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Middleware de autenticación (JWT Bearer).
 * Carga el usuario activo (sin borrado lógico) en `req.user`.
 */
module.exports = async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado: token faltante' });
    }

    const token = header.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'trading_dev_secret';
    const decoded = jwt.verify(token, secret);

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ success: false, message: 'La cuenta no existe o fue desactivada' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesión inválida o expirada' });
  }
};
