import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'new' | 'bestseller' | 'offer' | 'sale' | 'material' | 'default' | 'silver' | 'gold' | 'black' | 'bicolor' | 'success';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-brand-elevated text-brand-text border-brand-border',
    new: 'bg-brand-text text-white border-brand-text font-medium',
    bestseller: 'bg-white text-brand-text border-brand-border font-medium shadow-xs',
    offer: 'bg-brand-text text-white border-brand-text font-medium',
    sale: 'bg-red-50 text-red-700 border-red-200',
    material: 'bg-brand-elevated text-brand-text border-brand-border',
    silver: 'bg-brand-elevated text-brand-text border-brand-border',
    gold: 'bg-amber-50 text-amber-800 border-amber-200',
    black: 'bg-brand-text text-white border-brand-text',
    bicolor: 'bg-brand-text text-white border-brand-text',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 text-xs border font-medium select-none rounded-sm leading-tight',
          styles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
