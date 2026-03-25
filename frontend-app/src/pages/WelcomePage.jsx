import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Shield, CreditCard, ChevronDown, Star, MapPin, Users, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ─── SPLASH SCREEN ─── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]"
          >
            <div className="relative">
              <motion.h1
                initial={{ opacity: 0, scale: 0.5, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-6xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tighter"
              >
                Smart Room
              </motion.h1>
              <motion.h1
                initial={{ opacity: 0, scale: 0.5, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-6xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 tracking-tighter text-center"
              >
                Finder
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 0.8 }}
                className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-4 mx-auto"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-slate-400 text-center mt-4 text-lg"
              >
                Loading your experience...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN PAGE ─── */}
      <div className="min-h-screen w-full bg-transparent text-white">
        {/* ─── NAVBAR ─── */}
        <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              SmartRoomFinder
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-slate-300 hover:text-white transition-all text-sm font-medium">Home</a>
              <a href="#about" className="text-slate-300 hover:text-white transition-all text-sm font-medium">About</a>
              <a href="#features" className="text-slate-300 hover:text-white transition-all text-sm font-medium">Features</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-all text-sm font-medium">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to={user.role === 'user' ? '/user-dashboard' : '/owner-dashboard'} className="text-sm text-slate-300 hover:text-white">
                    Dashboard
                  </Link>
                  <button onClick={logout} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/30 transition-all">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-all">
                    Login
                  </Link>
                  <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-sm font-bold shadow-lg hover:shadow-blue-500/20 transition-all">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ─── HERO SECTION ─── */}
        <section id="home" className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 relative overflow-hidden">


          {/* Decorative blobs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-[120px] z-1"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] z-1"></div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={!showSplash ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center max-w-4xl z-10"
          >

            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">Find Your</span>{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Perfect Room</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              "Search your room as per your needs with smart technology" — Discover verified listings, connect with owners, and book your ideal stay effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/register')}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-500/20 flex items-center gap-2 justify-center cursor-pointer"
              >
                Get Started <ArrowRight size={20} />
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03 }}
                href="#about"
                className="px-10 py-4 glass rounded-2xl text-lg font-bold border border-white/10 flex items-center gap-2 justify-center cursor-pointer backdrop-blur-md"
              >
                Learn More <ChevronDown size={20} />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-10 z-10"
          >
            <ChevronDown className="text-slate-400" size={28} />
          </motion.div>
        </section>

        {/* ─── ABOUT SECTION ─── */}
        <section id="about" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest">About Us</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6">What is Smart Room Finder?</h2>
              <p className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
                Smart Room Finder bridges the gap between room seekers and property owners.
                Whether you're a student looking for a PG, a professional searching for a 1BHK, or a family needing a spacious 2BHK —
                we make it effortless to discover, compare, and book rooms that fit your lifestyle and budget.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard icon={<Users />} value="10,000+" label="Happy Users" />
              <StatCard icon={<Home />} value="5,000+" label="Verified Listings" />
              <StatCard icon={<MapPin />} value="50+" label="Cities Covered" />
            </div>
          </div>
        </section>

        {/* ─── FEATURES SECTION ─── */}
        <section id="features" className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest">Features</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6">Why Choose Us?</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={<Search className="text-blue-400" />} title="Smart Filters" desc="Search by room type (1BHK, 2BHK, PG), price range, and area." />
              <FeatureCard icon={<Home className="text-purple-400" />} title="Verified Listings" desc="All properties verified with real photos and transparent pricing." />
              <FeatureCard icon={<Shield className="text-pink-400" />} title="Secure Booking" desc="Book rooms for 1 day, a week, a month, or even a year." />
              <FeatureCard icon={<CreditCard className="text-green-400" />} title="Flexible Plans" desc="Unlock full details with affordable plans starting at ₹50." />
              <FeatureCard icon={<Star className="text-yellow-400" />} title="Owner Dashboard" desc="Owners can list properties, manage bookings, and track availability." />
              <FeatureCard icon={<MapPin className="text-red-400" />} title="Location Access" desc="Get exact Google Maps location after subscribing." />
            </div>
          </div>
        </section>

        {/* ─── PRICING SECTION ─── */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="text-green-400 text-sm font-semibold uppercase tracking-widest">Pricing</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 mb-6">Simple & Affordable</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <PricingCard plan="Weekly" price="₹50" duration="7 Days" features={['Full room details', 'Owner contact info', 'Exact location access', 'Direct booking']} />
              <PricingCard plan="Monthly" price="₹100" duration="30 Days" features={['Everything in Weekly', 'Priority support', 'Unlimited bookings', 'Save 50%']} popular />
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="glass border-t border-white/5 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">SmartRoomFinder</h3>
              <p className="text-slate-500 text-sm mt-1">© 2026 All rights reserved.</p>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#home" className="hover:text-white transition-all">Home</a>
              <a href="#about" className="hover:text-white transition-all">About</a>
              <a href="#features" className="hover:text-white transition-all">Features</a>
              <Link to="/register" className="hover:text-white transition-all">Register</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

/* ─── SUB COMPONENTS ─── */
const FeatureCard = ({ icon, title, desc }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="glass-card p-8 flex flex-col items-center text-center group hover:border-white/20 transition-all">
    <div className="p-4 bg-white/5 rounded-2xl mb-5 text-3xl group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </motion.div>
);

const StatCard = ({ icon, value, label }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 text-center">
    <div className="inline-block p-3 bg-blue-500/10 rounded-2xl text-blue-400 mb-4">{icon}</div>
    <h3 className="text-3xl font-black mb-1">{value}</h3>
    <p className="text-slate-400 text-sm">{label}</p>
  </motion.div>
);

const PricingCard = ({ plan, price, duration, features, popular }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className={`glass-card p-8 text-center relative ${popular ? 'border-2 border-purple-500/50' : ''}`}>
    {popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold uppercase">Most Popular</span>}
    <h3 className="text-lg font-bold text-slate-300 mb-2">{plan} Plan</h3>
    <div className="text-5xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{price}</div>
    <p className="text-slate-500 text-sm mb-6">for {duration}</p>
    <ul className="text-left space-y-3 mb-8">
      {features.map((f, i) => (<li key={i} className="text-slate-300 text-sm flex items-center gap-2"><span className="text-green-400">✓</span> {f}</li>))}
    </ul>
    <button className={`w-full py-3 rounded-xl font-bold ${popular ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' : 'bg-white/5 border border-white/10 hover:bg-white/10'} transition-all cursor-pointer`}>
      Get Started
    </button>
  </motion.div>
);

export default WelcomePage;
