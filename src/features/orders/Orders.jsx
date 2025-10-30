// src/features/orders/Orders.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDel, apiPatch } from '../../api';

// Helpers
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

function formatTime(t) {
  if (!t) return '—';
  try {
    if (typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t)) return t;
    const d = new Date(t);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '—';
  }
}

// Backend -> UI
function mapOrder(r) {
  return {
    id: r.id,
    customer: r.cliente ?? '',
    type: r.tipo ?? 'delivery',        // delivery | pedidosya
    status: r.estado ?? 'pending',     // pending | preparing | served | paid
    notes: r.notas ?? '',
    timeIn: r.fecha ?? null,
    total: Number(r.total ?? 0),
  };
}

// Catálogos simples (front-only) para cafés/dulces a notas
const CAFES = [
  { id: 'cafe', name: 'Café' },
  { id: 'cappuccino', name: 'Capuchino' },
  { id: 'latte', name: 'Latte' },
  { id: 'te', name: 'Té' },
];

const DULCES = [
  { id: 'medialuna', name: 'Medialuna' },
  { id: 'torta-choco', name: 'Torta de chocolate' },
  { id: 'tarta-fruta', name: 'Tarta de frutas' },
  { id: 'budin', name: 'Budín' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Catálogo hamburguesas (desde backend)
  const [burgers, setBurgers] = useState([]);
  // === BEBIDAS: catálogo desde backend ===
  const [drinks, setDrinks] = useState([]);

  // Estado impresora
  const [printerOK, setPrinterOK] = useState(null); // null = chequeando, true/false = estado
  const [checkingPrinter, setCheckingPrinter] = useState(false);

  // Modal crear/editar
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = creando
  const [form, setForm] = useState({
    type: 'delivery',     // delivery | pedidosya
    customer: '',
    notes: '',
    burgerLines: [{ burgerId: '', qty: 1 }], // detalle_pedidos
    // === BEBIDAS: detalle_bebidas ===
    drinkLines: [{ drinkId: '', qty: 1 }],
    // a Notas (solo informativo)
    coffeeLines: [{ cafeId: '', qty: 1 }],
    sweetLines: [{ sweetId: '', qty: 1 }],
    autoPrint: true,      // 🔔
  });

  async function fetchOrders() {
    setLoading(true);
    setErr('');
    try {
      const data = await apiGet('/pedidos');
      const mapped = (Array.isArray(data) ? data : []).map(mapOrder);
      setOrders(mapped);
    } catch (e) {
      console.error(e);
      setErr('No pude cargar pedidos.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBurgers() {
    try {
      const data = await apiGet('/hamburguesas');
      const list = Array.isArray(data) ? data : [];
      setBurgers(list.map(h => ({ id: h.id, name: h.nombre, price: Number(h.precio ?? 0) })));
    } catch (e) {
      console.warn('No pude cargar hamburguesas', e);
      setBurgers([]);
    }
  }

  // === BEBIDAS: fetch catálogo ===
  async function fetchDrinks() {
    try {
      const data = await apiGet('/bebidas');
      const list = Array.isArray(data) ? data : [];
      setDrinks(list.map(d => ({ id: d.id, name: d.nombre, price: Number(d.precio ?? 0) })));
    } catch (e) {
      console.warn('No pude cargar bebidas', e);
      setDrinks([]);
    }
  }

  async function checkPrinter() {
    try {
      setCheckingPrinter(true);
      const status = await apiGet('/printer/health'); // GET /api/printer/health
      setPrinterOK(!!status?.ok);
    } catch (e) {
      setPrinterOK(false);
    } finally {
      setCheckingPrinter(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    fetchBurgers();
    fetchDrinks(); // === BEBIDAS
    checkPrinter();
    const id = setInterval(checkPrinter, 15000); // refresco cada 15s
    return () => clearInterval(id);
  }, []);

  const shown = useMemo(() => {
    const t = search.trim().toLowerCase();
    return orders.filter(o => {
      const okStatus = statusFilter ? o.status === statusFilter : true;
      const okText =
        !t ||
        o.customer.toLowerCase().includes(t) ||
        String(o.id).includes(t) ||
        (o.notes || '').toLowerCase().includes(t);
      return okStatus && okText;
    });
  }, [orders, search, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm({
      type: 'delivery',
      customer: '',
      notes: '',
      burgerLines: [{ burgerId: '', qty: 1 }],
      // === BEBIDAS ===
      drinkLines: [{ drinkId: '', qty: 1 }],
      coffeeLines: [{ cafeId: '', qty: 1 }],
      sweetLines: [{ sweetId: '', qty: 1 }],
      autoPrint: true,
    });
    setOpen(true);
  }

  function openEdit(o) {
    setEditing(o);
    setForm({
      type: o.type,
      customer: o.customer,
      notes: o.notes || '',
      burgerLines: [{ burgerId: '', qty: 1 }], // dejamos un slot para agregar
      // === BEBIDAS ===
      drinkLines: [{ drinkId: '', qty: 1 }],
      coffeeLines: [{ cafeId: '', qty: 1 }],
      sweetLines: [{ sweetId: '', qty: 1 }],
      autoPrint: false, // al editar, por defecto no reimprime
    });
    setOpen(true);
  }

  // ---- Líneas dinámicas (burgers / bebidas / cafés / dulces) ----
  function addLine(kind) {
    setForm(s => {
      const map = {
        burgerLines: { burgerId: '', qty: 1 },
        // === BEBIDAS ===
        drinkLines: { drinkId: '', qty: 1 },
        coffeeLines: { cafeId: '', qty: 1 },
        sweetLines:  { sweetId: '', qty: 1 }
      };
      return { ...s, [kind]: [...s[kind], map[kind]] };
    });
  }
  function removeLine(kind, idx) {
    setForm(s => ({ ...s, [kind]: s[kind].filter((_, i) => i !== idx) }));
  }
  function changeLine(kind, idx, key, value) {
    setForm(s => {
      const arr = s[kind].map((ln, i) => i === idx ? { ...ln, [key]: value } : ln);
      return { ...s, [kind]: arr };
    });
  }

  // Convierte cafés/dulces a texto para Notas (las BEBIDAS ya son ítems reales)
  function extrasToText() {
    const cafeTxt = (form.coffeeLines || [])
      .filter(l => l.cafeId && Number(l.qty) > 0)
      .map(l => `${CAFES.find(c => c.id === l.cafeId)?.name} x${Number(l.qty)}`)
      .join(', ');
    const sweetTxt = (form.sweetLines || [])
      .filter(l => l.sweetId && Number(l.qty) > 0)
      .map(l => `${DULCES.find(d => d.id === l.sweetId)?.name} x${Number(l.qty)}`)
      .join(', ');

    const parts = [];
    if (cafeTxt)   parts.push(`Cafés: ${cafeTxt}`);
    if (sweetTxt)  parts.push(`Dulces: ${sweetTxt}`);
    return parts.join(' | ');
  }

  async function save(e) {
    e.preventDefault();

    // 1) Notas = notas libres + cafés/dulces (bebidas ya no van a notas)
    const extras = extrasToText();
    const notesCombined = [form.notes, extras].filter(Boolean).join(' | ').trim();

    // 2) Crear / actualizar pedido
    const payload = { cliente: form.customer, tipo: form.type, notas: notesCombined };

    try {
      let pedido;
      if (editing) {
        pedido = await apiPut(`/pedidos/${editing.id}`, payload);
      } else {
        pedido = await apiPost('/pedidos', payload);
      }

      // 3) Crear detalles (hamburguesas reales)
      const validBurgers = (form.burgerLines || []).filter(l => l.burgerId && Number(l.qty) > 0);
      for (const ln of validBurgers) {
        const qty = Math.max(1, Number(ln.qty || 1));
        await apiPost('/detalle-pedidos', {
          pedido_id: pedido.id,
          hamburguesa_id: Number(ln.burgerId),
          cantidad: qty,
        });
      }

      // 3b) === BEBIDAS: crear detalles reales ===
      const validDrinks = (form.drinkLines || []).filter(l => l.drinkId && Number(l.qty) > 0);
      for (const ln of validDrinks) {
        const qty = Math.max(1, Number(ln.qty || 1));
        await apiPost('/detalle-bebidas', {
          pedido_id: pedido.id,
          bebida_id: Number(ln.drinkId),
          cantidad: qty,
        });
      }

      // 4) 🔔 Impresión automática
      if (!editing && form.autoPrint) {
        try {
          await apiPost(`/pedidos/${pedido.id}/print`);
        } catch (e) {
          console.warn('No se pudo imprimir automáticamente:', e.message || e);
        }
      }

      setOpen(false);
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar el pedido.');
    }
  }

  async function remove(id) {
    if (!window.confirm('¿Eliminar este pedido?')) return;
    try {
      await apiDel(`/pedidos/${id}`);
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar.');
    }
  }

  async function advance(o) {
    try {
      await apiPatch(`/pedidos/${o.id}/next`);
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert('No se pudo actualizar el estado.');
    }
  }

  async function printOrder(id) {
    try {
      await apiPost(`/pedidos/${id}/print`); // ⬅️ endpoint de impresión
      alert('Enviado a cocina ✅');
    } catch (e) {
      console.error(e);
      alert('No se pudo imprimir.');
    }
  }

  return (
    <div className="lg:col-span-3">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Pedidos</h2>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${printerOK === null ? 'text-gray-500' : printerOK ? 'text-green-700' : 'text-red-700'}`}>
                {printerOK === null ? 'Chequeando impresora…'
                  : printerOK ? 'Impresora OK'
                  : 'Impresora OFF'}
              </span>
              <button
                onClick={checkPrinter}
                disabled={checkingPrinter}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {checkingPrinter ? 'Chequeando…' : 'Reintentar'}
              </button>
              <button
                onClick={openNew}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                + Nuevo pedido
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar pedidos…"
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e)=>setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="preparing">En preparación</option>
              <option value="served">Servido</option>
              <option value="paid">Pagado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-gray-500">Cargando pedidos…</div>
          ) : err ? (
            <div className="p-6 text-red-600">{err}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shown.map(o => (
                  <tr key={o.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{o.id}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{o.customer || '—'}</div>
                      {o.notes && (
                        <div className="text-xs text-gray-500 truncate max-w-[420px]">
                          {o.notes}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 capitalize">
                        {o.type === 'pedidosya' ? 'PedidosYa' : 'Delivery'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${o.status === 'pending'    ? 'bg-yellow-100 text-yellow-800' :
                          o.status === 'preparing' ? 'bg-blue-100 text-blue-800'   :
                          o.status === 'served'    ? 'bg-green-100 text-green-800' :
                                                     'bg-gray-100 text-gray-800' }`}>
                        {o.status === 'pending' ? 'Pendiente' :
                         o.status === 'preparing' ? 'En preparación' :
                         o.status === 'served' ? 'Servido' : 'Pagado'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {o.timeIn ? `${formatTime(o.timeIn)}` : '—'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {money.format(o.total || 0)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => openEdit(o)} className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button onClick={() => remove(o.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                      <button onClick={() => advance(o)} className="text-green-600 hover:text-green-900">Siguiente estado</button>
                      <button
                        onClick={() => printOrder(o.id)}
                        className={`text-orange-600 hover:text-orange-800 ${printerOK === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={printerOK === false}
                        title={printerOK === false ? 'Impresora no disponible' : 'Imprimir'}
                      >
                        Imprimir
                      </button>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td className="px-6 py-8 text-sm text-gray-500" colSpan="7">Sin resultados…</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? `Editar pedido #${editing.id}` : 'Nuevo pedido'}
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={save} className="p-6 space-y-6">

              {/* Tipo + Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={form.type}
                    onChange={e=>setForm(s=>({ ...s, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pedidosya">PedidosYa</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                  <input
                    type="text"
                    value={form.customer}
                    onChange={e=>setForm(s=>({ ...s, customer: e.target.value }))}
                    placeholder="Juan Pérez / Dirección"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* HAMBURGUESAS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Hamburguesas</h4>
                  <button type="button" onClick={()=>addLine('burgerLines')} className="text-sm text-blue-600 hover:text-blue-800">
                    + Agregar ítem
                  </button>
                </div>
                <div className="space-y-3">
                  {form.burgerLines.map((ln, idx) => (
                    <div key={`b-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8">
                        <select
                          value={ln.burgerId}
                          onChange={e=>changeLine('burgerLines', idx, 'burgerId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Sin hamburguesa —</option>
                          {burgers.map(b => (
                            <option key={b.id} value={b.id}>{b.name} ({money.format(b.price)})</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          min={1}
                          value={ln.qty}
                          onChange={e=>changeLine('burgerLines', idx, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={()=>removeLine('burgerLines', idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={form.burgerLines.length === 1}
                          title={form.burgerLines.length === 1 ? 'Debe quedar al menos una línea' : 'Quitar'}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BEBIDAS (debajo de hamburguesas) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Bebidas</h4>
                  <button
                    type="button"
                    onClick={()=>addLine('drinkLines')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Agregar bebida
                  </button>
                </div>
                <div className="space-y-3">
                  {form.drinkLines.map((ln, idx) => (
                    <div key={`drink-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8">
                        <select
                          value={ln.drinkId}
                          onChange={e=>changeLine('drinkLines', idx, 'drinkId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Sin bebida —</option>
                          {drinks.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.name}{d.price ? ` (${money.format(d.price)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          min={1}
                          value={ln.qty}
                          onChange={e=>changeLine('drinkLines', idx, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={()=>removeLine('drinkLines', idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={form.drinkLines.length === 1}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CAFÉS (a notas) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Cafés</h4>
                  <button type="button" onClick={()=>addLine('coffeeLines')} className="text-sm text-blue-600 hover:text-blue-800">
                    + Agregar café
                  </button>
                </div>
                <div className="space-y-3">
                  {form.coffeeLines.map((ln, idx) => (
                    <div key={`c-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8">
                        <select
                          value={ln.cafeId}
                          onChange={e=>changeLine('coffeeLines', idx, 'cafeId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Sin café —</option>
                          {CAFES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          min={1}
                          value={ln.qty}
                          onChange={e=>changeLine('coffeeLines', idx, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={()=>removeLine('coffeeLines', idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={form.coffeeLines.length === 1}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DULCES (a notas) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Dulces</h4>
                  <button type="button" onClick={()=>addLine('sweetLines')} className="text-sm text-blue-600 hover:text-blue-800">
                    + Agregar dulce
                  </button>
                </div>
                <div className="space-y-3">
                  {form.sweetLines.map((ln, idx) => (
                    <div key={`d-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-8">
                        <select
                          value={ln.sweetId}
                          onChange={e=>changeLine('sweetLines', idx, 'sweetId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Sin dulce —</option>
                          {DULCES.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="number"
                          min={1}
                          value={ln.qty}
                          onChange={e=>changeLine('sweetLines', idx, 'qty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center">
                        <button
                          type="button"
                          onClick={()=>removeLine('sweetLines', idx)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={form.sweetLines.length === 1}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas + AutoPrint */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={e=>setForm(s=>({ ...s, notes: e.target.value }))}
                    placeholder="Sin cebolla, extra queso, llamar al llegar, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-1 pt-6">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.autoPrint}
                      onChange={e=>setForm(s=>({ ...s, autoPrint: e.target.checked }))}
                      className="h-4 w-4 text-blue-600"
                    />
                    Imprimir automáticamente
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={()=>setOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
