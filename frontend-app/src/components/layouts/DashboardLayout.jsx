import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Building2, ChevronRight, User, Settings } from 'lucide-react';
import { Linkedin, Github } from '../ui/SocialIcons';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Profile from '../dashboard/Profile';
import NotificationBell from '../dashboard/NotificationBell';

export function DashboardLayout({ children, title, subtitle, navItems = [], activeNav, onNavClick, headerActions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || '?';
  const panelLabel = user?.role === 'owner' ? 'Owner Panel' : 'My Dashboard';

  return (
    <div className="flex min-h-screen bg-background text-main-text overflow-x-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#051F24]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-card border-r border-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 shadow-card
      `}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-border shrink-0 gap-3">
          <Link to="/" className="group flex flex-col items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-2xl shadow-md border border-border transition-transform group-hover:scale-105">
              <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black tracking-tighter text-main-text">SMART ROOM FINDER</h2>
              <p className="text-[9px] text-secondary-text font-bold uppercase tracking-widest leading-none mt-1">{panelLabel}</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-secondary-text hover:bg-section transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-1">
          <p className="text-[10px] font-semibold text-secondary-text uppercase tracking-wider px-3 mb-3">Menu</p>
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavClick?.(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-secondary-text hover:bg-background hover:text-main-text'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-primary text-white' : 'bg-section text-secondary-text group-hover:bg-[#E5E7EB] group-hover:text-secondary-text'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-primary" />}
              </button>
            );
          })}

          {/* Profile Accordion */}
          <div className="mt-1">
            <button
              onClick={() => setProfileExpanded(!profileExpanded)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left group ${
                profileExpanded
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-secondary-text hover:bg-background hover:text-main-text'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                profileExpanded ? 'bg-primary text-white' : 'bg-section text-secondary-text group-hover:bg-[#E5E7EB] group-hover:text-secondary-text'
              }`}>
                <User size={16} />
              </span>
              <span>Profile</span>
              <ChevronRight size={14} className={`ml-auto text-secondary-text transition-transform ${profileExpanded ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {profileExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-3 mt-1.5 p-3 rounded-xl bg-background border border-border space-y-3 shadow-inner">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A7E8C] to-[#8CB6BC] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{userInitial}</div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-main-text truncate">{user?.name}</p>
                            <p className="text-[10px] text-secondary-text truncate">{user?.email}</p>
                        </div>
                    </div>
                    
                    <button onClick={() => { setShowProfileModal(true); setSidebarOpen(false); }} className="w-full py-2 bg-card border border-border hover:border-[#2A7E8C] hover:text-primary text-secondary-text text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm">
                        <Settings size={13} /> Manage Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A7E8C] to-[#2A7E8C] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-blue">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-main-text truncate">{user?.name}</p>
              <p className="text-xs text-secondary-text capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-error hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer text-sm font-medium"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-5 lg:px-8 h-[70px] flex items-center justify-between shrink-0 shadow-soft">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-secondary-text hover:bg-section cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-main-text leading-tight">{title}</h1>
              {subtitle && <div className="text-xs text-secondary-text font-medium leading-tight mt-0.5">{subtitle}</div>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {headerActions}
          </div>
        </header>

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-y-auto p-5 lg:p-8"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <span className="text-xs font-semibold text-primary">SmartRoom Finder</span>
          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <span className="text-[10px] text-secondary-text">© 2026 Abhishek J</span>
            <div className="flex items-center gap-3">
              <a href="https://www.linkedin.com/in/abhishek-j-033094344" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-[#0A66C2] transition-colors flex items-center gap-1.5 text-[11px] font-medium">
                <Linkedin size={14} />
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/AbhishekJ-dev" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-main-text transition-colors flex items-center gap-1.5 text-[11px] font-medium">
                <Github size={14} />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Profile Editing Modal Override */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#051F24]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => { if (e.target === e.currentTarget) setShowProfileModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="w-full max-w-2xl relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute -top-4 -right-4 lg:-right-12 p-2 bg-card text-secondary-text hover:text-error rounded-full shadow-lg transition-colors cursor-pointer z-50 ring-4 ring-white/10"
              >
                <X size={20} />
              </button>
              <Profile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
