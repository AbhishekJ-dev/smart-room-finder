import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const StatusModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' // 'success' | 'error' | 'info'
}) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={32} />,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      barColor: 'bg-emerald-500'
    },
    error: {
      icon: <AlertCircle size={32} />,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      barColor: 'bg-rose-500'
    },
    info: {
      icon: <Info size={32} />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      barColor: 'bg-blue-500'
    }
  };

  const { icon, color, bgColor, borderColor, barColor } = config[type] || config.info;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
        >
          {/* Top Progress Bar Decoration */}
          <div className={`h-1.5 w-full ${barColor} opacity-80`} />
          
          <div className="p-8 flex flex-col items-center text-center">
            {/* Status Icon */}
            <div className={`w-16 h-16 rounded-2xl ${bgColor} ${color} flex items-center justify-center mb-6 shadow-sm`}>
              {icon}
            </div>

            {/* Content */}
            <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
              {message}
            </p>

            {/* Action Button */}
            <button 
              onClick={onClose}
              className={`w-full py-4 text-sm font-black uppercase tracking-widest text-white rounded-2xl transition-all active:scale-95 shadow-lg cursor-pointer ${barColor} hover:brightness-110`}
            >
              Got it
            </button>
          </div>

          {/* Close Button (Icon) */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatusModal;
