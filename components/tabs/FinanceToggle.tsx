// components/FinanceToggle.tsx
import React from 'react';

interface FinanceToggleProps {
  checked: boolean;
  onChange: () => void;
}

export function FinanceToggle({ checked, onChange }: FinanceToggleProps) {
  return (
    <div className="flex justify-end items-center px-4 py-2">
      <label className="flex items-center gap-2 text-sm text-slate-500">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="accent-purple-600"
        />
        Finance Only
      </label>
    </div>
  );
}