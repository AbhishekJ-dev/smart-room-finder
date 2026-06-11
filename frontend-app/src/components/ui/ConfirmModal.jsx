import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Info } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      icon: <Trash2 size={24} className="text-error" />,
      bg: "bg-error/10",
      btn: "bg-error/100 hover:bg-rose-600 shadow-rose-200",
      accent: "border-error/20"
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-warning" />,
      bg: "bg-warning/10",
      btn: "bg-warning/100 hover:bg-amber-600 shadow-amber-200",
      accent: "border-warning/20"
    },
    info: {
      icon: <Info size={24} className="text-blue-500" />,
      bg: "bg-blue-50",
      btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-200",
      accent: "border-blue-100"
    }
  };

  const theme = themes[type] || themes.info;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#111827]/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-sm bg-card rounded-[28px] shadow-2xl border border-border overflow-hidden z-10"
        >
          {/* Top accent bar */}
          <div className={`h-1.5 w-full ${type === 'danger' ? 'bg-error/100' : type === 'warning' ? 'bg-warning/100' : 'bg-blue-500'}`} />

          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 ${theme.bg} rounded-2xl flex items-center justify-center mb-5 border ${theme.accent}`}>
                {theme.icon}
              </div>
              
              <h3 className="text-xl font-black text-main-text mb-2 leading-tight">
                {title}
              </h3>
              
              <p className="text-sm text-secondary-text font-medium leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 bg-section hover:bg-[#E5E7EB] text-secondary-text font-bold rounded-2xl transition-all active:scale-95 cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3.5 px-4 text-white font-bold rounded-2xl transition-all active:scale-95 cursor-pointer shadow-lg ${theme.btn}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-secondary-text hover:text-main-text hover:bg-section rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmModal;
