import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';

export function BookingModal({ isOpen, onClose, room, onConfirm, loading, showAlert }) {
  const [durationValue, setDurationValue] = useState('');
  const [durationType, setDurationType] = useState('Months'); // 'Days', 'Weeks', 'Months', 'Years'
  const [startDate, setStartDate] = useState('');

  // Setup initial start date (today)
  useEffect(() => {
    if (isOpen) {
      setStartDate(new Date().toISOString().split('T')[0]);
      setDurationValue('');
      setDurationType('Months');
    }
  }, [isOpen]);

  // Determine available options
  const options = [];
  if (room) {
    if (parseFloat(room.price_daily) > 0) options.push('Days');
    if (parseFloat(room.price_weekly) > 0) options.push('Weeks');
    if (parseFloat(room.price_monthly) > 0) options.push('Months');
    if (parseFloat(room.annual_rent) > 0) options.push('Years');
    if (options.length === 0) options.push('Months'); // Fallback
  }

  // Ensure selected durationType is valid
  useEffect(() => {
    if (isOpen && options.length > 0 && !options.includes(durationType)) {
      setDurationType(options[options.length - 1]); // default to largest unit available
    }
  }, [isOpen, options, durationType]);

  if (!isOpen || !room) return null;

  const getPricePerUnit = () => {
    switch (durationType) {
      case 'Days': return parseFloat(room.price_daily) || 0;
      case 'Weeks': return parseFloat(room.price_weekly) || 0;
      case 'Months': return parseFloat(room.price_monthly) || 0;
      case 'Years': return parseFloat(room.annual_rent) || 0;
      default: return 0;
    }
  };

  const calculateTotal = () => {
    return (parseFloat(durationValue) || 0) * getPricePerUnit();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const durationNum = parseFloat(durationValue) || 0;
    if (durationNum < 1) {
       showAlert('Invalid Duration', 'Please enter a duration of 1 or more.', 'error');
       return;
    }
    const price = getPricePerUnit();
    if (price === 0) {
      showAlert('Pricing Missing', `The owner has not set a price for ${durationType}. Please select another option.`, 'error');
      return;
    }

    const durationStr = `${durationNum} ${durationType}`;
    
    // Auto calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    if (durationType === 'Days') end.setDate(end.getDate() + durationNum);
    else if (durationType === 'Weeks') end.setDate(end.getDate() + (durationNum * 7));
    else if (durationType === 'Months') end.setMonth(end.getMonth() + durationNum);
    else if (durationType === 'Years') end.setFullYear(end.getFullYear() + durationNum);

    onConfirm({
      duration: durationStr,
      total_price: calculateTotal(),
      start_date: startDate,
      end_date: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm cursor-pointer"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-card w-full max-w-md rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-main-text tracking-tight">Book Room</h2>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 bg-primary/5 inline-block px-2 py-0.5 rounded-md">
                {room.type} • {room.area}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-[#f9fafb] text-[#6b7280] rounded-2xl hover:bg-[#f3f4f6] hover:text-main-text transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Start Date */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#6b7280] mb-2 font-black pl-1">
                  Move-In Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]" size={18} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl py-4 pl-12 pr-4 text-sm text-main-text font-bold outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#6b7280] mb-2 font-black pl-1">
                  Duration
                </label>
                <div className="flex gap-3">
                  <div className="relative w-1/2">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280]" size={18} />
                    <input
                      type="number"
                      min="1"
                      value={durationValue}
                      placeholder={`Enter ${durationType.toLowerCase()}`}
                      onChange={(e) => setDurationValue(e.target.value)}
                      onFocus={() => {
                         if (durationValue === "1" || durationValue === 1) setDurationValue("");
                      }}
                      autoFocus
                      required
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl py-4 pl-12 pr-4 text-sm text-main-text font-bold outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="w-1/2">
                    <select
                      value={durationType}
                      onChange={(e) => setDurationType(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl py-4 px-4 text-sm text-main-text font-bold outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all cursor-pointer appearance-none"
                    >
                      {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Calculation */}
            <div className="bg-gradient-to-br from-[#4F46E5]/5 to-[#4F46E5]/10 rounded-2xl p-5 border border-[#4F46E5]/20 flex justify-between items-center mt-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">Total Price</p>
                <p className="text-[11px] text-[#6b7280] font-bold mt-1">₹{getPricePerUnit()?.toLocaleString() || 0} / {durationType.slice(0, -1).toLowerCase()}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-primary tracking-tight">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-black tracking-wider sm:tracking-widest uppercase transition-all flex items-center justify-center shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] cursor-pointer ${
                loading 
                  ? 'bg-primary/70 cursor-not-allowed text-white' 
                  : 'bg-primary hover:bg-primary-hover hover:-translate-y-0.5 active:scale-[0.98] text-white'
              }`}
            >
              {loading ? 'Processing Reserve...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
