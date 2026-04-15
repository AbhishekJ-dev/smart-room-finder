import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const RatingModal = ({ isOpen, onClose, bookingId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/bookings/${bookingId}/rate`, 
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Rating submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1E293B]/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#EF4444] transition-colors"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="rating-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 bg-[#EFF6FF] text-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star size={32} className="fill-current" />
              </div>
              
              <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Rate Your Experience</h3>
              <p className="text-[#64748B] text-sm mb-8 leading-relaxed">
                How would you rate your booking experience? Your feedback helps us improve.
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${
                        star <= (hover || rating)
                          ? 'text-[#F59E0B] fill-[#F59E0B]'
                          : 'text-[#E2E8F0] fill-none'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || loading}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
                  rating === 0 || loading
                    ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed shadow-none'
                    : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-blue/20'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6"
            >
              <div className="w-16 h-16 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-[#1E293B] mb-2">Thank You!</h3>
              <p className="text-[#64748B] text-sm">Your feedback has been recorded.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RatingModal;
