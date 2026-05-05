import React from 'react';

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-soft transition-all duration-300 ${
        hover ? 'hover:shadow-card-hover hover:-translate-y-1 hover:border-[#C7D2FE]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-soft flex flex-col items-center text-center hover:shadow-card-hover transition-all duration-300">
      {icon && (
        <div className="w-12 h-12 bg-[#EEF2FF] rounded-xl flex items-center justify-center text-[#4F46E5] mb-4">
          {icon}
        </div>
      )}
      <p className="text-2xl font-extrabold text-[#111827]">{value}</p>
      <p className="text-xs text-[#6B7280] font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
