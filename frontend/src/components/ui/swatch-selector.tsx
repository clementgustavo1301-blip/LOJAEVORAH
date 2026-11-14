'use client';

import React from 'react';
import { FinishType } from '@/types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SwatchSelectorProps {
  availableFinishes: FinishType[];
  selectedFinish: FinishType;
  onSelect: (finish: FinishType) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const FINISH_DETAILS: Record<FinishType, { label: string; short: string; background: string; description: string }> = {
  silver: {
    label: 'Prateado (Aço 316L)',
    short: 'Prata',
    background: 'bg-[#C8CCD0]',
    description: 'Aço cirúrgico 316L polido.',
  },
  gold: {
    label: 'Dourado (Ouro 18k)',
    short: 'Dourado',
    background: 'bg-[#D4AF37]',
    description: 'Banho em ouro 18k de alta durabilidade.',
  },
  black: {
    label: 'Preto (Titânio)',
    short: 'Preto',
    background: 'bg-[#1C1D1F]',
    description: 'Acabamento em titânio preto fosco.',
  },
  bicolor: {
    label: 'Bicolor',
    short: 'Bicolor',
    background: 'bg-[linear-gradient(135deg,#D4AF37_50%,#C8CCD0_50%)]',
    description: 'Combinação de aço prateado e dourado.',
  },
};

export function SwatchSelector({
  availableFinishes,
  selectedFinish,
  onSelect,
  size = 'md',
  showLabels = false,
}: SwatchSelectorProps) {
  const sizeStyles = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {availableFinishes.map((finish) => {
          const isSelected = selectedFinish === finish;
          const info = FINISH_DETAILS[finish];

          return (
            <button
              key={finish}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(finish);
              }}
              title={info.label}
              aria-label={`Selecionar acabamento ${info.label}`}
              className={twMerge(
                clsx(
                  'relative rounded-full transition-all duration-150 p-0.5 border flex items-center justify-center',
                  isSelected
                    ? 'border-brand-text scale-105 shadow-xs'
                    : 'border-transparent hover:border-brand-border'
                )
              )}
            >
              <span
                className={twMerge(
                  clsx(
                    'rounded-full block border border-black/25',
                    sizeStyles[size],
                    info.background
                  )
                )}
              />
            </button>
          );
        })}
      </div>
      {showLabels && (
        <span className="text-xs text-brand-textMuted tracking-wide">
          Acabamento: <strong className="text-brand-text font-semibold">{FINISH_DETAILS[selectedFinish]?.label}</strong>
        </span>
      )}
    </div>
  );
}
