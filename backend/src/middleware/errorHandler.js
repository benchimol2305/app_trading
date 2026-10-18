function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor';

  if (err.code === '22P02') {
    status = 400;
    message = 'Identificador no válido';
  }
  if (err.code === '23505') {
    status = 400;
    message = 'El valor ya está en uso';
  }
  if (err.code === '23502') {
    status = 400;
    message = 'Faltan campos obligatorios';
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Sesión inválida o expirada';
  }

  return res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
