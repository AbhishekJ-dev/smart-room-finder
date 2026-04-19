import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export function AuthLayout({ children, title, subtitle }) {
  const [stats, setStats] = useState({
    happyTenants: 0,
    liveListings: 0,
    avgRating: '4.9'
  });

  useEffect(() => {
    axios.get(`${API}/stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error('Stats fetch error:', err));
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* 
        LEFT SECTION (BRANDING) 
        Mobile/Tablet: Top alignment
        Desktop: 50% split alignment
      */}
      <div 
        className="w-full lg:w-1/2 flex flex-col justify-between items-center bg-slate-900 p-8 md:p-12 lg:p-16 text-center shadow-lg lg:shadow-2xl z-10"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #172554 40%, #1e3a8a 100%)' }}
      >
        {/* Logo Container */}
        <Link to="/" className="mb-6 hover:scale-105 transition-transform duration-300">
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center overflow-hidden rounded-[1.5rem] shadow-xl border border-white/10 bg-white/5">
            <img src={logo} alt="SmartRoom Finder Logo" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* Branding Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full flex-1 flex flex-col justify-center mb-6"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 lg:mb-6 leading-tight tracking-tight">
            Find Your <span className="text-blue-400">Perfect Home</span> Smartly.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base lg:text-lg font-medium leading-relaxed">
            Browse thousands of verified rooms across India. No brokers, no hidden fees. Just seamless booking.
          </p>
        </motion.div>

        {/* Responsive Stats */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-700 pt-6 mt-auto">
           {[
              { value: stats.happyTenants === 0 ? '10+' : `${stats.happyTenants}+`, label: 'Happy Tenants', color: 'text-blue-400' },
              { value: stats.liveListings || '50+', label: 'Live Listings', color: 'text-emerald-400' },
              { value: `${stats.avgRating}★`, label: 'Avg Rating', color: 'text-amber-400' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl backdrop-blur bg-white/5 border border-white/10 shadow-sm">
                <span className={`text-xl sm:text-2xl font-black ${stat.color} mb-1 drop-shadow-sm`}>{stat.value}</span>
                <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider text-center">{stat.label}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 
        RIGHT SECTION (FORM) 
        Mobile/Tablet: Bottom alignment 
        Desktop: 50% split alignment 
      */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-10 px-6 sm:p-10 lg:p-16 bg-slate-50 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-slate-200/60"
        >
          {/* Form Header */}
          <div className="text-center mb-8">
            {title && <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 drop-shadow-sm">{title}</h1>}
            {subtitle && <p className="text-slate-500 text-sm sm:text-base font-medium">{subtitle}</p>}
          </div>

          {/* Children Inject (Inputs and Buttons) */}
          <div className="w-full">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
