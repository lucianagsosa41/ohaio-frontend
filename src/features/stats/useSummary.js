// Ej: src/features/stats/useSummary.js
import { apiGet } from '../../api';

export async function fetchSummary(scope='daily', date /* 'YYYY-MM-DD' opcional */) {
  const q = new URLSearchParams({ scope });
  if (date) q.set('date', date);
  return apiGet(`/stats/summary?${q.toString()}`); 
  // -> { ingresos, pedidos, ticket_promedio, crecimiento_pct, neto, iva, from, to }
}

export async function fetchSeries(from, to, granularity='day') {
  const q = new URLSearchParams({ from, to, granularity });
  return apiGet(`/stats/series?${q.toString()}`);
  // -> [{ t, bruto, neto, iva, pedidos }, ...]
}

export async function fetchIva(from, to) {
  const q = new URLSearchParams({ from, to });
  return apiGet(`/stats/iva?${q.toString()}`);
  // -> [{ iva_pct, neto, iva, bruto }]
}

export async function fetchTop(from, to, limit=10) {
  const q = new URLSearchParams({ from, to, limit });
  return apiGet(`/stats/top-productos?${q.toString()}`);
  // -> [{ item, unidades, ventas }]
}
