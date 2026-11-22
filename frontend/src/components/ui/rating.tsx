import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  reviewsCount?: number;
  size?: 'sm' | 'md';
  showReviewsLabel?: boolean;
  className?: string;
}

export function Rating({
  rating,
  reviewsCount,
  size = 'sm',
  showReviewsLabel = false,
  className = '',
}: RatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const safeRating = Math.min(5, Math.max(0, Number.isFinite(rating) ? rating : 5));
  const roundedStars = Math.round(safeRating);
  const formattedRating = safeRating.toFixed(1);
  const hasReviews = typeof reviewsCount === 'number' && reviewsCount > 0;

  const starSize = size === 'sm' ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`.trim()}>
      <span className="sr-only">
        Avaliação {formattedRating} de 5 estrelas
        {hasReviews ? `, ${reviewsCount} avaliações` : ''}
      </span>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {stars.map((star) => (
          <Star
            key={star}
            strokeWidth={1.5}
            className={`${starSize} ${
              star <= roundedStars
                ? 'fill-brand-gold text-brand-gold'
                : 'fill-brand-border text-brand-border'
            }`}
          />
        ))}
      </div>
      <span className={`${textSize} text-brand-text font-medium tabular-nums`}>
        {formattedRating}
        {hasReviews && (
          <span className="text-brand-textMuted font-normal ml-1">
            ({reviewsCount}
            {showReviewsLabel
              ? reviewsCount === 1
                ? ' avaliação'
                : ' avaliações'
              : ''}
            )
          </span>
        )}
      </span>
    </div>
  );
}
