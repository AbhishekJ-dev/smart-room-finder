import React from 'react';

export function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-soft transition-all duration-300 ${
        hover ? 'hover:shadow-card-hover hover:-translate-y-1 hover:border-[#BFDBFE]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-soft flex flex-col items-center text-center hover:shadow-card-hover transition-all duration-300">
      {icon && (
        <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center text-[#2563EB] mb-4">
          {icon}
        </div>
      )}
      <p className="text-2xl font-extrabold text-[#1E293B]">{value}</p>
      <p className="text-xs text-[#64748B] font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
