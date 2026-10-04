import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-3', className)} {...props}>{children}</div>;
}

export function TabsList({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-cp-lg border border-stone-200/80 bg-stone-50 p-1', className)} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({ children, className, isActive, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-cp px-3 py-1.5 text-[13px] font-medium transition-all duration-cp',
        isActive
          ? 'bg-white text-stone-900 shadow-cp'
          : 'text-stone-400 hover:text-stone-600',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-3', className)} {...props}>{children}</div>;
}
