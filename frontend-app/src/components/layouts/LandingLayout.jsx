import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Search, CalendarCheck, UserCircle, LogOut, Menu, X, ChevronRight, Building2 } from 'lucide-react';
import { Linkedin, Github } from '../ui/SocialIcons';
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
    <div className="min-h-screen w-full text-main-text bg-background relative overflow-x-hidden">
      <div className="ambient-soft" />

      {/* ── NAVBAR ── */}
      <nav className="glass-nav fixed top-0 left-0 right-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[70px]">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-xl shadow-sm border border-border/30 group-hover:shadow-md transition-shadow">
                <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tight text-main-text">
                Smart Room Finder
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-secondary-text hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
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
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-error hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-semibold text-secondary-text hover:text-main-text hover:bg-section rounded-xl transition-all"
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
              className="md:hidden p-2 rounded-xl text-secondary-text hover:bg-section transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-card animate-fade-in">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-main-text hover:bg-section transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 border-t border-border mt-2 space-y-2">
                {user ? (
                  <>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
                    >
                      <UserCircle size={16} /> Dashboard
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setMobileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-error hover:bg-[#FFF1F2] transition-all cursor-pointer"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-secondary-text hover:bg-section transition-all"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-all"
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
      <footer className="relative z-10 bg-[#051F24] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl shadow-md border border-white/10">
                  <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                The smartest way to find your perfect room. Verified listings, zero brokerage.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navigation</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#home" className="text-gray-400 text-sm hover:text-white transition-colors">Home</a>
                </li>
                <li>
                  <a href="#rooms" className="text-gray-400 text-sm hover:text-white transition-colors">Browse Rooms</a>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 text-sm hover:text-white transition-colors">Register</Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 text-sm hover:text-white transition-colors">Login</Link>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/register" className="text-gray-400 text-sm hover:text-white transition-colors">For Tenants</Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-400 text-sm hover:text-white transition-colors">For Owners</Link>
                </li>
                <li>
                  <Link to="/admin-dashboard" className="text-gray-400 text-sm hover:text-white transition-colors">Admin Dashboard</Link>
                </li>
                <li>
                  <Link to="/subscribe" className="text-gray-400 text-sm hover:text-white transition-colors">Pricing</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#334155] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2026 Smart Room Finder. All rights reserved.</p>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <p className="text-gray-400 text-sm">Designed & Built by <span className="text-[#8CB6BC] font-medium">Abhishek J</span></p>
              <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/in/abhishek-j-033094344" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors flex items-center gap-1.5 text-sm font-medium">
                  <Linkedin size={16} />
                  <span>LinkedIn</span>
                </a>
                <a href="https://github.com/AbhishekJ-dev" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium">
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
