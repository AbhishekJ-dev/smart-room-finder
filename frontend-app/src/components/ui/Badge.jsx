import React from 'react';

const VARIANTS = {
  blue:    'badge-blue',
  green:   'badge-green',
  emerald: 'badge-green',
  amber:   'badge-amber',
  red:     'badge-red',
  rose:    'badge-red',
  purple:  'badge-purple',
  neutral: 'badge-neutral',
};

export function Badge({ variant = 'neutral', children, className = '' }) {
  const cls = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span className={`badge ${cls} ${className}`}>
      {children}
    </span>
  );
}
