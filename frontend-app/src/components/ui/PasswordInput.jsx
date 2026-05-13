import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { validatePassword } from '../../utils/passwordValidation';

export function PasswordInput({ label, prefix, value, onChange, className = '', error, required = false, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const { isValid, errors, strength } = value ? validatePassword(value) : { isValid: false, errors: [], strength: 0 };

  // Strength colors
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthText = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-secondary-text">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`flex items-center gap-3 px-4 py-3 bg-background border rounded-xl transition-all focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 min-h-[44px] ${
        error ? 'border-[#FCA5A5] bg-[#FFF1F2]' : 'border-border'
      } ${className}`}>
        {prefix && (
          <span className="text-secondary-text shrink-0">{prefix}</span>
        )}
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="flex-1 bg-transparent outline-none text-sm text-main-text placeholder-[#9CA3AF] font-medium min-w-0"
          required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="text-secondary-text hover:text-secondary-text transition-colors cursor-pointer shrink-0 p-0.5"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      
      {/* Real-time Validation Feedback */}
      {value.length > 0 && (
        <div className="mt-2 space-y-2">
          {/* Strength Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1 h-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div 
                  key={level} 
                  className={`flex-1 rounded-full transition-colors duration-300 ${
                    strength >= level ? strengthColors[strength - 1] : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-secondary-text w-12 text-right">
              {strength > 0 ? strengthText[strength - 1] : ''}
            </span>
          </div>
          
          {/* Validation Requirements List */}
          <ul className="text-[11px] font-medium space-y-1">
            <li className={`flex items-center gap-1.5 ${value.length >= 8 ? 'text-green-600' : 'text-secondary-text'}`}>
               {value.length >= 8 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
               At least 8 characters
            </li>
            <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value) ? 'text-green-600' : 'text-secondary-text'}`}>
               {/[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[!@#$%^&*(),.?":{}|<>]/.test(value) ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
               Uppercase, lowercase, number, & special character
            </li>
          </ul>
        </div>
      )}

      {error && <p className="text-xs text-error font-medium">{error}</p>}
    </div>
  );
}
