import React from 'react';
import Link from 'next/link';

interface LogoProps {
  variant?: 'horizontal' | 'vertical' | 'symbol';
  color?: 'white' | 'black' | 'silver' | 'gold';
  className?: string;
}

/**
 * Vector reproduction of the official EVORAH — EXPERIENCE — brand mark
 * (E V O R Λ H wordmark + flanked EXPERIENCE subtitle in brushed gold #C9A452).
 */
export function Logo({
  variant = 'horizontal',
  color = 'black',
  className = '',
}: LogoProps) {
  const mainStroke =
    color === 'white'
      ? '#FFFFFF'
      : color === 'silver'
      ? '#A3A7AE'
      : '#C9A452';

  const subColor =
    color === 'white'
      ? '#C9A452'
      : color === 'black'
      ? '#0A0A0A'
      : '#C9A452';

  if (variant === 'symbol') {
    return (
      <Link
        href="/"
        className={`inline-flex items-center select-none group ${className}`}
        aria-label="EVORAH Experience - Página inicial"
      >
        <svg
          viewBox="0 0 44 36"
          className="h-6 w-auto transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Stylized Λ (A) from EVORAH */}
          <path
            d="M4 32L22 4L40 32"
            stroke="#C9A452"
            strokeWidth="3.6"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex flex-col items-center select-none group ${className}`}
      aria-label="EVORAH Experience - Página inicial"
    >
      <svg
        viewBox="0 0 360 76"
        className={
          variant === 'vertical'
            ? 'h-12 sm:h-14 w-auto'
            : 'h-9 sm:h-10 w-auto'
        }
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="EVORAH Experience"
      >
        {/* E */}
        <path
          d="M18 10H52M18 10V44M18 27H46M18 44H52"
          stroke={mainStroke}
          strokeWidth="4.2"
          strokeLinecap="square"
        />

        {/* V */}
        <path
          d="M74 10L94 44L114 10"
          stroke={mainStroke}
          strokeWidth="4.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* O */}
        <ellipse
          cx="154"
          cy="27"
          rx="18"
          ry="17"
          stroke={mainStroke}
          strokeWidth="4.2"
        />

        {/* R (signature open inner bar + diagonal leg) */}
        <path
          d="M198 44V10H220C226.5 10 231 14 231 19.5C231 25 226.5 29 220 29H208L229 44"
          stroke={mainStroke}
          strokeWidth="4.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* Λ (stylized A without crossbar) */}
        <path
          d="M254 44L274 10L294 44"
          stroke={mainStroke}
          strokeWidth="4.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        {/* H */}
        <path
          d="M316 10V44M346 10V44M316 27H346"
          stroke={mainStroke}
          strokeWidth="4.2"
          strokeLinecap="square"
        />

        {/* Left flanking line */}
        <line
          x1="18"
          y1="64"
          x2="104"
          y2="64"
          stroke="#C9A452"
          strokeWidth="1.2"
        />

        {/* E X P E R I E N C E */}
        <text
          x="182"
          y="67.5"
          textAnchor="middle"
          fill={subColor}
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.45em"
          style={{ fontFamily: 'var(--font-manrope), sans-serif' }}
        >
          EXPERIENCE
        </text>

        {/* Right flanking line */}
        <line
          x1="260"
          y1="64"
          x2="346"
          y2="64"
          stroke="#C9A452"
          strokeWidth="1.2"
        />
      </svg>
    </Link>
  );
}
