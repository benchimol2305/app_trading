require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API de Trading funcionando', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/deposits', require('./routes/depositRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Falta DATABASE_URL en las variables de entorno');
    }
    await connectDB();
    app.listen(PORT, () => console.log(`[API] Escuchando en http://localhost:${PORT}`));
  } catch (err) {
    console.error('[API] Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
