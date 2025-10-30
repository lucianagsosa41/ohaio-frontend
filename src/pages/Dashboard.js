// src/pages/Dashboard.jsx (o donde lo tengas)
import React, { useState } from 'react';
import TabBtn from '../components/TabBtn';
import Inventory from '../features/inventory/Inventory';
import Orders from '../features/orders/Orders';
import Stats from '../features/stats/Stats';

export default function Dashboard() {
  const [tab, setTab] = useState('inventory');

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl">🍽️</div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">Sistema de Inventario</h1>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Personal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">👨‍🍳 Juan Pérez</span>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <TabBtn active={tab==='inventory'} onClick={()=>setTab('inventory')}>📦 Inventario</TabBtn>
            <TabBtn active={tab==='orders'} onClick={()=>setTab('orders')}>🍽️ Pedidos</TabBtn>
            <TabBtn active={tab==='stats'} onClick={()=>setTab('stats')}>📊 Estadísticas</TabBtn>
            <TabBtn active={tab==='costs'} onClick={()=>setTab('costs')}>💰 Costos</TabBtn>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tab === 'inventory' && <Inventory />}

        {tab === 'orders' && <Orders />}

        {tab === 'stats' && (
          // Stats ya trae sus tarjetas + gráficos + tablas
          <div className="lg:col-span-3">
            <Stats />
          </div>
        )}

        {tab === 'costs' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-500">
            (Acá va la gestión de costos; cuando tengas modelo/tabla lo conectamos)
          </div>
        )}
      </div>
    </div>
  );
}
