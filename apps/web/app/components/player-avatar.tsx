'use client';

import { useState } from 'react';

interface PlayerAvatarProps {
  name: string;
  imageUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 sm:h-28 sm:w-28 text-2xl sm:text-3xl',
};

export function PlayerAvatar({ name, imageUrl, size = 'md' }: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2);

  const shouldShowImage = imageUrl && !imageError;

  return (
    <>
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`shrink-0 rounded-full border-4 border-ink-800 object-cover shadow-lg ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full border-4 border-ink-800 bg-ink-900 font-display font-extrabold text-white shadow-lg ${sizeClasses[size]}`}
        >
          {initials}
        </div>
      )}
    </>
  );
}
