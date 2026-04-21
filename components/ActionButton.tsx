'use client';

import { ReactNode, useState } from 'react';

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
}: {
  children: ReactNode;
  onClick: () => Promise<void> | void;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const [loading, setLoading] = useState(false);

  const palette = {
    primary: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    secondary: 'bg-slate-800 text-white hover:bg-slate-700',
    danger: 'bg-rose-500 text-white hover:bg-rose-400',
  };

  return (
    <button
      className={`min-h-16 rounded-3xl px-5 py-4 text-left text-lg font-medium transition disabled:opacity-60 ${palette[variant]}`}
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true);
          await onClick();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? 'Сохраняю…' : children}
    </button>
  );
}
