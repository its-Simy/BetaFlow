// components/FinanceToggle.tsx
import React from 'react';

interface FinanceToggleProps {
  checked: boolean;
  onChange: () => void;
}

export function FinanceToggle({ checked, onChange }: FinanceToggleProps) {
  return (
    <div className="flex justify-end items-center px-4 py-2">
      <label className="flex items-center gap-3 cursor-pointer">
        <span className="text-sm text-slate-400">Finance Only</span>
        <div
          onClick={onChange}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer
            ${checked ? 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300' : 'bg-gray-500 hover:bg-gray-600 focus:ring-2 focus:ring-gray-300'}
          `}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </div>
      </label>
    </div>
  );
}