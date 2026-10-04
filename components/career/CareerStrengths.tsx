'use client';

import { motion } from 'motion/react';

interface CareerStrengthsProps {
  strengths: Array<{ text: string; detail?: string }>;
}

export function CareerStrengths({ strengths }: CareerStrengthsProps) {
  if (strengths.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-medium text-slate-500">No strengths identified yet.</p>
        <p className="mt-1 text-xs text-slate-400">Add portfolio data to discover your strengths.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {strengths.map((s, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm"
        >
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
            ✓
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">{s.text}</p>
            {s.detail && <p className="mt-1 text-xs leading-relaxed text-emerald-700/80">{s.detail}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
