import React, { useRef, useEffect, useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

const ROOM_TYPES = ['All', '1BHK', '2BHK', 'Room'];
const TENANT_TYPES = ['All', 'Boys', 'Girls', 'Anyone'];

export function FilterDropdown({ isOpen, onClose, filters, setters }) {
  const { typeFilter, tenantFilter, minPrice, maxPrice } = filters;
  const { setTypeFilter, setTenantFilter, setMinPrice, setMaxPrice } = setters;
  const ref = useRef(null);

  // Local string state so the user can freely clear and retype values
  const [minInput, setMinInput] = useState(String(minPrice));
  const [maxInput, setMaxInput] = useState(String(maxPrice));

  // Sync local state when external filters reset
  useEffect(() => {
    setMinInput(String(minPrice));
  }, [minPrice]);

  useEffect(() => {
    setMaxInput(String(maxPrice));
  }, [maxPrice]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasFilters = typeFilter !== 'All' || tenantFilter !== 'All' || minPrice !== 1000 || maxPrice !== 50000;

  const resetAll = () => {
    setTypeFilter('All');
    setTenantFilter('All');
    setMinPrice(1000);
    setMaxPrice(50000);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-[300px] bg-white border border-[#E2E8F0] rounded-2xl shadow-card overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1E293B]">
          <SlidersHorizontal size={15} className="text-[#2563EB]" />
          Filters
          {hasFilters && (
            <span className="w-5 h-5 bg-[#2563EB] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
              !
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={resetAll}
              className="text-xs text-[#DC2626] hover:underline font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Room Type */}
        <div>
          <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
            Room Type
          </label>
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Type */}
        <div>
          <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
            Suitable For
          </label>
          <div className="flex flex-wrap gap-2">
            {TENANT_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setTenantFilter(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  tenantFilter === type
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
            Price Range (₹/month)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#94A3B8] font-medium mb-1.5">Min Price</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus-within:border-[#2563EB] transition-colors">
                <span className="text-[#94A3B8] text-xs">₹</span>
                <input
                  type="number"
                  value={minInput}
                  onChange={e => setMinInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(minInput, 10);
                    const safe = isNaN(val) || val < 0 ? 0 : val;
                    setMinPrice(safe);
                    setMinInput(String(safe));
                  }}
                  className="bg-transparent outline-none text-xs text-[#1E293B] w-full font-medium"
                  placeholder="Min"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-[#94A3B8] font-medium mb-1.5">Max Price</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus-within:border-[#2563EB] transition-colors">
                <span className="text-[#94A3B8] text-xs">₹</span>
                <input
                  type="number"
                  value={maxInput}
                  onChange={e => setMaxInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(maxInput, 10);
                    const safe = isNaN(val) || val < 0 ? 50000 : val;
                    setMaxPrice(safe);
                    setMaxInput(String(safe));
                  }}
                  className="bg-transparent outline-none text-xs text-[#1E293B] w-full font-medium"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-xl hover:bg-[#1D4ED8] transition-colors cursor-pointer"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
