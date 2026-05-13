import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, Phone, Trash2, Home, IndianRupee, Search, Calendar, 
  Hash, Building2, X, RefreshCw, User, ChevronRight, ArrowLeft, Mail
} from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ui/ConfirmModal';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`;

const AdminProperties = () => {
  const [view, setView] = useState('owners'); // 'owners' | 'detail'
  const [owners, setOwners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/owners`, { headers });
      setOwners(res.data);
    } catch (err) {
      console.error('Fetch owners error:', err);
      toast.error('Failed to load owners');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerProperties = async (owner) => {
    setLoading(true);
    setSelectedOwner(owner);
    try {
      const res = await axios.get(`${API}/properties/owner/${owner.owner_id}`, { headers });
      setProperties(res.data);
      setView('detail');
    } catch (err) {
      console.error('Fetch owner properties error:', err);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'owners') fetchOwners();
  }, [view]);

  const handleDelete = async (id, name) => {
    setModal({
      isOpen: true,
      title: 'Delete Listing?',
      message: `Are you sure you want to delete the property listing at "${name}"? This action is permanent and cannot be undone.`,
      type: 'warning',
      confirmText: 'Yes, Delete Listing',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await axios.delete(`${API}/properties/${id}`, { headers });
          toast.success('Property deleted successfully');
          setProperties(prev => prev.filter(p => p.id !== id));
        } catch (err) {
          console.error('Delete error:', err);
          toast.error('Failed to delete property');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const getImageSrc = (property) => {
    try {
      const photos = typeof property.photos === 'string'
        ? JSON.parse(property.photos) : (property.photos || []);
      const filtered = photos.filter(Boolean);
      if (filtered.length === 0) return null;
      
      const path = filtered[0];
      if (path.startsWith('http')) return path;
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
    } catch { return null; }
  };

  const filteredOwners = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return owners;
    return owners.filter(o => o.email?.toLowerCase().includes(q) || String(o.owner_id).includes(q));
  }, [owners, search]);

  const filteredProperties = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return properties;
    return properties.filter(p =>
      p.city?.toLowerCase().includes(q) ||
      p.area?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  }, [properties, search]);

  return (
    <AdminLayout 
      title="Property Management" 
      subtitle={view === 'owners' 
        ? "Browse properties grouped by their listing owners." 
        : `Managing properties for ${selectedOwner?.email}`
      }
    >

      {/* ── Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {view === 'detail' && (
            <button 
              onClick={() => { setView('owners'); setSearch(''); }}
              className="p-2 bg-card border border-border rounded-xl text-secondary-text hover:text-primary hover:border-[#4F46E5] transition-all cursor-pointer shadow-soft"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="relative w-full sm:w-[340px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={view === 'owners' ? "Search by owner email..." : "Search by city, area or type..."}
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary/10 border border-[#C7D2FE] rounded-xl">
            <Building2 size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">
              {view === 'owners' ? `${owners.length} Owners` : `${properties.length} Listings`}
            </span>
          </div>
          <button
            onClick={view === 'owners' ? fetchOwners : () => fetchOwnerProperties(selectedOwner)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-secondary-text hover:border-[#4F46E5] hover:text-primary transition-all shadow-soft cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'owners' ? (
          <motion.div
            key="owners-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Owner</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Member ID</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Properties</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}>
                        {[1,2,3,4].map(j => (
                          <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded-lg" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredOwners.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-secondary-text text-sm font-semibold">No owners found</td>
                    </tr>
                  ) : filteredOwners.map((owner) => (
                    <tr 
                      key={owner.owner_id} 
                      onClick={() => fetchOwnerProperties(owner)}
                      className="hover:bg-background cursor-pointer group transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-main-text">{owner.email}</p>
                            <span className="text-[10px] text-secondary-text font-bold uppercase">System Owner</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-secondary-text font-mono">#{owner.owner_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-lg bg-[#F0FDF4] text-[#16A34A] text-xs font-bold border border-[#DCFCE7]">
                            {owner.total_properties} Listings
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end text-primary font-bold text-xs gap-1 group-hover:translate-x-1 transition-transform">
                          View Properties <ChevronRight size={14} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="property-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">ID</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Property</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Location</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Price / mo</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">Status</th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-secondary-text text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {loading ? (
                    [1,2,3].map(i => (
                      <tr key={i}>
                        {[1,2,3,4,5,6].map(j => (
                          <td key={j} className="px-6 py-4"><div className="skeleton h-4 w-full rounded-lg" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-secondary-text text-sm font-semibold">No listings for this owner</td>
                    </tr>
                  ) : filteredProperties.map((property, idx) => {
                    const imgSrc = getImageSrc(property);
                    const isDeleting = deletingId === property.id;
                    return (
                      <motion.tr
                        key={property.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`hover:bg-background transition-colors ${isDeleting ? 'opacity-40' : ''}`}
                      >
                        <td className="px-6 py-4 text-xs font-bold text-secondary-text font-mono">#{property.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-section overflow-hidden shrink-0 border border-border">
                              {imgSrc ? (
                                <img src={imgSrc} alt={property.area} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home size={16} className="text-[#CBD5E1]" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-main-text">{property.type}</p>
                              <span className="text-[10px] text-secondary-text font-bold uppercase">{property.tenant_type || 'Shared'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-1.5 max-w-[180px]">
                            <MapPin size={12} className="text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-main-text">{property.city || '—'}</p>
                              <p className="text-[10px] text-secondary-text line-clamp-1">{property.area}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-0.5 text-sm font-bold text-main-text">
                            <IndianRupee size={12} className="text-[#16A34A]" />
                            {Number(property.price_monthly).toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge text-[10px] font-bold border ${
                            property.is_booked ? 'badge-amber border-[#FEF3C7]' : 'badge-green border-[#DCFCE7]'
                          }`}>
                            {property.is_booked ? 'Occupied' : 'Vacant'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDelete(property.id, `${property.city}, ${property.area}`)}
                              disabled={isDeleting}
                              className="p-2 text-error hover:bg-[#FFF1F2] rounded-xl transition-all cursor-pointer disabled:opacity-50"
                              title="Delete Listing"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default AdminProperties;
