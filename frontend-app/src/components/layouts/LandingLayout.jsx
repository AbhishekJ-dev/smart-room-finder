import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Search, CalendarCheck, UserCircle, LogOut, Menu, X, ChevronRight, Building2, Linkedin } from 'lucide-react';
import logo from '../../assets/logo.png';

export function LandingLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Rooms', href: '#rooms' },
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'owner') return '/owner-dashboard';
    if (user.role === 'admin') return '/admin-dashboard';
    return '/user-dashboard';
  };

  return (
    <div className="min-h-screen w-full text-[#1E293B] bg-[#F9FAFB] relative overflow-x-hidden">
      <div className="ambient-soft" />

      {/* ── NAVBAR ── */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[70px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl shadow-sm border border-[#E2E8F0]/30 group-hover:shadow-md transition-shadow">
                <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tight text-[#1E293B]">
                Smart <span className="text-[#2563EB]">Room</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-all"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#DC2626] hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-xl transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm px-5 py-2.5"
                  >
                    Get Started
                    <ChevronRight size={15} />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1E293B] hover:bg-[#F1F5F9] transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-[#E2E8F0] mt-2 space-y-2">
                {user ? (
                  <>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-all"
                    >
                      <UserCircle size={16} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#DC2626] hover:bg-[#FFF1F2] transition-all cursor-pointer"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-all"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all"
                    >
                      Get Started <ChevronRight size={15} />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── CONTENT ── */}
      <main className="relative z-10 pt-[70px]">
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 bg-[#1E293B] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-white/10">
                  <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs">
                The smartest way to find your perfect room. Verified listings, zero brokerage.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2.5">
                {['Home', 'Browse Rooms', 'Register', 'Login'].map(item => (
                  <li key={item}>
                    <a href="#" className="text-[#94A3B8] text-sm hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5">
                {['For Tenants', 'For Owners', 'Admin Dashboard', 'Pricing'].map(item => (
                  <li key={item}>
                    <span className="text-[#94A3B8] text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[#334155] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[#64748B] text-sm">© 2026 SmartRoom Finder. All rights reserved.</p>
            <p className="text-[#64748B] text-sm flex items-center">Designed & Built by <a href="https://www.linkedin.com/in/abhishek-j-5ab635391" target="_blank" rel="noopener noreferrer" className="text-[#60A5FA] font-medium ml-1 flex items-center gap-1.5 hover:text-white transition-colors">Abhishek J <Linkedin size={14} /></a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
