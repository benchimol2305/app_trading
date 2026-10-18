/** Utilidades de formato para números, fechas y porcentajes. */

const money = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatMoney(value, withSign = false) {
  const n = Number(value) || 0;
  const sign = n > 0 && withSign ? '+' : n < 0 ? '-' : '';
  return `${sign}$${money.format(Math.abs(n))}`;
}

export function formatPct(value, withSign = true) {
  const n = Number(value) || 0;
  const sign = n > 0 && withSign ? '+' : n < 0 ? '-' : '';
  return `${sign}${money.format(Math.abs(n))}%`;
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  if (n >= 1000) return money.format(n);
  return String(n);
}

export function formatDate(value, withTime = false) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export function formatShortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

/** Convierte una fecha a "YYYY-MM-DD" para enviarla a la API. */
export function toIsoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function parseNumber(text) {
  if (text === null || text === undefined) return null;
  const normalized = String(text).replace(',', '.').replace(/[^0-9.\-]/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function colorForResult(value) {
  const n = Number(value) || 0;
  if (n > 0) return '#22C55E';
  if (n < 0) return '#EF4444';
  return '#8FA3BF';
}
