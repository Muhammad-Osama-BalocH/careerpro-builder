'use client';

import { motion, AnimatePresence } from 'motion/react';

export function CollapsibleSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border transition-all ${open ? 'border-indigo-100 bg-white shadow-lg shadow-indigo-100/20' : 'border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-sm'}`}>
      <button 
        type="button" 
        onClick={onToggle} 
        className="flex w-full items-center justify-between px-8 py-6 text-left"
      >
        <span className="text-base font-bold text-slate-800">{title}</span>
        <motion.span 
          animate={{ rotate: open ? 180 : 0 }}
          className="text-slate-300"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-50 px-8 pb-8 pt-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
