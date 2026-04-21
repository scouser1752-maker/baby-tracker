import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({
  title,
  value,
  subtitle,
  className,
}: {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={clsx('rounded-3xl border bg-slate-900/70 p-5 shadow-sm', className)}>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
