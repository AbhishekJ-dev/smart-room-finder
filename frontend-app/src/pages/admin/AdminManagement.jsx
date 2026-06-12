import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Mail, Trash2, Calendar, Search, Hash, X, Plus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL, API_BASE_URL } from '../../utils/api';

const API = `${API_URL}/admin`;

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not super_admin (fail-safe)
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [user, navigate]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admins`, { headers });
      setAdmins(res.data);
    } catch (err) {
      console.error('Fetch admins error:', err);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleDelete = async (id, name) => {
    setModal({
      isOpen: true,
      title: 'Remove Admin?',
      message: `Are you sure you want to permanently remove admin "${name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Yes, Remove Admin',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await axios.delete(`${API}/admins/${id}`, { headers });
          toast.success('Admin removed successfully');
          setAdmins(prev => prev.filter(a => a.id !== id));
        } catch (err) {
          console.error('Delete error:', err);
          toast.error(err.response?.data?.message || 'Failed to remove admin');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/admins`, formData, { headers });
      toast.success('Admin created successfully');
      setAdmins([res.data, ...admins]);
      setAddModalOpen(false);
      setShowPassword(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
    } catch (err) {
      console.error('Add admin error:', err);
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return admins.filter(a => {
      return !q || 
        a.name?.toLowerCase().includes(q) || 
        a.email?.toLowerCase().includes(q) || 
        String(a.id).includes(q);
    });
  }, [admins, search]);

  return (
    <AdminLayout title="Admin Management" subtitle="Manage system administrators and their roles securely.">
      
      {/* ── Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search admins by name or email..."
              className="w-full bg-card border border-border rounded-xl py-2.5 pl-9 pr-9 text-sm text-main-text placeholder-[#9CA3AF] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all shadow-soft"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-main-text cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-semibold hover:bg-[#4338CA] transition-colors shadow-soft cursor-pointer"
          >
            <Plus size={16} />
            Add Admin
          </button>
        </div>
      </div>

      {/* ── Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">
                  <div className="flex items-center gap-1"><Hash size={11} /> ID</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Admin Profile</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Role</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">
                  <div className="flex items-center gap-1"><Calendar size={11} /> Created On</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} className="px-6 py-4">
                        <div className="skeleton h-4 w-full rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <Shield size={36} className="mx-auto text-[#CBD5E1] mb-3" />
                    <p className="text-secondary-text text-sm font-semibold">
                      {search ? 'No admins matching your search' : 'No administrators found'}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((admin, idx) => {
                    const isDeleting = deletingId === admin.id;
                    const isSelf = user?.id === admin.id;
                    return (
                      <motion.tr
                        key={admin.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-background transition-colors group ${isDeleting ? 'opacity-40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-secondary-text font-mono">#{admin.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                              admin.role === 'super_admin' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-primary/10 text-primary'
                            }`}>
                              {admin.name?.[0]?.toUpperCase() || <Shield size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-main-text flex items-center gap-2">
                                {admin.name}
                                {isSelf && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">You</span>}
                              </p>
                              <a href={`mailto:${admin.email}`} className="text-[11px] text-secondary-text flex items-center gap-1 hover:text-primary transition-colors">
                                <Mail size={10} />{admin.email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${admin.role === 'super_admin' ? 'badge-amber' : 'badge-blue'} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5`}>
                            {admin.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-secondary-text font-medium">
                            <Calendar size={12} className="text-secondary-text" />
                            {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(admin.id, admin.name)}
                            disabled={isDeleting || isSelf}
                            className={`p-2 rounded-xl transition-all ${
                              isSelf 
                                ? 'text-[#CBD5E1] cursor-not-allowed' 
                                : 'text-secondary-text hover:text-error hover:bg-[#FFF1F2] cursor-pointer'
                            }`}
                            title={isSelf ? "Cannot delete yourself" : "Remove Admin"}
                          >
                            <Trash2 size={16} />
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

      {/* Add Admin Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {addModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" style={{ margin: 0 }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAddModalOpen(false)}
                className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
              />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-border overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-main-text leading-none">Add Administrator</h3>
                    <p className="text-xs text-secondary-text font-medium mt-1">Create a new admin account.</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-2 text-secondary-text hover:bg-background rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-main-text uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-main-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-main-text uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-main-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-main-text uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-main-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-main-text cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-main-text uppercase tracking-wider mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-main-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary-text hover:bg-background transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-[#4338CA] transition-colors shadow-soft disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[100px]"
                  >
                    {submitting ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Create Admin'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        </AnimatePresence>,
        document.body
      )}

    </AdminLayout>
  );
};

export default AdminManagement;
