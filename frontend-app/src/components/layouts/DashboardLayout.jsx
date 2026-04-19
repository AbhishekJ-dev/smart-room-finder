import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, Building2, ChevronRight, User, Settings, Linkedin } from 'lucide-react';
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
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#1E293B] overflow-x-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#1E293B]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white border-r border-[#E2E8F0]
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 shadow-card
      `}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-[#E2E8F0] shrink-0 gap-3">
          <Link to="/" className="group flex flex-col items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden rounded-2xl shadow-md border border-[#F1F5F9] transition-transform group-hover:scale-105">
              <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-black tracking-tighter text-[#1E293B]">SMART<span className="text-[#2563EB]">ROOM</span></h2>
              <p className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest leading-none mt-1">{panelLabel}</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-1">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-3 mb-3">Menu</p>
          {navItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavClick?.(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left group ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E2E8F0] group-hover:text-[#64748B]'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto text-[#2563EB]" />}
              </button>
            );
          })}

          {/* Profile Accordion */}
          <div className="mt-1">
            <button
              onClick={() => setProfileExpanded(!profileExpanded)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left group ${
                profileExpanded
                  ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                profileExpanded ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E2E8F0] group-hover:text-[#64748B]'
              }`}>
                <User size={16} />
              </span>
              <span>Profile</span>
              <ChevronRight size={14} className={`ml-auto text-[#94A3B8] transition-transform ${profileExpanded ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {profileExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-3 mt-1.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 shadow-inner">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#60a5fa] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">{userInitial}</div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-[#1E293B] truncate">{user?.name}</p>
                            <p className="text-[10px] text-[#64748B] truncate">{user?.email}</p>
                        </div>
                    </div>
                    
                    <button onClick={() => { setShowProfileModal(true); setSidebarOpen(false); }} className="w-full py-2 bg-white border border-[#E2E8F0] hover:border-[#2563eb] hover:text-[#2563eb] text-[#64748B] text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm">
                        <Settings size={13} /> Manage Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-[#E2E8F0] space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-blue">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#1E293B] truncate">{user?.name}</p>
              <p className="text-xs text-[#94A3B8] capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#DC2626] hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer text-sm font-medium"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-5 lg:px-8 h-[70px] flex items-center justify-between shrink-0 shadow-soft">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#1E293B] leading-tight">{title}</h1>
              {subtitle && <div className="text-xs text-[#94A3B8] font-medium leading-tight mt-0.5">{subtitle}</div>}
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
        <footer className="border-t border-[#E2E8F0] bg-white px-8 py-4 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-[#2563EB]">SmartRoom Finder</span>
          <span className="text-[10px] text-[#94A3B8] flex items-center">© 2026 <a href="https://www.linkedin.com/in/abhishek-j-5ab635391" target="_blank" rel="noopener noreferrer" className="ml-1 text-[#60A5FA] font-medium hover:text-[#2563EB] transition-colors inline-flex items-center gap-1">Abhishek J <Linkedin size={10} /></a></span>
        </footer>
      </div>

      {/* Profile Editing Modal Override */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1E293B]/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto"
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
                className="absolute -top-4 -right-4 lg:-right-12 p-2 bg-white text-[#64748B] hover:text-[#EF4444] rounded-full shadow-lg transition-colors cursor-pointer z-50 ring-4 ring-white/10"
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
