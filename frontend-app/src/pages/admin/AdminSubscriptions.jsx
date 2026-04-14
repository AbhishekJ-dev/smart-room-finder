import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, CreditCard, ToggleLeft, ToggleRight, Search, Filter, Hash, X, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ui/ConfirmModal';

const API = 'http://localhost:5000/api/admin';

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [togglingId, setTogglingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/subscriptions`, { headers });
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  const handleToggle = async (id, currentStatus, name) => {
    const action = currentStatus ? 'Deactivate' : 'Activate';
    
    setModal({
      isOpen: true,
      title: `${action} Subscription?`,
      message: `Are you sure you want to ${action.toLowerCase()} the subscription for "${name}"? This will affect their premium access immediately.`,
      type: currentStatus ? 'danger' : 'info',
      confirmText: `Yes, ${action}`,
      onConfirm: async () => {
        setTogglingId(id);
        try {
          const res = await axios.put(`${API}/subscriptions/${id}/toggle`, {}, { headers });
          toast.success(res.data.message);
          setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
        } catch (err) {
          console.error('Toggle error:', err);
          toast.error('Failed to update subscription status');
        } finally {
          setTogglingId(null);
        }
      }
    });
  };

  const getStatus = (sub) => {
    const isExpired = new Date(sub.end_date) < new Date();
    if (!sub.is_active) return 'deactivated';
    if (isExpired) return 'expired';
    return 'active';
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return subscriptions.filter(s => {
      const status = getStatus(s);
      const matchSearch = !q || 
        s.user_name?.toLowerCase().includes(q) || 
        s.user_email?.toLowerCase().includes(q) || 
        s.plan_name?.toLowerCase().includes(q) ||
        String(s.id).includes(q);
      const matchStatus = filterStatus === 'all' || status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [subscriptions, search, filterStatus]);

  const getTimeLeft = (endDate) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return `${Math.floor(days / 30)}mo left`;
    return `${days}d left`;
  };

  return (
    <AdminLayout title="Tenant Subscriptions" subtitle="Monitor and manage all active, expired, and manual subscription overrides.">
      
      {/* ── Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tenant, email or plan..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-9 pr-9 text-sm text-[#1E293B] placeholder-[#94A3B8] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all shadow-soft"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B] cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={13} />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-white border border-[#E2E8F0] rounded-xl py-2.5 pl-8 pr-8 text-xs font-bold text-[#64748B] outline-none focus:border-[#2563EB] transition-all cursor-pointer shadow-soft"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB] transition-all shadow-soft cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <div className="flex items-center gap-1"><Hash size={11} /> ID</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Tenant</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Plan Details</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <div className="flex items-center gap-1"><Calendar size={11} /> Period</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="skeleton h-4 w-full rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <CreditCard size={36} className="mx-auto text-[#CBD5E1] mb-3" />
                    <p className="text-[#94A3B8] text-sm font-semibold">
                      {search || filterStatus !== 'all' ? 'No subscriptions match your filters' : 'No subscriptions found'}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((sub, idx) => {
                    const status = getStatus(sub);
                    const isToggling = togglingId === sub.id;
                    const timeLeft = getTimeLeft(sub.end_date);
                    
                    return (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-[#F8FAFC] transition-colors group ${isToggling ? 'opacity-40' : ''}`}
                      >
                        <td className="px-6 py-4 text-xs font-bold text-[#94A3B8] font-mono">#{sub.id}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#1E293B]">{sub.user_name}</p>
                          <p className="text-[11px] text-[#64748B]">{sub.user_email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                              <CreditCard size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1E293B] capitalize">{sub.plan_name || 'Premium Access'}</p>
                              <p className="text-[10px] text-[#94A3B8] font-bold uppercase">₹{sub.price}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                              <Calendar size={11} className="text-[#94A3B8]" />
                              <span>{new Date(sub.start_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })} — {new Date(sub.end_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                            </div>
                            {status === 'active' && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] w-fit px-1.5 py-0.5 rounded-md border border-[#DCFCE7]">
                                <Clock size={10} /> {timeLeft}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge text-[10px] font-bold uppercase tracking-wider ${
                            status === 'active' ? 'badge-green' : status === 'expired' ? 'badge-amber' : 'badge-red'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggle(sub.id, sub.is_active, sub.user_name)}
                            disabled={isToggling}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold ml-auto cursor-pointer disabled:opacity-50 border ${
                              sub.is_active 
                                ? 'text-[#DC2626] border-transparent hover:bg-[#FFF1F2] hover:border-[#FECDD3]' 
                                : 'text-[#16A34A] border-transparent hover:bg-[#F0FDF4] hover:border-[#DCFCE7]'
                            }`}
                          >
                            {sub.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            {sub.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[#F1F5F9] flex items-center justify-between bg-[#FAFAFA]">
            <p className="text-xs text-[#94A3B8] font-medium">
              Showing <span className="font-bold text-[#64748B]">{filtered.length}</span> of <span className="font-bold text-[#64748B]">{subscriptions.length}</span> records
            </p>
            {(search || filterStatus !== 'all') && (
              <button 
                onClick={() => { setSearch(''); setFilterStatus('all'); }} 
                className="text-xs text-[#2563EB] font-semibold hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Alert */}
      <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex gap-3">
        <AlertCircle size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
        <p className="text-xs text-[#64748B] leading-relaxed">
          <span className="font-bold text-[#1E293B]">Admin Override:</span> You can manually activate or deactivate any subscription. 
          Deactivating a subscription will immediately restrict the tenant's access to premium details regardless of their payment status or expiry date.
        </p>
      </div>

      <ConfirmModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
      />
    </AdminLayout>
  );
};

export default AdminSubscriptions;
