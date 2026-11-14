'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'black' | 'white' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold tracking-[0.1em] uppercase transition-all duration-200 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'h-7 px-3 text-[10px] rounded-md',
      md: 'h-8.5 h-[34px] px-4 text-[10.5px] rounded-md',
      lg: 'h-10 px-5 text-[11px] rounded-md',
    };

    const variantStyles = {
      primary:
        'bg-brand-text text-white hover:bg-brand-text/90 active:bg-brand-text/80 shadow-sm hover:shadow-md',
      secondary:
        'bg-brand-background text-brand-text hover:bg-brand-elevated border border-brand-border hover:border-brand-text/30',
      outline:
        'bg-transparent text-brand-text border border-brand-border hover:border-brand-text hover:bg-brand-background',
      ghost:
        'bg-transparent text-brand-textMuted hover:text-brand-text hover:bg-brand-background border border-transparent',
      black:
        'bg-brand-text text-white hover:bg-brand-text/90',
      white:
        'bg-white text-brand-text hover:bg-brand-background border border-brand-border shadow-sm',
      gold:
        'bg-[#C9A227] text-white hover:bg-[#B3901B] font-semibold border border-[#C9A227]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>CARREGANDO...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
