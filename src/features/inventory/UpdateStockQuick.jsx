// src/features/inventory/UpdateStockQuick.jsx
import React, { useState } from 'react';
import { apiPut } from '../../api';

export default function UpdateStockQuick({ inventory, onUpdated }) {
  const [id, setId] = useState('');
  const [cantidad, setCantidad] = useState('');

  async function submit(e) {
    e.preventDefault();
    const _id = Number(id);
    const _cant = Number(cantidad);
    if (!_id || !_cant || _cant <= 0) return alert('Seleccioná item y cantidad válida');
    try {
      await apiPut(`/stock/${_id}`, { cantidad: _cant });
      setId('');
      setCantidad('');
      await onUpdated();
      alert('Stock actualizado');
    } catch {
      alert('Error al actualizar');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
        <select
          value={id}
          onChange={(e)=>setId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Seleccionar producto…</option>
          {inventory.map(i => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={(e)=>setCantidad(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="0"
        />
      </div>
      <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium">
        Actualizar Stock
      </button>
    </form>
  );
}
