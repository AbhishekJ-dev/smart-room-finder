import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Star, Shield, Zap, Home, CheckCircle } from 'lucide-react';
import axios from 'axios';
import logo from '../../assets/logo.png';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export function AuthLayout({ children, title, subtitle }) {
  const [stats, setStats] = React.useState({
    happyTenants: 0,
    liveListings: 0,
    avgRating: '4.9'
  });

  React.useEffect(() => {
    axios.get(`${API}/stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error('Stats fetch error in AuthLayout:', err));
  }, []);

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">

      {/* ══════════════════════════════════
          LEFT BRAND PANEL (Desktop Only)
          ══════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.15)] z-20"
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #172554 40%, #1e3a8a 100%)'
        }}
      >
        {/* Animated Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-40 animate-pulse mix-blend-screen pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 60%)', animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] rounded-full opacity-30 animate-pulse mix-blend-screen pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 60%)', animationDelay: '2s', animationDuration: '5s' }} />



        {/* Diagonal Light Beam */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
           style={{
             background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
           }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Link to="/" className="flex flex-col items-center gap-6 group">
            <div className="w-28 h-28 xl:w-36 xl:h-36 flex items-center justify-center overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/10 group-hover:scale-105 transition-transform duration-500">
              <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
            </div>
          </Link>

          {/* Hero Text */}
          <div className="mt-auto mb-20 flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >

              <h2 className="text-5xl xl:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">
                Find Your<br />
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(90deg, #60A5FA 0%, #34D399 70%, #FBBF24 100%)'
                }}>
                  Perfect Home
                </span>
                <br />Smartly.
              </h2>
              <p className="text-[#94a3b8] text-lg leading-relaxed max-w-md font-medium text-shadow-sm">
                Browse thousands of verified rooms across India. No brokers, no hidden fees. Just seamless booking with real owners.
              </p>
            </motion.div>
          </div>

          {/* Bottom Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-8 border-t border-white/10 grid grid-cols-3 gap-0 backdrop-blur-sm bg-black/5 rounded-3xl"
          >
            {[
              { value: stats.happyTenants === 0 ? '10+' : `${stats.happyTenants}+`, label: 'Happy Tenants', color: '#60A5FA' },
              { value: stats.liveListings || '50+', label: 'Live Listings', color: '#34D399' },
              { value: `${stats.avgRating}★`, label: 'Average Rating', color: '#FCD34D' },
            ].map((stat, i) => (
              <div key={i} className={`text-center py-2 ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <p className="text-3xl font-black text-shadow-md" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[#94a3b8] text-[10px] font-bold mt-1 uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT FORM PANEL
          ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-screen py-6 overflow-y-auto"
        style={{
          background: 'linear-gradient(to bottom right, #f0f9ff 0%, #e0e7ff 50%, #dcfce7 100%)'
        }}
      >
        {/* Dynamic Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 60%)' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle, #a7f3d0 0%, transparent 60%)' }} />
        <div className="absolute top-[30%] left-[20%] w-[30vw] h-[30vw] rounded-full blur-[100px] pointer-events-none opacity-40 mix-blend-multiply"
          style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 60%)' }} />



        {/* Mobile Logo */}
        <Link to="/" className="mb-6 lg:hidden relative z-10 bg-white/60 backdrop-blur-md p-1 rounded-3xl shadow-lg border border-white">
          <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-[1.25rem]">
            <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
          </div>
        </Link>

        {/* FORM CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full sm:max-w-[480px] px-4 sm:px-6 relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-6">
            {title && (
              <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight mb-3 drop-shadow-sm">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[#475569] text-base font-medium max-w-[320px] mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Card with Glassmorphism */}
          <div className="relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-[#3b82f6] via-[#22c55e] to-[#8b5cf6] rounded-[2rem] opacity-30 group-hover:opacity-60 blur-md transition-opacity duration-1000 animate-pulse pointer-events-none" />
            
            <div
              className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.8) inset',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              {children}
            </div>
          </div>


        </motion.div>
      </div>
    </div>
  );
}
