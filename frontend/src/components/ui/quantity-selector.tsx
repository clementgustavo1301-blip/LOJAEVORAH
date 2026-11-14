'use client';

import React from 'react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
}: QuantitySelectorProps) {
  const height = size === 'sm' ? 'h-8' : 'h-9';
  const buttonWidth = size === 'sm' ? 'w-7' : 'w-8';

  return (
    <div
      className={`inline-flex items-center border border-brand-border bg-white select-none ${height}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`${buttonWidth} h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text hover:bg-brand-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium`}
        aria-label="Diminuir quantidade"
      >
        −
      </button>
      <span className="w-8 text-center text-xs font-medium text-brand-text tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`${buttonWidth} h-full flex items-center justify-center text-brand-textMuted hover:text-brand-text hover:bg-brand-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-medium`}
        aria-label="Aumentar quantidade"
      >
        +
      </button>
    </div>
  );
}
