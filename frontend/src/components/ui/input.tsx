'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[10px] font-semibold tracking-[0.08em] uppercase text-brand-textMuted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full h-9 px-3 bg-white text-brand-text text-[12px] placeholder:text-brand-textMuted/70 border transition-all duration-150 outline-none rounded-md',
                error
                  ? 'border-red-500 focus:border-red-500 bg-red-50'
                  : 'border-brand-border hover:border-brand-text/30 focus:border-brand-text focus:shadow-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-brand-background',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
        {!error && helperText && (
          <span className="text-[10px] text-brand-textMuted font-light">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
