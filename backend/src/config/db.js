const { Pool } = require('pg');

/**
 * Conexion a PostgreSQL (Supabase).
 *
 * Esquema (borrado logico con deleted_at en todas las tablas):
 *   users    -> cuentas de la app
 *   trades   -> operaciones (LONG/SHORT) con su resultado ($ y %)
 *   deposits -> aportes y retiros de capital
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PGDATABASE,
  ssl: process.env.NODE_ENV === 'production' || /supabase|render/i.test(process.env.DATABASE_URL || '')
    ? { rejectUnauthorized: false }
    : false,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  password    text NOT NULL,
  deleted_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deposits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       numeric(16,2) NOT NULL,
  kind         text NOT NULL DEFAULT 'DEPOSIT',
  note         text NOT NULL DEFAULT '',
  deposited_at timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trades (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol        text NOT NULL,
  direction     text NOT NULL DEFAULT 'LONG',
  status        text NOT NULL DEFAULT 'CLOSED',
  capital       numeric(16,2) NOT NULL DEFAULT 0,
  leverage      numeric(10,2) NOT NULL DEFAULT 1,
  entry_price   numeric(20,8),
  exit_price    numeric(20,8),
  fees          numeric(16,2) NOT NULL DEFAULT 0,
  result_amount numeric(16,2),
  result_pct    numeric(12,4),
  strategy      text NOT NULL DEFAULT '',
  notes         text NOT NULL DEFAULT '',
  opened_at     timestamptz NOT NULL DEFAULT now(),
  closed_at     timestamptz,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_closed ON trades(closed_at);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposits(user_id);
`;

async function connectDB() {
  await pool.query(SCHEMA);
  console.log('[DB] PostgreSQL conectado y esquema listo');
  return pool;
}

module.exports = { pool, connectDB };
