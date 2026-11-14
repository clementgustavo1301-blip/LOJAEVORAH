import React from 'react';

export type CategoryIconName =
  | 'correntes'
  | 'aneis'
  | 'pulseiras'
  | 'pingentes'
  | 'cordoes'
  | 'brincos';

const PATHS: Record<CategoryIconName, React.ReactNode> = {
  correntes: (
    <>
      <ellipse cx="14" cy="34" rx="7.5" ry="4" transform="rotate(-45 14 34)" />
      <ellipse cx="24" cy="24" rx="7.5" ry="4" transform="rotate(45 24 24)" />
      <ellipse cx="34" cy="14" rx="7.5" ry="4" transform="rotate(-45 34 14)" />
    </>
  ),
  aneis: (
    <>
      <circle cx="24" cy="30" r="11" />
      <circle cx="24" cy="30" r="8.5" />
      <path d="M19 14.5 22 10.5h4l3 4-5 4.5z" />
      <path d="M19 14.5h10" />
    </>
  ),
  pulseiras: (
    <>
      <ellipse cx="24" cy="22" rx="16" ry="7.5" />
      <path d="M8 22v4.5c0 4.1 7.2 7.5 16 7.5s16-3.4 16-7.5V22" />
      <path d="M14 33v-4.5M24 34.5V30M34 33v-4.5" />
    </>
  ),
  pingentes: (
    <>
      <path d="M10 7l12.6 14.6M38 7 25.4 21.6" />
      <circle cx="24" cy="23" r="1.8" />
      <path d="M24 25v16M19 30.5h10" />
    </>
  ),
  cordoes: (
    <>
      <path d="M9 7c0 15 6.5 26 15 26s15-11 15-26" />
      <path d="M13 7c0 12.5 5 21.5 11 21.5S35 19.5 35 7" />
      <path d="M11 12l2.5-1M12.5 19l2.6-.6M15.6 25.4l2.3-1.3M20.4 30l1.4-2.2M27.6 30l-1.4-2.2M32.4 25.4l-2.3-1.3M35.5 19l-2.6-.6M37 12l-2.5-1" />
    </>
  ),
  brincos: (
    <>
      <circle cx="15" cy="13" r="1.8" />
      <circle cx="33" cy="13" r="1.8" />
      <path d="M15 14.8V19M33 14.8V19" />
      <circle cx="15" cy="27" r="8" />
      <circle cx="33" cy="27" r="8" />
    </>
  ),
};

interface CategoryIconProps {
  name: CategoryIconName;
  className?: string;
}

export function CategoryIcon({ name, className = '' }: CategoryIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
