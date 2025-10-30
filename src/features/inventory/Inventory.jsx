// src/features/inventory/Inventory.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, apiPut, apiDel } from '../../api';
import UpdateStockQuick from './UpdateStockQuick';

export default function Inventory() {
  // Stock
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [errInv, setErrInv] = useState('');
  const [search, setSearch] = useState('');

  // Productos (hamburguesas) para el <select> de alta a existentes
  const [burgers, setBurgers] = useState([]);

  // Form para agregar stock a un producto existente
  const [formCreate, setFormCreate] = useState({ hamburguesa_id: '', cantidad: '' });

  // Form para crear producto por nombre + stock inicial
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState(''); // opcional; si no lo usás, queda en 0

  // Traer stock (el back manda item y cantidad)
  async function fetchInventory() {
    setLoadingInv(true);
    setErrInv('');
    try {
      const data = await apiGet('/stock'); // -> /api/stock
      const mapped = (Array.isArray(data) ? data : []).map(r => ({
        id: r.id,
        hamburguesa_id: r.hamburguesa_id,
        name: r.item,              // nombre amigable
        quantity: r.cantidad ?? 0, // cantidad
      }));
      setInventory(mapped);
    } catch (e) {
      console.error(e);
      setErrInv(`Error stock: ${e.message}`);
    } finally {
      setLoadingInv(false);
    }
  }

  // Traer productos para el <select> de alta a existentes
  async function fetchBurgers() {
    try {
      const data = await apiGet('/hamburguesas'); // -> /api/hamburguesas
      setBurgers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('No pude cargar productos', e);
      setBurgers([]);
    }
  }

  useEffect(() => { fetchInventory(); }, []);
  useEffect(() => { fetchBurgers(); }, []);

  // Filtro por texto (usa `search`)
  const filteredInv = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return inventory;
    return inventory.filter(i => (i.name || '').toLowerCase().includes(t));
  }, [inventory, search]);

  // Agregar stock a existente (ID + cantidad)
  async function handleCreate(e) {
    e.preventDefault();
    const hamburguesa_id = Number(formCreate.hamburguesa_id);
    const cantidad = Number(formCreate.cantidad);
    if (!hamburguesa_id || !cantidad || cantidad <= 0) return alert('Datos inválidos');
    try {
      await apiPost('/stock', { hamburguesa_id, cantidad });
      setFormCreate({ hamburguesa_id: '', cantidad: '' });
      await fetchInventory();
      alert('Stock agregado 👍');
    } catch {
      alert('Error al agregar stock');
    }
  }

  // Crear producto por nombre + stock inicial
  async function handleCreateNew(e) {
    e.preventDefault();
    const nombre = newName.trim();
    const cantidad = Number(newQty);
    const precio = Number(newPrice || 0);  // si no cargan precio, va 0
    if (!nombre || !Number.isFinite(cantidad) || cantidad <= 0) {
      return alert('Completá nombre y una cantidad válida');
    }
    if (!Number.isFinite(precio) || precio < 0) {
      return alert('El precio debe ser número ≥ 0');
    }

    try {
      await apiPost('/stock/by-name', { nombre, cantidad, precio });
      await Promise.all([fetchInventory(), fetchBurgers()]);
      setNewName('');
      setNewQty('');
      setNewPrice('');
      alert('Producto creado y stock cargado ✔️');
    } catch (e) {
      alert(`No se pudo crear/cargar stock: ${e.message}`);
    }
  }

  // Editar cantidad
  async function handleEditQty(id) {
    const current = inventory.find(i => i.id === id);
    const v = prompt(`Nueva cantidad para "${current?.name}" (actual: ${current?.quantity}):`);
    if (v === null) return;
    const cantidad = Number(v);
    if (!cantidad || cantidad <= 0) return alert('Cantidad inválida');
    try {
      await apiPut(`/stock/${id}`, { cantidad });
      await fetchInventory();
    } catch {
      alert('Error al editar cantidad');
    }
  }

  // Eliminar
  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este item de stock?')) return;
    try {
      await apiDel(`/stock/${id}`);
      await fetchInventory();
    } catch {
      alert('Error al eliminar stock');
    }
  }

  return (
    <>
      {/* Panel principal */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Gestión de Inventario</h2>

            {/* Formularios + buscador */}
            <div className="mt-4 space-y-3">
              {/* A) Agregar stock a producto EXISTENTE */}
              <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
                <select
                  value={formCreate.hamburguesa_id}
                  onChange={(e)=>setFormCreate(s=>({...s, hamburguesa_id: e.target.value}))}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar producto…</option>
                  {burgers.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre || b.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={formCreate.cantidad}
                  onChange={(e)=>setFormCreate(s=>({...s, cantidad: e.target.value}))}
                  placeholder="cantidad"
                  className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />

                <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                  + Agregar
                </button>
              </form>

              {/* B) Crear producto NUEVO por nombre + stock inicial */}
              <form onSubmit={handleCreateNew} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e)=>setNewName(e.target.value)}
                  placeholder='Nombre nuevo (ej: "Tomate")'
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  min="1"
                  value={newQty}
                  onChange={(e)=>setNewQty(e.target.value)}
                  placeholder="stock inicial"
                  className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
                {/* (opcional) precio:
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e)=>setNewPrice(e.target.value)}
                  placeholder="precio (opcional)"
                  className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-lg"
                /> */}
                <button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                  + Crear y cargar
                </button>
              </form>

              {/* C) Buscador */}
              <div className="pt-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos…"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            {loadingInv ? (
              <div className="p-6 text-gray-500">Cargando stock…</div>
            ) : errInv ? (
              <div className="p-6 text-red-600">{errInv}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInv.map(item => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name || `Item #${item.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={()=>handleEditQty(item.id)} className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                        <button onClick={()=>handleDelete(item.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {filteredInv.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-sm text-gray-500" colSpan="3">Sin resultados…</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actualizar Stock</h3>
          <UpdateStockQuick
            inventory={inventory}
            onUpdated={fetchInventory}
          />
        </div>

        {/* Alertas “mock” */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600">⚠️</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Tomates: Stock crítico</p>
                <p className="text-xs text-red-600">Solo quedan 2 kg</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-600">🧀</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Queso: Stock bajo</p>
                <p className="text-xs text-yellow-600">Quedan 5 unidades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
