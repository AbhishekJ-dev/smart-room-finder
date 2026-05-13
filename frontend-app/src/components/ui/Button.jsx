import React from 'react';

export function Button({
  children,
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm px-5 py-3 active:scale-[0.97]';

  const variants = {
    primary:   'bg-primary text-white hover:bg-primary-hover shadow-blue hover:shadow-lg',
    secondary: 'bg-background text-main-text border border-border hover:bg-section hover:border-[#CBD5E1]',
    danger:    'bg-[#FFF1F2] text-error border border-[#FECDD3] hover:bg-[#FECDD3]',
    ghost:     'text-secondary-text hover:bg-section hover:text-main-text',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Processing…</span>
        </>
      ) : children}
    </button>
  );
}
