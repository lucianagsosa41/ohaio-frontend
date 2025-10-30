import React from 'react';

export default function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 py-2 px-2 text-sm font-medium ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}
