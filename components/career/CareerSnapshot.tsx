'use client';

import { StaggerList, StaggerItem, HoverLift } from '@/lib/motion';

interface StatCardProps {
  label: string;
  value: string;
  accent: 'indigo' | 'emerald' | 'blue' | 'amber' | 'violet';
}

export function CareerSnapshot({ stats }: { stats: Array<{ label: string; value: string; accent: StatCardProps['accent'] }> }) {
  return (
    <StaggerList className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <StaggerItem key={stat.label}>
          <HoverLift>
            <StatCard {...stat} />
          </HoverLift>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentStyles = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm bg-white`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accentStyles[accent].split(' ')[1]}`}>{value}</p>
    </div>
  );
}
