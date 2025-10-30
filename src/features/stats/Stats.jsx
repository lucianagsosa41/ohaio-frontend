// src/features/stats/Stats.jsx
import React, { useEffect, useState } from 'react';
import { apiGet } from '../../api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from 'recharts';

const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
});

export default function Stats() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [iva, setIva] = useState([]);
  const [top, setTop] = useState([]);
  const [err, setErr] = useState('');

  async function fetchAll() {
    setErr('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const from = new Date(); from.setDate(from.getDate() - 6);
      const fromStr = from.toISOString().slice(0, 10);

      const s = await apiGet(`/stats/summary?scope=daily&date=${today}`);
      const ser = await apiGet(`/stats/series?from=${fromStr}&to=${today}&granularity=day`);
      const iv = await apiGet(`/stats/iva?from=${today}&to=${today}`);
      const tp = await apiGet(`/stats/top-productos?from=${today}&to=${today}&limit=5`);

      setSummary(s);
      setSeries(ser);
      setIva(iv);
      setTop(tp);
    } catch (e) {
      console.error(e);
      setErr('No pude cargar estadísticas');
    }
  }

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-lg font-semibold text-gray-900">Estadísticas de Ventas</h2>
      {err && <div className="text-red-600">{err}</div>}

      {/* Tarjetas resumen */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Ingresos Hoy</div>
            <div className="text-2xl font-bold text-green-600">{money.format(summary.ingresos)}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Pedidos Hoy</div>
            <div className="text-2xl font-bold text-blue-600">{summary.pedidos}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Ticket Promedio</div>
            <div className="text-2xl font-bold text-purple-600">{money.format(summary.ticket_promedio)}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-4 border">
            <div className="text-sm text-gray-500">Crecimiento</div>
            <div className={`text-2xl font-bold ${summary.crecimiento_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.crecimiento_pct != null ? `${summary.crecimiento_pct}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Serie de ingresos */}
      <div className="bg-white shadow rounded-lg p-4 border">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Ingresos últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series}>
            <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
            <YAxis />
            <Tooltip formatter={(v) => money.format(v)} />
            <Area dataKey="bruto" type="monotone" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* IVA Breakdown */}
      <div className="bg-white shadow rounded-lg p-4 border">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Desglose Neto vs IVA</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={[
                { name: 'Neto', value: summary?.neto || 0 },
                { name: 'IVA', value: summary?.iva || 0 },
              ]}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip formatter={(v) => money.format(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top productos */}
      <div className="bg-white shadow rounded-lg p-4 border">
        <h3 className="text-md font-semibold text-gray-700 mb-4">Top productos hoy</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unidades</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {top.map((p) => (
              <tr key={p.item}>
                <td className="px-4 py-2 text-sm text-gray-900">{p.item}</td>
                <td className="px-4 py-2 text-sm text-right">{p.unidades}</td>
                <td className="px-4 py-2 text-sm text-right">{money.format(p.ventas)}</td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr><td colSpan="3" className="px-4 py-6 text-sm text-gray-500 text-center">Sin ventas hoy</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
