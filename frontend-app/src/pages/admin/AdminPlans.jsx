import React, { useState, useEffect } from 'react';
import { IndianRupee, Edit2, Check, X, Clock, Plus, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ui/ConfirmModal';

const API = 'http://localhost:5000/api/admin/plans';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    duration_days: '',
    description: ''
  });

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API, { headers });
      setPlans(res.data);
    } catch (err) {
      console.error('Fetch plans error:', err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEditStart = (plan) => {
    setEditingPlan(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      description: plan.description || ''
    });
    setIsAdding(false);
  };

  const handleAddStart = () => {
    setIsAdding(true);
    setEditingPlan(null);
    setForm({ name: '', price: '', duration_days: '', description: '' });
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setIsAdding(false);
    setForm({ name: '', price: '', duration_days: '', description: '' });
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration_days) {
      return toast.error('Please fill in all required fields');
    }

    setActionLoading(true);
    try {
      if (isAdding) {
        await axios.post(API, form, { headers });
        toast.success('New plan created!');
      } else {
        await axios.put(`${API}/${editingPlan}`, form, { headers });
        toast.success('Plan updated successfully');
      }
      handleCancel();
      fetchPlans();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus, name) => {
    const action = currentStatus ? 'Disable' : 'Enable';
    
    setModal({
      isOpen: true,
      title: `${action} Plan?`,
      message: `Are you sure you want to ${action.toLowerCase()} the "${name}" plan? Tenants will ${currentStatus ? 'no longer' : 'now'} be able to see it in the list.`,
      type: currentStatus ? 'warning' : 'info',
      confirmText: `Yes, ${action}`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await axios.put(`${API}/${id}/toggle`, {}, { headers });
          toast.success(res.data.message);
          fetchPlans();
        } catch (err) {
          console.error('Toggle error:', err);
          toast.error('Failed to update plan status');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  return (
    <AdminLayout title="Subscription Plans" subtitle="Configure tenant membership tiers, pricing, and access durations.">
      
      {/* ── Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-sm font-bold text-[#1E293B]">All Managed Plans ({plans.length})</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#2563EB] hover:border-[#2563EB] transition-all shadow-soft cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {!isAdding && !editingPlan && (
            <button
              onClick={handleAddStart}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-blue hover:bg-[#1D4ED8] transition-all cursor-pointer"
            >
              <Plus size={16} /> Create New Plan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Input Form (only shows if adding/editing) */}
        {(isAdding || editingPlan) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-3xl border-2 border-[#2563EB] p-6 shadow-xl sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#1E293B]">{isAdding ? 'Create New Plan' : 'Edit Plan'}</h3>
                <button onClick={handleCancel} className="p-1.5 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5 ml-1">Plan Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Premium Plus"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-4 text-sm font-bold text-[#1E293B] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 outline-none transition-all placeholder-[#94A3B8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5 ml-1">Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                      <input
                        type="number"
                        value={form.price}
                        onChange={e => setForm({...form, price: e.target.value})}
                        placeholder="0"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-9 pr-4 text-sm font-bold text-[#1E293B] focus:border-[#2563EB] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5 ml-1">Days</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                      <input
                        type="number"
                        value={form.duration_days}
                        onChange={e => setForm({...form, duration_days: e.target.value})}
                        placeholder="30"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 pl-9 pr-4 text-sm font-bold text-[#1E293B] focus:border-[#2563EB] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1.5 ml-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Short summary of benefits..."
                    rows="3"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-4 text-sm font-medium text-[#1E293B] focus:border-[#2563EB] outline-none transition-all resize-none placeholder-[#94A3B8]"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold shadow-blue hover:bg-[#1D4ED8] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {actionLoading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={18} />}
                  {isAdding ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Plans List */}
        <div className={`${(isAdding || editingPlan) ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-soft h-[240px]">
                <div className="skeleton h-6 w-24 rounded-lg mb-4" />
                <div className="skeleton h-10 w-32 rounded-xl mb-6" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            ))
          ) : plans.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center text-center">
              <ShieldCheck size={48} className="text-[#CBD5E1] mb-4" />
              <p className="text-sm font-bold text-[#1E293B]">No Plans Configured</p>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-[240px]">Create your first subscription tier to start accepting membership payments.</p>
              <button onClick={handleAddStart} className="mt-6 text-[#2563EB] font-bold text-xs flex items-center gap-1.5 hover:underline cursor-pointer">
                <Plus size={14} /> Create One Now
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {plans.map((plan, idx) => {
                const isEditing = editingPlan === plan.id;
                const active = plan.is_active;
                
                return (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: active ? 1 : 0.6, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white rounded-3xl p-8 border-2 transition-all relative overflow-hidden group ${
                      isEditing ? 'border-[#2563EB] shadow-xl' : 'border-[#E2E8F0] hover:border-[#BFDBFE]'
                    } ${!active ? 'bg-[#F8FAFC]' : ''}`}
                  >
                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none transition-all duration-500 opacity-20 ${
                      !active ? 'bg-[#94A3B8]' : (plan.price > 500 ? 'bg-[#7C3AED]' : 'bg-[#2563EB]')
                    } group-hover:scale-125`} />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                          <h3 className={`text-xl font-black uppercase tracking-tighter ${!active ? 'text-[#64748B]' : 'text-[#1E293B]'}`}>{plan.name}</h3>
                          <div className="flex items-center gap-2">
                             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                !active 
                                ? 'text-[#94A3B8] bg-[#F1F5F9] border-[#E2E8F0]' 
                                : (plan.price > 500 ? 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]' : 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]')
                              }`}>
                                {plan.duration_days} Day Period
                              </span>
                              {!active && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border text-white bg-[#64748B] border-[#475569]">
                                  Disabled
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditStart(plan)}
                            className="p-2 text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleToggle(plan.id, plan.is_active, plan.name)}
                            disabled={actionLoading}
                            className={`p-2 rounded-xl transition-all cursor-pointer border border-transparent ${
                              plan.is_active 
                                ? 'text-[#16A34A] hover:bg-[#F0FDF4] hover:border-[#DCFCE7]' 
                                : 'text-[#DC2626] hover:bg-[#FFF1F2] hover:border-[#FECDD3]'
                            }`}
                            title={plan.is_active ? "Disable Plan" : "Enable Plan"}
                          >
                            {plan.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                        </div>
                      </div>

                      <div className={`flex items-baseline gap-1 mb-5 ${!active ? 'opacity-50' : ''}`}>
                        <IndianRupee size={24} className="text-[#1E293B] font-extrabold -mt-1" />
                        <span className="text-5xl font-black text-[#1E293B] tracking-tight">{Math.round(plan.price)}</span>
                        <span className="text-xs font-bold text-[#94A3B8] ml-1 uppercase letter-spacing-1">/ one-time</span>
                      </div>

                      <p className={`text-sm font-medium leading-relaxed mb-6 line-clamp-3 ${!active ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                        {plan.description || "Unlock premium features for the duration of the plan including exact map locations."}
                      </p>

                      <div className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider group-hover:gap-2.5 transition-all ${
                        !active ? 'text-[#94A3B8]' : 'text-[#2563EB]'
                      }`}>
                        {active ? 'Plan Available' : 'Plan Paused'} <ArrowRight size={12} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Visibility Tip */}
      <div className="mt-8 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex gap-3">
        <AlertCircle size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
        <div className="text-xs text-[#64748B] leading-relaxed">
          <p className="font-bold text-[#1E293B] mb-0.5">Note on Plan Visibility:</p>
          Disabling a plan hides it from new tenants immediately. 
          Existing subscriptions linked to this plan will remain active until their expiry date. 
          This is a safer way to manage membership tiers than permanent deletion.
        </div>
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

export default AdminPlans;
