import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Home, Shield, Star, Users, ArrowRight,
  Phone, CheckCircle, Building2, ChevronRight, Zap, Heart,
  TrendingUp, Award, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LandingLayout } from '../components/layouts/LandingLayout';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const CATEGORIES = [
  { label: '1 BHK', emoji: '🏠', desc: 'Perfect for singles' },
  { label: '2 BHK', emoji: '🏡', desc: 'Ideal for couples' },
  { label: 'Room',  emoji: '🛏️', desc: 'Private or shared rooms' },
];

// rotating hero text
const HERO_WORDS = ['Perfect Room', 'Dream Home', 'Ideal Room', 'Best Space'];

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms]             = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [locationSearch, setLocationSearch] = useState('');
  const [priceSearch, setPriceSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [heroWordIdx, setHeroWordIdx]       = useState(0);
  const [stats, setStats] = useState({
    happyTenants: 0,
    liveListings: 0,
    avgRating: '4.9'
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    axios.get(`${API}/rooms`)
      .then(r => setRooms(r.data))
      .catch(err => console.error('Rooms fetch failed:', err))
      .finally(() => setRoomsLoading(false));

    axios.get(`${API}/stats`)
      .then(r => setStats(r.data))
      .catch(err => console.error('Stats fetch failed:', err));
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      axios.get(`${API}/subscriptions/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setIsSubscribed(res.data.isSubscribed))
      .catch(err => console.error('Sub status fetch error:', err));
    }
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setHeroWordIdx(i => (i + 1) % HERO_WORDS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationSearch) params.set('location', locationSearch);
    if (priceSearch)    params.set('maxPrice', priceSearch);
    navigate(user ? `/user-dashboard?${params}` : '/register');
  };

  const displayRooms = rooms.slice(0, 8);

  return (
    <LandingLayout>

      {/* ══════════════════════════════════
          HERO SECTION
          ══════════════════════════════════ */}
      <section id="home" className="relative overflow-hidden min-h-screen flex items-center"
        style={{
          background: 'linear-gradient(155deg, #0F172A 0%, #1E293B 45%, #1e3a6e 100%)'
        }}
      >
        {/* Animated background orbs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 60%)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #22C55E 0%, transparent 60%)', transform: 'translate(30%, 30%)', animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full opacity-10 animate-pulse"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 60%)', animationDelay: '2s' }} />







        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 z-10 w-full">
          <div className="max-w-4xl mx-auto text-center">

            {/* Animated Headline */}

            {/* Animated Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6"
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight">
                Find Your{' '}
                <span className="relative inline-block">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={heroWordIdx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="inline-block text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(90deg, #60A5FA, #34D399)' }}
                    >
                      {HERO_WORDS[heroWordIdx]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mt-1 leading-[1.08] tracking-tight"
                style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}
              >
                Smartly.
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-[#94A3B8] text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Search rooms based on your needs with ease. No brokerage, verified owners,
              and <span className="text-white font-semibold">instant booking</span> across India.
            </motion.p>

            {/* ── SEARCH BAR ── */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="max-w-2xl mx-auto mb-10"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 flex flex-col sm:flex-row gap-3 shadow-2xl">
                <div className="flex items-center gap-3 flex-1 px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus-within:bg-white/10 focus-within:border-[#60A5FA]/50 transition-all">
                  <MapPin size={18} className="text-[#60A5FA] shrink-0" />
                  <input
                    type="text"
                    placeholder="Location, area, city..."
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="bg-transparent outline-none text-base text-white placeholder-[#64748B] font-medium w-full"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus-within:bg-white/10 focus-within:border-[#60A5FA]/50 transition-all sm:w-[180px]">
                  <span className="text-[#64748B] text-sm font-medium shrink-0">₹</span>
                  <input
                    type="number"
                    placeholder="Max price/mo"
                    value={priceSearch}
                    onChange={e => setPriceSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="bg-transparent outline-none text-sm text-white placeholder-[#64748B] font-medium w-full"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer transition-all active:scale-[0.97] whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.4)'
                  }}
                >
                  <Search size={16} />
                  Search Rooms
                </button>
              </div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#94A3B8]"
            >
              {[
                { icon: <CheckCircle size={15} className="text-[#22C55E]" />, text: 'Verified Listings' },
                { icon: <Shield size={15} className="text-[#60A5FA]" />, text: 'Zero Brokerage' },
                { icon: <Clock size={15} className="text-[#FCD34D]" />, text: 'Instant Booking' },
                { icon: <Star size={15} className="text-[#F59E0B] fill-current" />, text: `${stats.avgRating}/5 Rating` },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-1.5 font-medium">
                  {item.icon} {item.text}
                </div>
              ))}
            </motion.div>


          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CATEGORY TABS
          ══════════════════════════════════ */}
      <section className="relative bg-white border-b border-[#E2E8F0] py-5 shadow-soft">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest shrink-0">Browse:</span>
            {['All', ...CATEGORIES.map(c => c.label)].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                  activeCategory === cat
                    ? 'text-white border-transparent'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
                style={activeCategory === cat ? {
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                } : {}}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURED ROOMS
          ══════════════════════════════════ */}
      <section id="rooms" className="py-20"
        style={{ background: 'linear-gradient(180deg, #F9FAFB 0%, #F0F9FF 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">Featured Properties</h2>
              <p className="text-[#64748B] text-sm mt-1">Verified listings from trusted owners across India</p>
            </div>
            <button
              onClick={() => navigate(user ? '/user-dashboard' : '/register')}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-xl text-sm font-semibold hover:border-[#2563EB] hover:text-[#2563EB] transition-all shadow-soft"
            >
              View All <ChevronRight size={15} />
            </button>
          </div>

          {roomsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-soft">
                  <div className="skeleton h-52 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-3/4 rounded-lg" />
                    <div className="skeleton h-3 w-1/2 rounded-lg" />
                    <div className="skeleton h-9 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRooms.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
              <Home size={48} className="mx-auto text-[#CBD5E1] mb-4" />
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">No rooms listed yet</h3>
              <p className="text-[#64748B] text-sm">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayRooms
                .filter(r => activeCategory === 'All' || r.type?.toLowerCase().replace(/\s/g, '') === activeCategory.toLowerCase().replace(/\s/g, ''))
                .map((room, idx) => (
                  <LandingRoomCard
                    key={room.id}
                    room={room}
                    delay={idx * 0.05}
                    onAction={() => navigate(user ? '/user-dashboard' : '/register')}
                  />
                ))}
            </div>
          )}

          {/* CTA Banner */}
          {!user && displayRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-14 rounded-3xl p-10 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1E293B 0%, #1e3a6e 100%)' }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #60A5FA, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #34D399, transparent)', transform: 'translate(-30%, 30%)' }} />
              <div className="relative z-10">

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                  Browse Listings Free. <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #60A5FA, #34D399)' }}>Unlock with a Plan.</span>
                </h3>
                <p className="text-[#94A3B8] mb-8 text-sm max-w-md mx-auto leading-relaxed">
                  Create a free account to explore all listings. Upgrade to a subscription plan to reveal owner contacts, exact addresses, and book instantly.
                </p>

                {/* Two CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 bg-white text-[#1E293B] font-bold px-8 py-3.5 rounded-xl hover:bg-[#F1F5F9] transition-all cursor-pointer active:scale-[0.97] text-sm"
                    style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
                  >
                    Create Account <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-xl transition-all cursor-pointer active:scale-[0.97] text-sm border border-white/20 text-white/80 hover:bg-white/10"
                  >
                    See Plans →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════
          ABOUT / STATS
          ══════════════════════════════════ */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #2563EB, transparent)', transform: 'translate(30%, -30%)' }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-6 leading-tight">
                The Smartest Way<br />to Find Your<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #2563EB, #22C55E)' }}>
                  Next Home.
                </span>
              </h2>
              <p className="text-[#64748B] text-base leading-relaxed mb-8">
                Smart Room Finder bridges the gap between room seekers and property owners.
                We've eliminated the middleman — providing a transparent, fast, and secure
                platform for all your housing needs.
              </p>
              <ul className="space-y-4">
                {[
                  'Direct communication with verified owners',
                  'Exact location mapping via Google Maps',
                  'Flexible booking — Daily, Weekly, Monthly',
                  'Zero platform brokerage fees, ever',
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#1E293B] font-medium">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2563EB, #22C55E)' }}>
                      <CheckCircle size={13} className="text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-5">
              {[
                { icon: <Users size={24} />, value: stats.happyTenants === 0 ? '10+' : `${stats.happyTenants}+`, label: 'Happy Tenants',       bg: 'from-[#EFF6FF] to-[#DBEAFE]', iconBg: '#2563EB', textColor: '#1D4ED8' },
                { icon: <Home size={24} />,  value: `${stats.liveListings || '50'}+`, label: 'Live Listings', bg: 'from-[#F0FDF4] to-[#DCFCE7]', iconBg: '#16A34A', textColor: '#15803D' },
                { icon: <MapPin size={24} />, value: '50+', label: 'Cities Covered',     bg: 'from-[#FFFBEB] to-[#FEF3C7]', iconBg: '#D97706', textColor: '#B45309' },
                { icon: <Star size={24} className="fill-current" />, value: `${stats.avgRating}/5`, label: 'Avg. Rating', bg: 'from-[#FAF5FF] to-[#EDE9FE]', iconBg: '#7C3AED', textColor: '#6D28D9' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${s.bg} border border-white rounded-2xl p-6 shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ background: s.iconBg, boxShadow: `0 4px 12px ${s.iconBg}40` }}>
                    {s.icon}
                  </div>
                  <p className="text-3xl font-extrabold" style={{ color: s.textColor }}>{s.value}</p>
                  <p className="text-sm text-[#64748B] font-medium mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURES SECTION
          ══════════════════════════════════ */}
      <section id="features" className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #F9FAFB 0%, #EFF6FF 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E293B] mb-4">Everything You Need.</h2>
            <p className="text-[#64748B] max-w-xl mx-auto text-base">
              Powerful tools designed to make your room finding experience seamless and professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🔍', icon: <Search size={22} />, iconBg: '#2563EB', bg: '#EFF6FF', title: 'Smart Filters', desc: 'Filter by room type, rent range, and area to find your perfect match instantly.' },
              { emoji: '📸', icon: <Home size={22} />, iconBg: '#16A34A', bg: '#F0FDF4', title: 'Real Photos Only', desc: 'Every listing features actual photos uploaded directly by the property owner.' },
              { emoji: '🚫', icon: <Shield size={22} />, iconBg: '#DC2626', bg: '#FFF1F2', title: 'Zero Brokerage', desc: 'Connect directly with owners. Save thousands on brokerage with every move.' },
              { 
                emoji: '📞', 
                icon: <Phone size={22} />, 
                iconBg: '#0EA5E9', 
                bg: '#F0F9FF', 
                title: 'Instant Access', 
                desc: !user 
                  ? 'Join our community and choose a plan to unlock owner contacts and exact addresses immediately.' 
                  : !isSubscribed 
                    ? 'Subscribe to a premium plan to reveal owner phone numbers and property addresses.' 
                    : 'You have full access! Owner contacts and exact addresses are now visible on all listings.'
              },
              { emoji: '⭐', icon: <Star size={22} className="fill-current" />, iconBg: '#D97706', bg: '#FFFBEB', title: 'Owner Dashboard', desc: 'Manage your properties, respond to tenants, and track bookings through your personalized owner hub.' },
              { emoji: '📍', icon: <MapPin size={22} />, iconBg: '#7C3AED', bg: '#FAF5FF', title: 'Precise Mapping', desc: 'Google Maps integration so you can scout the neighborhood before you visit.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-7 shadow-soft hover:-translate-y-2 hover:border-transparent group transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-soft"
                    style={{ background: `linear-gradient(135deg, ${f.iconBg}ee, ${f.iconBg}bb)`, boxShadow: `0 6px 16px ${f.iconBg}30` }}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-[#1E293B]">{f.title}</h3>
                </div>
                <p className="text-[#64748B] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1E293B]">Get Settled in 3 Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-[50px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 z-0"
              style={{ background: 'linear-gradient(90deg, #2563EB, #22C55E)' }} />

            {[
              { step: '01', title: 'Register Free', desc: 'Create your account in under 30 seconds. Completely free, no credit card needed.', color: '#2563EB' },
              { step: '02', title: 'Search & Filter', desc: 'Use smart filters to browse verified room listings by location, type, and budget.', color: '#7C3AED' },
              { step: '03', title: 'Book & Move In', desc: 'Contact the owner directly, negotiate, and finalize your booking seamlessly.', color: '#22C55E' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 text-center group"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${item.color}dd, ${item.color}88)`,
                    boxShadow: `0 8px 24px ${item.color}35`
                  }}
                >
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] mb-3">{item.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {!user && (
            <div className="text-center mt-16">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 text-white font-bold px-10 py-4 rounded-xl text-sm cursor-pointer transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 12px 30px rgba(37,99,235,0.35)'
                }}
              >
                Start Finding Rooms Free <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

    </LandingLayout>
  );
};

/* ── Landing Room Card ── */
const LandingRoomCard = ({ room, delay, onAction }) => {
  let photos = [];
  try {
    photos = typeof room.photos === 'string' ? JSON.parse(room.photos) : (room.photos || []);
    photos = photos.filter(Boolean);
  } catch { photos = []; }

  const getImgSrc = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const imgSrc = getImgSrc(photos[0]);
  
  // Combined location for better display
  const displayLocation = room.city ? `${room.city}, ${room.area}` : room.area;

  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onAction}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group shadow-soft transition-all duration-300"
      style={{ border: '1px solid #E2E8F0' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={imgSrc}
          alt={room.type || 'Room'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="badge badge-blue text-xs">{room.type}</span>
        </div>
        {room.is_booked && (
          <div className="absolute top-3 right-10">
            <span className="badge badge-red text-xs">Booked</span>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); setIsLiked(v => !v); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all shadow-soft hover:scale-110"
        >
          <Heart size={14} className={isLiked ? 'text-[#DC2626] fill-current' : 'text-[#94A3B8]'} />
        </button>

        {/* Price overlay at bottom */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg">
            <span className="text-sm font-bold">₹{room.price_monthly?.toLocaleString()}</span>
            <span className="text-[10px] text-white/70 ml-1">/mo</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#1E293B] text-base leading-tight truncate mb-2">{displayLocation}</h3>

        <div className="flex items-center gap-1.5 text-[#64748B] text-xs mb-4">
          <MapPin size={12} className="text-[#2563EB] shrink-0" />
          <span className="truncate">{room.location || 'Location not specified'}</span>
        </div>

        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-[#64748B] border border-[#E2E8F0] bg-[#F8FAFC] group-hover:text-white group-hover:border-transparent"
          style={{}}
        >
          <span className="group-hover:hidden">View Details</span>
          <span className="hidden group-hover:flex items-center justify-center gap-2 w-full"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}
          >
            View Details →
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default WelcomePage;
