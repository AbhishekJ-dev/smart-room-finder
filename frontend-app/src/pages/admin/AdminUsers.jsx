import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Trash2, Calendar, User as UserIcon, Search, Hash, X, RefreshCw, Filter, Shield } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ui/ConfirmModal';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id, name) => {
    setModal({
      isOpen: true,
      title: 'Delete User?',
      message: `Are you sure you want to permanently delete user "${name}"? This will restrict their access to the platform immediately.`,
      type: 'danger',
      confirmText: 'Yes, Delete User',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await axios.delete(`${API}/users/${id}`, { headers });
          toast.success('User deleted successfully');
          setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
          console.error('Delete error:', err);
          toast.error('Failed to delete user');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch = !q || 
        u.name?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) || 
        String(u.id).includes(q);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  return (
    <AdminLayout title="User Management" subtitle="View and manage all registered tenants, owners, and system members.">
      
      {/* ── Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="w-full bg-white border border-[#E5E7EB] rounded-xl py-2.5 pl-9 pr-9 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all shadow-soft"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={13} />
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="appearance-none bg-white border border-[#E5E7EB] rounded-xl py-2.5 pl-8 pr-8 text-xs font-bold text-[#6B7280] outline-none focus:border-[#4F46E5] transition-all cursor-pointer shadow-soft"
            >
              <option value="all">All Roles</option>
              <option value="tenant">Tenants</option>
              <option value="owner">Owners</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#6B7280] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all shadow-soft cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  <div className="flex items-center gap-1"><Hash size={11} /> ID</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">User</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Role</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                  <div className="flex items-center gap-1"><Calendar size={11} /> Joined</div>
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
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
                    <UserIcon size={36} className="mx-auto text-[#CBD5E1] mb-3" />
                    <p className="text-[#9CA3AF] text-sm font-semibold">
                      {search || filterRole !== 'all' ? 'No users matching your criteria' : 'No users registered yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((user, idx) => {
                    const isDeleting = deletingId === user.id;
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`hover:bg-[#F9FAFB] transition-colors group ${isDeleting ? 'opacity-40' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-[#9CA3AF] font-mono">#{user.id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                              user.role === 'owner' ? 'bg-[#FAF5FF] text-[#7C3AED]' : 'bg-[#EEF2FF] text-[#4F46E5]'
                            }`}>
                              {user.name?.[0]?.toUpperCase() || <Shield size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#111827]">{user.name}</p>
                              <a href={`mailto:${user.email}`} className="text-[11px] text-[#6B7280] flex items-center gap-1 hover:text-[#4F46E5] transition-colors">
                                <Mail size={10} />{user.email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${user.role === 'owner' ? 'badge-purple' : 'badge-blue'} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                            <Calendar size={12} className="text-[#9CA3AF]" />
                            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={isDeleting}
                            className="p-2 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            title="Delete User"
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

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[#F3F4F6] flex items-center justify-between bg-[#FAFAFA]">
            <p className="text-xs text-[#9CA3AF] font-medium">
              Showing <span className="font-bold text-[#6B7280]">{filtered.length}</span> of <span className="font-bold text-[#6B7280]">{users.length}</span> registered users
            </p>
            {(search || filterRole !== 'all') && (
              <button 
                onClick={() => { setSearch(''); setFilterRole('all'); }} 
                className="text-xs text-[#4F46E5] font-semibold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
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

export default AdminUsers;
