'use client';

import { motion } from 'motion/react';

interface CareerJourneyProps {
  steps: Array<{
    label: string;
    icon: string;
    active: boolean;
  }>;
}

export function CareerJourney({ steps }: CareerJourneyProps) {
  return (
    <div className="relative">
      {/* Connector Line (Desktop) */}
      <div className="absolute left-0 top-1/2 hidden h-0.5 w-full -translate-y-1/2 bg-slate-100 sm:block" />
      
      <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-between sm:gap-2">
        {steps.map((step, i) => (
          <motion.div 
            key={step.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative z-10 flex flex-1 items-center gap-0 sm:block sm:text-center"
          >
            <div className={`flex flex-1 items-center gap-2.5 rounded-xl border px-4 py-3 shadow-sm transition-all sm:mx-auto sm:h-20 sm:w-20 sm:flex-col sm:justify-center sm:gap-1.5 sm:px-1 sm:py-0 ${
              step.active 
                ? 'border-indigo-200 bg-indigo-50 shadow-indigo-100/50' 
                : 'border-slate-100 bg-white'
            }`}>
              <span className="text-xl sm:text-2xl">{step.icon}</span>
              <span className={`text-xs font-bold leading-tight ${step.active ? 'text-indigo-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {step.active && (
                <motion.div 
                  layoutId="active-glow"
                  className="absolute inset-0 -z-10 rounded-xl bg-indigo-500/5 blur-sm"
                />
              )}
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 text-slate-300 sm:hidden">→</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
