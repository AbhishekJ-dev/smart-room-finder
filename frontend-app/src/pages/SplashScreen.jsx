import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import logo from '../assets/logo.png';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate automatically after 1.5 seconds (1500ms)
    const timer = setTimeout(() => {
      navigate('/home', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#111827] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: "easeOut"
        }}
        className="flex flex-col items-center text-center px-4"
      >
        <div className="w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] bg-black/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center mb-10 overflow-hidden group">
          <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover animate-float" />
        </div>
        
        <p className="text-[#9CA3AF] text-sm sm:text-lg font-bold tracking-[0.3em] uppercase drop-shadow-sm opacity-80">
          Find your room smartly
        </p>
      </motion.div>
    </div>
  );
}
