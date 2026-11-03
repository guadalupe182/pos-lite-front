import React from 'react';

type Accent = 'sky' | 'emerald' | 'amber' | 'rose';

type DashboardCardProps = {
  title: string;
  value: string | number;
  description?: string;
  accent?: Accent;
  icon?: React.ReactNode;
};

const accentClasses: Record<Accent, string> = {
  sky: 'border-sky-500 text-sky-500',
  emerald: 'border-emerald-500 text-emerald-500',
  amber: 'border-amber-500 text-amber-500',
  rose: 'border-rose-500 text-rose-500',
};

export default function DashboardCard({
  title,
  value,
  description,
  accent = 'sky',
  icon,
}: DashboardCardProps) {
  return (
    <div className={`rounded-lg border-l-4 bg-white p-6 shadow transition-shadow hover:shadow-lg ${accentClasses[accent].split(' ')[0]}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold text-gray-800">{value}</p>
          {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
        {icon && <div className={`shrink-0 ${accentClasses[accent].split(' ')[1]}`}>{icon}</div>}
      </div>
    </div>
  );
}
