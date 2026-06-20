import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Home, CalendarCheck, ShieldCheck, TrendingUp, IndianRupee,
  ArrowUpRight, UserPlus, Building2, CreditCard, RefreshCw
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL, API_BASE_URL } from '../../utils/api';

const API = `${API_URL}/admin`;

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const activityIcon = (type) => {
  const map = {
    property:     { Icon: Building2,  bg: '#F0FDF4', color: '#16A34A' },
    booking:      { Icon: CalendarCheck, bg: '#FFFBEB', color: '#D97706' },
    user:         { Icon: UserPlus,   bg: '#F0F9FA', color: '#2A7E8C' },
    subscription: { Icon: CreditCard, bg: '#FAF5FF', color: '#7C3AED' },
  };
  return map[type] || { Icon: TrendingUp, bg: '#F3F4F6', color: '#6B7280' };
};

const badgeClass = (color) => {
  const map = {
    green:  'badge-green',
    blue:   'badge-blue',
    purple: 'badge-purple',
    amber:  'badge-amber',
    red:    'badge-red',
  };
  return map[color] || 'badge-blue';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        axios.get(`${API}/dashboard`,        { headers }),
        axios.get(`${API}/recent-activity`,  { headers }),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setActivityLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cards = stats ? [
    { label: 'Total Users',     value: stats.total_users,          icon: <Users size={20} />,        bg: '#F0F9FA', iconColor: '#2A7E8C', path: '/admin/users',         trend: '+',  unit: 'registered' },
    { label: 'Properties',      value: stats.total_properties,     icon: <Home size={20} />,         bg: '#F0FDF4', iconColor: '#16A34A', path: '/admin/properties',    trend: '+',  unit: 'listed' },
    { label: 'Total Bookings',  value: stats.total_bookings,       icon: <CalendarCheck size={20} />,bg: '#FFFBEB', iconColor: '#D97706', path: '/admin/bookings',      trend: '',   unit: 'requests' },
    { label: 'Active Subs',     value: stats.active_subscriptions, icon: <ShieldCheck size={20} />,  bg: '#FAF5FF', iconColor: '#7C3AED', path: '/admin/subscriptions', trend: '',   unit: 'active plans' },
  ] : [];

  return (
    <AdminLayout title="Dashboard" subtitle="Live platform overview and key statistics.">

      {/* ── Refresh button */}
      <div className="flex justify-end mb-5">
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-secondary-text hover:border-[#2A7E8C] hover:text-primary transition-all shadow-soft cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {loading
          ? [1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-soft">
                <div className="skeleton h-10 w-10 rounded-xl mb-4" />
                <div className="skeleton h-6 w-16 rounded-lg mb-2" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            ))
          : cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                onClick={() => navigate(card.path)}
                className="bg-card rounded-2xl border border-border p-5 shadow-soft hover:shadow-card-hover hover:-translate-y-1 hover:border-[#B0DCE0] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bg, color: card.iconColor }}>
                    {card.icon}
                  </div>
                  <ArrowUpRight size={14} className="text-[#CBD5E1] group-hover:text-primary transition-colors mt-0.5" />
                </div>
                <p className="text-3xl font-extrabold text-main-text mb-0.5">{card.value}</p>
                <p className="text-sm text-secondary-text font-medium">{card.label}</p>
                <p className="text-[11px] text-secondary-text mt-1">{card.trend}{card.value} {card.unit}</p>
              </motion.div>
            ))
        }
      </div>

      {/* ── Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-main-text">Recent Activity</h3>
              <p className="text-[11px] text-secondary-text font-medium mt-0.5">Live updates from users, properties, and bookings</p>
            </div>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-4 space-y-2.5">
            {activityLoading
              ? [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background">
                    <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-3/4 rounded" />
                      <div className="skeleton h-2.5 w-1/4 rounded" />
                    </div>
                  </div>
                ))
              : activity.length === 0
                ? (
                    <div className="py-10 text-center text-secondary-text text-sm font-medium">
                      No recent activity yet. Start adding users, properties and bookings.
                    </div>
                  )
                : activity.map((item, idx) => {
                    const { Icon, bg, color } = activityIcon(item.type);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-border transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg, color }}>
                          <Icon size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-main-text truncate capitalize">{item.message}</p>
                          <p className="text-[11px] text-secondary-text mt-0.5">{timeAgo(item.created_at)}</p>
                        </div>
                        <span className={`badge ${badgeClass(item.color)} text-[10px] shrink-0 capitalize`}>
                          {item.badge}
                        </span>
                      </motion.div>
                    );
                  })
            }
          </div>
        </motion.div>

        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#051F24] rounded-2xl text-white overflow-hidden relative p-6 flex flex-col"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#7C3AED]/10 rounded-full blur-[40px] pointer-events-none" />

          <div className="relative z-10 flex-1">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-5">
              <IndianRupee size={18} className="text-white" />
            </div>
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-1">Total Revenue</p>
            {loading
              ? <div className="skeleton h-10 w-32 rounded-xl mb-2" />
              : <p className="text-4xl font-extrabold text-white mb-1">
                  ₹{Number(stats?.total_revenue || 0).toLocaleString('en-IN')}
                </p>
            }
            <p className="text-xs text-[#475569] leading-relaxed mt-3">
              Revenue from paid tenant subscriptions.
            </p>

            {/* Mini stats */}
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#475569] mb-0.5">Active Plans</p>
                <p className="text-xl font-extrabold text-white">{loading ? '—' : stats?.active_subscriptions}</p>
              </div>
              <div>
                <p className="text-xs text-[#475569] mb-0.5">Total Bookings</p>
                <p className="text-xl font-extrabold text-white">{loading ? '—' : stats?.total_bookings}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="mt-6 w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer relative z-10"
          >
            View Subscriptions →
          </button>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
