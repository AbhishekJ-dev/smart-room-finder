import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Home, List, MessageSquare, MapPin, Phone, X, XCircle,
  ImagePlus, Trash2, CheckCircle, Eye, ChevronLeft, ChevronRight,
  Camera, Calendar, User, IndianRupee, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Lightbox } from '../components/ui/Lightbox';
import Profile from '../components/dashboard/Profile';
import axios from 'axios';
import ConfirmModal from '../components/ui/ConfirmModal';
import StatusModal from '../components/ui/StatusModal';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const OwnerDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [activeView, setActiveView] = useState('listings');
  const [rooms, setRooms]           = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex]   = useState(0);
  const [lightboxOpen, setLightboxOpen]     = useState(false);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type = 'info') => setModal({ show: true, title, message, type });
 
  const triggerConfirm = (options) => {
    setConfirmState({
      isOpen: true,
      title: options.title || 'Are you sure?',
      message: options.message || 'This action cannot be undone.',
      onConfirm: options.onConfirm || (() => {}),
      type: options.type || 'info',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel'
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [roomsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/rooms/my-rooms`, { headers }),
        axios.get(`${API}/bookings/owner`, { headers })
      ]);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    refreshUser(); // Proactively fetch latest verification status from DB on mount
  }, []);

  const handleDelete = (id) => {
    triggerConfirm({
      title: 'Delete Property?',
      message: 'Are you sure you want to delete this property? This action is permanent and cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API}/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          setRooms(rooms.filter(r => r.id !== id));
          showAlert('Property Deleted', 'Your listing has been permanently removed from the platform.', 'success');
        } catch { 
          showAlert('Deletion Failed', 'We encountered an error while trying to delete this property.', 'error');
        }
      }
    });
  };

  const handleToggleBooked = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/rooms/${id}`, { is_booked: currentStatus ? 0 : 1 }, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(rooms.map(r => r.id === id ? { ...r, is_booked: !r.is_booked } : r));
      showAlert('Status Updated', `Property is now marked as ${!currentStatus ? 'Booked' : 'Available'}.`, 'success');
    } catch { 
      showAlert('Update Failed', 'Failed to toggle property availability status.', 'error');
    }
  };

  const getImgSrc = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
  };

  const openLightbox = (photos, startIdx = 0) => {
    setLightboxImages(photos.map(p => getImgSrc(p)));
    setLightboxIndex(startIdx);
    setLightboxOpen(true);
  };

  const handleBookingStatus = async (bookingId, status) => {
    const action = status === 'confirmed' ? 'Approve' : status === 'rejected' ? 'Decline' : 'Update';
    
    triggerConfirm({
      title: `${action} Request?`,
      message: `Are you sure you want to ${status} this booking request?`,
      type: status === 'rejected' ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`${API}/bookings/${bookingId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
          fetchData();
          showAlert('Booking Updated', `The booking request has been successfully ${status}.`, 'success');
        } catch (err) {
          showAlert('Update Failed', err.response?.data?.message || 'Failed to update booking status.', 'error');
        }
      }
    });
  };

  const navItems = [
    { id: 'listings',  icon: <List size={16} />,          label: 'My Properties' },
    { id: 'bookings',  icon: <MessageSquare size={16} />,  label: 'Bookings' },
    { id: 'add',       icon: <Plus size={16} />,           label: 'Add Property' },
  ];

  const isVerified = !!user?.is_verified;

  const handleNavClick = (id) => {
    if (id === 'add') {
      if (!isVerified) {
        triggerConfirm({
          title: 'Verification Required',
          message: 'Please verify your email address to unlock property listings. Verification helps us maintain a secure platform.',
          type: 'warning',
          confirmText: 'Go to Profile',
          cancelText: 'Maybe Later',
          onConfirm: () => setActiveView('profile')
        });
        return;
      }
      setShowAddModal(true);
    } else {
      setActiveView(id);
    }
  };

  const stats = [
    { label: 'Total Listings', value: rooms.length,                                     bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Available',      value: rooms.filter(r => !r.is_booked).length,           bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Total Bookings', value: bookings.length,                                  bg: '#FFFBEB', color: '#D97706' },
  ];

  const viewTitles = {
    listings: { 
      title: `Welcome, ${user?.name}`, 
      subtitle: (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#64748B]">Manage your properties and track bookings.</span>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
              <CheckCircle size={10} /> Verified Owner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-100 animate-pulse">
              <ShieldAlert size={10} /> Verification Required
            </span>
          )}
        </div>
      )
    },
    bookings: { title: 'Bookings',               subtitle: 'Review and respond to booking requests.' },
    profile:  { title: 'My Profile',             subtitle: 'Manage your personal details.' },
  };

  const current = viewTitles[activeView] || viewTitles.listings;

  return (
    <>
      <DashboardLayout
        title={current.title}
        subtitle={current.subtitle}
        navItems={navItems.map(item => ({
          ...item,
          disabled: item.id === 'add' && !isVerified,
          tooltip: item.id === 'add' && !isVerified ? 'Verify email to unlock' : null
        }))}
        activeNav={activeView}
        onNavClick={handleNavClick}
      >
        {/* Stats */}
        {activeView !== 'profile' && (
          <div className="grid grid-cols-3 gap-4 mb-7">
            {stats.map(s => (
              <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-soft text-center">
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-[#64748B] font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* View Content */}
        <AnimatePresence mode="wait">
          {activeView === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1E293B]">Your Properties</h3>
                <span className="badge badge-neutral text-xs">{rooms.length} listed</span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-soft">
                      <div className="skeleton h-52 w-full" />
                      <div className="p-4 space-y-3">
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-3 w-1/2 rounded" />
                        <div className="skeleton h-10 w-full rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <EmptyState
                  icon={<Home size={36} />}
                  message="No Properties Yet"
                  subtitle="Start by adding your first property to reach thousands of seekers."
                  action={
                    <button 
                      onClick={() => {
                        if (!isVerified) {
                          triggerConfirm({
                            title: 'Verification Required',
                            message: 'You need to verify your email address before you can add properties.',
                            type: 'warning',
                            confirmText: 'Go to Profile',
                            cancelText: 'Close',
                            onConfirm: () => setActiveView('profile')
                          });
                        } else {
                          setShowAddModal(true);
                        }
                      }} 
                      className={`btn-primary text-sm mt-4 px-6 py-2.5 ${!isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Add Your First Property
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {rooms.map(room => (
                    <ListingCard
                      key={room.id}
                      room={room}
                      onDelete={handleDelete}
                      onToggle={handleToggleBooked}
                      onViewPhotos={openLightbox}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'bookings' && (
            <motion.div key="bookings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#1E293B]">Booking Requests</h3>
                <span className="badge badge-neutral text-xs">{bookings.length} total</span>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-soft space-y-3">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl w-full" />)}
                </div>
              ) : bookings.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare size={36} />}
                  message="No Bookings Yet"
                  subtitle="When tenants book your rooms, their requests will appear here."
                />
              ) : (
                <BookingsTable bookings={bookings} onStatusUpdate={handleBookingStatus} />
              )}
            </motion.div>
          )}


        </AnimatePresence>

        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            images={lightboxImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </DashboardLayout>

      {/* Add Property Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1E293B]/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-card"
            >
              <AddPropertyForm
                onClose={() => setShowAddModal(false)}
                onSuccess={() => { setShowAddModal(false); fetchData(); showAlert('Listing Published', 'Your new property is now live and visible to all users.', 'success'); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Prompt */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
      />

      <StatusModal
        isOpen={modal.show}
        onClose={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
};

/* ── Bookings Table ── */
const BookingsTable = ({ bookings, onStatusUpdate }) => (
  <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-soft overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[700px]">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {['Guest', 'Property', 'Duration & Price', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {bookings.map((b, idx) => (
            <motion.tr
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="hover:bg-[#F8FAFC] transition-colors group"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#EFF6FF] rounded-xl flex items-center justify-center text-[#2563EB] font-bold text-sm shrink-0">
                    {b.user_name?.[0]?.toUpperCase() || <User size={14} />}
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">{b.user_name}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-semibold text-[#1E293B] truncate max-w-[160px]">{b.room_area}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{b.room_type}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
                  <Calendar size={13} className="text-[#2563EB]" />
                  <span className="font-medium">{b.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-[#2563EB] mt-0.5">
                  <IndianRupee size={12} />{parseFloat(b.total_price).toLocaleString()}
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`badge text-[11px] ${
                  b.status === 'confirmed' ? 'badge-green' :
                  b.status === 'pending'   ? 'badge-amber' :
                  b.status === 'completed' ? 'badge-blue'  : 'badge-red'
                }`}>{b.status}</span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button
                        onClick={() => onStatusUpdate(b.id, 'confirmed')}
                        className="px-3 py-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold rounded-lg hover:bg-[#BBF7D0] transition-all cursor-pointer whitespace-nowrap"
                      >Approve</button>
                      <button
                        onClick={() => onStatusUpdate(b.id, 'rejected')}
                        className="px-3 py-1.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#DC2626] text-xs font-semibold rounded-lg hover:bg-[#FECDD3] transition-all cursor-pointer whitespace-nowrap"
                      >Decline</button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => onStatusUpdate(b.id, 'completed')}
                      className="px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold rounded-lg hover:bg-[#BFDBFE] transition-all cursor-pointer whitespace-nowrap"
                    >Mark Done</button>
                  )}
                  {(b.status === 'completed' || b.status === 'rejected') && (
                    <span className="text-xs text-[#CBD5E1] font-medium">—</span>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── Listing Card ── */
const ListingCard = ({ room, onDelete, onToggle, onViewPhotos }) => {
  const [currentImg, setCurrentImg] = useState(0);

  let photos = [];
  try {
    photos = typeof room.photos === 'string' ? JSON.parse(room.photos) : (room.photos || []);
    photos = photos.filter(Boolean);
  } catch { photos = []; }

  const getImgSrc = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=600';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
  };

  const imgSrc = getImgSrc(photos[currentImg] || photos[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col group shadow-soft hover:border-[#BFDBFE] transition-all duration-300 cursor-pointer"
    >
      {/* Image carousel */}
      <div className="relative h-52 overflow-hidden bg-[#F1F5F9]">
        <img
          src={imgSrc}
          alt={room.area}
          onClick={() => photos.length > 0 && onViewPhotos(photos, currentImg)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setCurrentImg(i => i === 0 ? photos.length-1 : i-1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-[#1E293B] opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-soft cursor-pointer z-10">
              <ChevronLeft size={14} />
            </button>
            <button onClick={e => { e.stopPropagation(); setCurrentImg(i => i === photos.length-1 ? 0 : i+1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-[#1E293B] opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-soft cursor-pointer z-10">
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className="badge badge-neutral text-[10px]">{room.type}</span>
          <span className={`badge text-[10px] ${room.is_booked ? 'badge-red' : room.has_pending ? 'badge-amber' : 'badge-green'}`}>
            {room.is_booked ? 'Booked' : room.has_pending ? 'Pending' : 'Available'}
          </span>
        </div>

        {/* Photo count */}
        {photos.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onViewPhotos(photos, currentImg); }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-medium hover:bg-black/70 transition-colors cursor-pointer z-10"
          >
            <Camera size={11} />{photos.length}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-[#1E293B] text-base mb-3 truncate">
          {room.city ? `${room.city}, ` : ''}{room.area}
        </h3>

        <div className="space-y-2 mb-4 text-sm">
          {room.location && (
            <div className="flex items-start gap-2 text-[#64748B]">
              <MapPin size={13} className="text-[#2563EB] mt-0.5 shrink-0" />
              <span className="truncate font-medium">{room.location}</span>
            </div>
          )}
          {room.contact && (
            <div className="flex items-center gap-2 text-[#64748B]">
              <Phone size={13} className="text-[#2563EB] shrink-0" />
              <span className="font-medium">{room.contact}</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-5 pt-3 border-t border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-1 text-[#2563EB] font-bold text-lg">
              <IndianRupee size={14} />{room.price_monthly?.toLocaleString()}
            </div>
            <p className="text-[10px] text-[#94A3B8] font-medium">/month</p>
          </div>
          {(room.annual_rent > 0) && (
            <div>
              <div className="flex items-center gap-1 text-[#22C55E] font-semibold text-sm">
                <IndianRupee size={12} />{room.annual_rent?.toLocaleString()}
              </div>
              <p className="text-[10px] text-[#94A3B8] font-medium">/year</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => onToggle(room.id, room.is_booked)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              room.is_booked
                ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB] hover:bg-[#BFDBFE]'
                : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] hover:bg-[#BBF7D0]'
            }`}
          >
            {room.is_booked ? 'Set Available' : 'Set Booked'}
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="w-10 h-10 flex items-center justify-center bg-[#FFF1F2] border border-[#FECDD3] text-[#DC2626] rounded-xl hover:bg-[#FECDD3] transition-all cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Empty State ── */
const EmptyState = ({ icon, message, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#E2E8F0] rounded-2xl shadow-soft">
    <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center text-[#CBD5E1] mb-5">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-[#1E293B] mb-2">{message}</h3>
    <p className="text-[#64748B] text-sm max-w-xs">{subtitle}</p>
    {action}
  </div>
);

/* ── Add Property Form ── */
const AddPropertyForm = ({ onClose, onSuccess }) => {
  const [photos, setPhotos]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [step, setStep]       = useState(1);
  const [formData, setFormData] = useState({
    type: '1BHK', city: '', area: '', location: '', contact: '', description: '',
    price_daily: '', price_weekly: '', price_monthly: '', price_yearly: '',
    tenant_type: 'Anyone', annualRent: ''
  });

  const fd = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setPreviews(p => [...p, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const validateStep1 = () => {
    if (!formData.area.trim() || !formData.location.trim() || !formData.contact.trim()) {
      setError('Please fill Area, Location, and Contact fields.');
      return false;
    }
    if (!formData.price_monthly && !formData.price_daily) {
      setError('Provide at least Monthly or Daily rent.');
      return false;
    }
    if (formData.contact.length < 10) { setError('Please enter a valid 10-digit phone number.'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length < 5) { setError(`Minimum 5 photos required. You have ${photos.length}.`); return; }
    setLoading(true);
    try {
      const data = new FormData();
      photos.forEach(p => data.append('photos', p));
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      const token = localStorage.getItem('token');
      await axios.post(`${API}/rooms`, data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-[#1E293B]">Add New Property</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Step {step} of 2</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B] transition-all cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#DC2626] text-sm rounded-xl flex items-center gap-2.5 font-medium">
          <X size={15} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Room Type</label>
                <select value={formData.type} onChange={e => fd('type', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#2563EB] transition-colors">
                  {['1BHK','2BHK','Room'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Suitable For</label>
                <select value={formData.tenant_type} onChange={e => fd('tenant_type', e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#2563EB] transition-colors">
                  <option value="Anyone">Anyone</option>
                  <option value="Boys">Boys Only</option>
                  <option value="Girls">Girls Only</option>
                </select>
              </div>
            </div>

            {[
              { label: 'City *', key: 'city', placeholder: 'e.g. Mumbai, Bangalore, Delhi' },
              { label: 'Area / Locality *', key: 'area', placeholder: 'e.g. Koramangala, HSR Layout' },
              { label: 'Exact Address *', key: 'location', placeholder: 'Full address with landmarks' },
              { label: 'Contact Number *', key: 'contact', placeholder: '10-digit mobile number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{f.label}</label>
                <input
                  type="text" placeholder={f.placeholder} value={formData[f.key]}
                  onChange={e => fd(f.key, e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all placeholder-[#94A3B8]"
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Monthly Rent (₹)', key: 'price_monthly' },
                { label: 'Daily Rent (₹)', key: 'price_daily' },
                { label: 'Yearly Rent (₹)', key: 'price_yearly' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">{f.label}</label>
                  <input
                    type="number" placeholder="0" value={formData[f.key]}
                    onChange={e => fd(f.key, e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#2563EB] transition-all"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-semibold transition-all shadow-blue cursor-pointer mt-2"
            >
              Next: Upload Photos →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-3">
                Property Photos <span className="text-[#DC2626]">(minimum 5 required)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#E2E8F0] group">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute inset-0 bg-[#DC2626]/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={18} className="text-white" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center text-[#2563EB] gap-1.5 cursor-pointer hover:bg-[#EFF6FF] hover:border-[#2563EB] transition-all">
                  <ImagePlus size={22} />
                  <span className="text-[11px] font-semibold">Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">{previews.length}/5+ photos added</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-1.5">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={e => fd('description', e.target.value)}
                placeholder="Describe amenities, rules, nearby landmarks..."
                rows={3}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-2.5 px-3 text-sm text-[#1E293B] font-medium outline-none focus:border-[#2563EB] transition-all resize-none placeholder-[#94A3B8]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-[#E2E8F0] text-[#64748B] rounded-xl text-sm font-semibold hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                ← Back
              </button>
              <Button type="submit" loading={loading} className="flex-[2] py-3 rounded-xl text-sm shadow-blue">
                Publish Listing
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default OwnerDashboard;
