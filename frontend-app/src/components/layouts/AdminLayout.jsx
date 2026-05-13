import React, { useRef, useState } from 'react';
import {
  BarChart3, Users, ShieldCheck, Home, CalendarCheck,
  LogOut, User as UserIcon, Search, Menu, X, Building2, ChevronRight
} from 'lucide-react';
import { Linkedin, Github } from '../ui/SocialIcons';
import logo from '../../assets/logo.png';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const searchInputRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard',     label: 'Dashboard',     icon: <BarChart3 size={16} />,    path: '/admin-dashboard' },
    { id: 'users',         label: 'Users',         icon: <Users size={16} />,        path: '/admin/users' },
    { id: 'properties',    label: 'Properties',    icon: <Home size={16} />,         path: '/admin/properties' },
    { id: 'bookings',      label: 'Bookings',      icon: <CalendarCheck size={16} />,path: '/admin/bookings' },
    { id: 'subscriptions', label: 'Subscriptions', icon: <ShieldCheck size={16} />,  path: '/admin/subscriptions' },
    { id: 'plans',         label: 'Plans',         icon: <BarChart3 size={16} />,    path: '/admin/plans' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-background flex text-main-text">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex flex-col z-50 shadow-card
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col items-center justify-center p-6 border-b border-border shrink-0 gap-3">
          <Link to="/admin-dashboard" className="group flex flex-col items-center gap-3" onClick={() => setIsSidebarOpen(false)}>
            <div className="w-20 h-20 flex items-center justify-center overflow-hidden rounded-2xl shadow-md border border-border transition-transform group-hover:scale-105">
              <img src={logo} alt="SmartRoom Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-secondary-text font-bold uppercase tracking-widest leading-tight">Admin Panel</p>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-4 right-4 p-2 rounded-lg text-secondary-text hover:bg-section cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-secondary-text uppercase tracking-wider px-3 mb-3">Navigation</p>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-secondary-text hover:bg-background hover:text-main-text'
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-primary text-white' : 'bg-section text-secondary-text group-hover:bg-[#E5E7EB]'
                }`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && <ChevronRight size={13} className="ml-auto text-primary" />}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3B82F6] flex items-center justify-center font-bold text-sm text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-main-text truncate">{user?.name || 'Administrator'}</p>
              <p className="text-xs text-primary font-medium">Master Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-error hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer text-sm font-medium"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border h-[70px] flex items-center justify-between px-5 lg:px-8 shadow-soft">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="p-2 rounded-xl text-secondary-text hover:bg-section lg:hidden cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-main-text leading-tight truncate max-w-[180px] md:max-w-none">{title}</h2>
              {subtitle && <p className="text-xs text-secondary-text font-medium mt-0.5 hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={15} onClick={() => searchInputRef.current?.focus()} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Quick search…"
                className="bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium text-main-text w-[200px] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-card px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <span className="text-xs font-semibold text-primary">SmartRoom Finder Admin</span>
          <div className="flex items-center gap-4">
            <a href="https://www.linkedin.com/in/abhishek-j-033094344" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-[#0A66C2] transition-colors flex items-center gap-1.5 text-[11px] font-medium">
              <Linkedin size={14} />
              <span>LinkedIn</span>
            </a>
            <a href="https://github.com/AbhishekJ-dev" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-main-text transition-colors flex items-center gap-1.5 text-[11px] font-medium">
              <Github size={14} />
              <span>GitHub</span>
            </a>
          </div>
          <span className="text-[10px] text-secondary-text">© 2026 Abhishek J</span>
        </footer>
      </main>
    </div>
  );
};
