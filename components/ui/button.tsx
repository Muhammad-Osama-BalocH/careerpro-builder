import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { PressScale } from '@/lib/motion';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-cp text-[13px] font-medium transition-all duration-cp ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'bg-stone-900 text-white shadow-cp hover:bg-stone-800',
        secondary:
          'bg-stone-100 text-stone-800 hover:bg-stone-200/80',
        outline:
          'border border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50',
        ghost:
          'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
        ai:
          'border border-amber-200/80 bg-amber-50/60 text-amber-800 hover:border-amber-300 hover:bg-amber-100/70',
        destructive:
          'border border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <PressScale>
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    </PressScale>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
