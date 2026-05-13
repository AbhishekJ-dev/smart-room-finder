import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({ label, prefix, type = 'text', className = '', error, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-secondary-text">{label}</label>
      )}
      <div className={`flex items-center gap-3 px-4 py-3 bg-background border rounded-xl transition-all focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 min-h-[44px] ${
        error ? 'border-[#FCA5A5] bg-[#FFF1F2]' : 'border-border'
      } ${className}`}>
        {prefix && (
          <span className="text-secondary-text shrink-0">{prefix}</span>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className="flex-1 bg-transparent outline-none text-sm text-main-text placeholder-[#9CA3AF] font-medium min-w-0"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="text-secondary-text hover:text-secondary-text transition-colors cursor-pointer shrink-0 p-0.5"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-error font-medium">{error}</p>}
    </div>
  );
}
