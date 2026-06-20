import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';

/**
 * Lightbox — Full-screen image viewer with premium transitions.
 */
export function Lightbox({ images = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);

  const goPrev = useCallback(() => setIndex(i => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const goNext = useCallback(() => setIndex(i => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  if (!images.length) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#0a122a]/95 backdrop-blur-3xl cursor-zoom-out"
      />

      {/* Header Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 inset-x-0 z-10 p-6 flex items-center justify-between pointer-events-none"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-card/5 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto">
          <Camera size={14} className="text-primary" />
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/90">
            Gallery {index + 1} <span className="mx-1 opacity-20">/</span> {images.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-3.5 rounded-2xl bg-card/5 hover:bg-error/100/20 text-white/70 hover:text-rose-400 transition-all cursor-pointer border border-white/5 backdrop-blur-md pointer-events-auto group"
        >
          <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </motion.div>

      {/* Navigation Controls */}
      <AnimatePresence>
        {images.length > 1 && (
          <>
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={goPrev}
              className="absolute left-6 z-10 p-5 rounded-3xl bg-card/5 hover:bg-card/10 text-white transition-all cursor-pointer border border-white/10 shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 group"
            >
              <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={goNext}
              className="absolute right-6 z-10 p-5 rounded-3xl bg-card/5 hover:bg-card/10 text-white transition-all cursor-pointer border border-white/10 shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 group"
            >
              <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main Image View */}
      <div className="relative z-[1] w-full max-w-5xl px-6 md:px-12 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full aspect-[4/3] md:aspect-[16/9] flex items-center justify-center pointer-events-auto rounded-3xl overflow-hidden shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] border border-white/10 bg-black/40 backdrop-blur-xl"
          >
            <img
              src={images[index]}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-contain select-none"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-10 z-10 flex gap-4 px-6 py-4 rounded-3xl bg-card/5 backdrop-blur-2xl border border-white/10 max-w-[90vw] overflow-x-auto scrollbar-hide shadow-2xl shadow-black/50"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-500 cursor-pointer ${
                i === index 
                ? 'border-[#2A7E8C] scale-110 shadow-[0_0_20px_rgba(37,99,235,0.4)] rotate-0' 
                : 'border-white/5 opacity-30 hover:opacity-100 hover:scale-105 active:scale-90 -rotate-2 hover:rotate-0'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
