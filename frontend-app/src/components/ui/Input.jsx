import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({ label, prefix, type = 'text', className = '', error, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-[#374151]">{label}</label>
      )}
      <div className={`flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] border rounded-xl transition-all focus-within:border-[#2563EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2563EB]/10 ${
        error ? 'border-[#FCA5A5] bg-[#FFF1F2]' : 'border-[#E2E8F0]'
      } ${className}`}>
        {prefix && (
          <span className="text-[#94A3B8] shrink-0">{prefix}</span>
        )}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className="flex-1 bg-transparent outline-none text-sm text-[#1E293B] placeholder-[#94A3B8] font-medium min-w-0"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="text-[#94A3B8] hover:text-[#64748B] transition-colors cursor-pointer shrink-0 p-0.5"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
    </div>
  );
}
