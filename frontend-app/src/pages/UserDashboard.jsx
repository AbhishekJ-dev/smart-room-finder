import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, MapPin, Phone, Home, CalendarCheck,
  User as UserIcon, Camera, Heart, SlidersHorizontal, Lock, Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { FilterDropdown } from '../components/ui/FilterDropdown';
import { Lightbox } from '../components/ui/Lightbox';
import { BookingModal } from '../components/ui/BookingModal';
import Profile from '../components/dashboard/Profile';
import MyBookings from '../components/dashboard/MyBookings';
import StatusModal from '../components/ui/StatusModal';
import RatingModal from '../components/ui/RatingModal';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const TENANT_BADGE = {
  Boys:   { label: 'Boys Only', color: 'badge-blue' },
  Girls:  { label: 'Girls Only', color: 'badge-purple' },
  Anyone: { label: 'For Everyone', color: 'badge-green' },
};

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('rooms');

  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('All');
  const [tenantFilter, setTenantFilter] = useState('All');
  const [minPrice, setMinPrice]         = useState(1000);
  const [maxPrice, setMaxPrice]         = useState(50000);
  const [showFilters, setShowFilters]   = useState(false);

  const [rooms, setRooms]               = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex]   = useState(0);
  const [lightboxOpen, setLightboxOpen]     = useState(false);

  const [bookingRoom, setBookingRoom]         = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [lastBookingId, setLastBookingId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type = 'info') => setModal({ show: true, title, message, type });

  const filterRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [rRes, bRes] = await Promise.all([
        axios.get(`${API}/rooms`, { headers }),
        axios.get(`${API}/bookings/my-bookings`, { headers })
      ]);
      setRooms(rRes.data);
      setUserBookings(bRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = room => { setBookingRoom(room); setShowBookingModal(true); };

  const handleBookingConfirm = async ({ duration, total_price, start_date, end_date }) => {
    if (!bookingRoom) return;
    setBookingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/bookings`,
        { room_id: bookingRoom.id, duration, total_price, start_date, end_date },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLastBookingId(res.data.bookingId);
      setShowBookingModal(false);
      setBookingRoom(null);
      fetchData();
      showAlert('Request Sent', 'Your booking request has been submitted. Please wait for the owner to approve it.', 'success');
      setActiveTab('bookings');
      // Show rating modal after a small delay
      setTimeout(() => setShowRatingModal(true), 1500);
    } catch (err) {
      showAlert('Booking Failed', err.response?.data?.message || 'We could not process your booking at this time.', 'error');
    } finally {
      setBookingLoading(false);
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

  const normalize = val => val?.toLowerCase().replace(/\s/g, '') || '';

  const filteredRooms = rooms.filter(r => {
    const s = search.toLowerCase().trim();
    const matchSearch = !s ||
      normalize(r.area).includes(normalize(s)) ||
      normalize(r.type).includes(normalize(s)) ||
      normalize(r.location).includes(normalize(s)) ||
      normalize(r.city).includes(normalize(s));
    const matchType   = typeFilter === 'All' || normalize(r.type) === normalize(typeFilter);
    const matchTenant = tenantFilter === 'All' ||
      normalize(r.tenant_type) === normalize(tenantFilter) ||
      normalize(r.tenant_type) === 'anyone';
    const matchPrice  = (r.price_monthly || 0) >= minPrice && (r.price_monthly || 0) <= maxPrice;
    return matchSearch && matchType && matchTenant && matchPrice;
  });

  const hasFilters = typeFilter !== 'All' || tenantFilter !== 'All' || minPrice !== 1000 || maxPrice !== 50000;

  const navItems = [
    { id: 'rooms',    icon: <Home size={16} />,       label: 'Search Rooms' },
    { id: 'bookings', icon: <CalendarCheck size={16} />, label: 'My Bookings' },
  ];

  const pageTitles = {
    rooms:    { title: 'Find Your Room', subtitle: 'Browse verified listings from trusted owners.' },
    bookings: { title: 'My Bookings',    subtitle: 'Track your current and past booking requests.' },
    profile:  { title: 'My Profile',     subtitle: 'Manage your personal details and preferences.' },
  };

  const current = pageTitles[activeTab] || pageTitles.rooms;

  return (
    <DashboardLayout
      title={current.title}
      subtitle={current.subtitle}
      navItems={navItems}
      activeNav={activeTab}
      onNavClick={setActiveTab}
    >
      {activeTab === 'rooms' ? (
        <div className="max-w-[1400px] mx-auto">
          {/* Search + Filter Bar */}
          <div className="flex gap-3 mb-6 relative z-20">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text group-focus-within:text-primary transition-colors" size={17} />
              <input
                type="text"
                placeholder="Search by area, city, or room type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-main-text placeholder-[#9CA3AF] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all shadow-soft"
              />
            </div>

            <div className="relative shrink-0" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border shadow-soft cursor-pointer ${
                  showFilters || hasFilters
                    ? 'bg-primary/10 border-[#4F46E5] text-primary'
                    : 'bg-card border-border text-secondary-text hover:border-[#CBD5E1]'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {hasFilters && (
                  <span className="w-4 h-4 bg-primary text-white rounded-full text-[9px] flex items-center justify-center font-bold">!</span>
                )}
              </button>
              <FilterDropdown
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={{ typeFilter, tenantFilter, minPrice, maxPrice }}
                setters={{ setTypeFilter, setTenantFilter, setMinPrice, setMaxPrice }}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-secondary-text font-medium">
              <span className="text-main-text font-semibold">{filteredRooms.length}</span> properties found
            </p>
            {hasFilters && (
              <button
                onClick={() => { setTypeFilter('All'); setTenantFilter('All'); setMinPrice(1000); setMaxPrice(50000); }}
                className="text-xs text-error hover:underline font-medium cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden shadow-soft">
                  <div className="skeleton h-52 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-3/4 rounded-lg" />
                    <div className="skeleton h-3 w-1/2 rounded-lg" />
                    <div className="skeleton h-10 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-center shadow-soft">
              <div className="w-16 h-16 bg-section rounded-2xl flex items-center justify-center mb-5">
                <Search size={28} className="text-[#CBD5E1]" />
              </div>
              <h3 className="text-lg font-semibold text-main-text mb-2">No rooms found</h3>
              <p className="text-secondary-text text-sm max-w-xs mb-5">Try adjusting your search or clearing filters.</p>
              <button
                onClick={() => { setSearch(''); setTypeFilter('All'); setTenantFilter('All'); setMinPrice(1000); setMaxPrice(50000); }}
                className="px-5 py-2.5 bg-section text-secondary-text text-sm font-semibold rounded-xl hover:bg-[#E5E7EB] transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRooms.map((room, idx) => (
                <UserRoomCard
                  key={room.id}
                  room={room}
                  delay={idx * 0.04}
                  onBook={() => openBookingModal(room)}
                  onViewPhotos={openLightbox}
                  userBookings={userBookings}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'bookings' ? (
        <MyBookings userId={user?.id} onExploreRooms={() => setActiveTab('rooms')} />
      ) : (
        <Profile userId={user?.id} />
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={lightboxImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => { setShowBookingModal(false); setBookingRoom(null); }}
            room={bookingRoom}
            onConfirm={handleBookingConfirm}
            loading={bookingLoading}
            showAlert={showAlert}
          />
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={modal.show}
        onClose={() => setModal({ ...modal, show: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <RatingModal
        isOpen={showRatingModal}
        bookingId={lastBookingId}
        onClose={() => setShowRatingModal(false)}
      />
    </DashboardLayout>
  );
};

/* ── User Room Card ── */
const UserRoomCard = ({ room, delay, onBook, onViewPhotos, userBookings = [] }) => {
  const navigate = useNavigate();
  let photos = [];
  try {
    photos = typeof room.photos === 'string' ? JSON.parse(room.photos) : (room.photos || []);
    photos = photos.filter(Boolean);
  } catch { photos = []; }

  const getImgSrc = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const imgSrc = getImgSrc(photos[0]);
  
  // Combine City and Area for a more descriptive location
  const displayLocation = room.city ? `${room.city}, ${room.area}` : room.area;

  const badge = TENANT_BADGE[room.tenant_type] || TENANT_BADGE['Anyone'];
  const isMyBooking = userBookings.some(b => b.room_id === room.id && b.status === 'confirmed');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col group shadow-soft hover:border-[#C7D2FE] transition-all duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-section">
        <img
          src={imgSrc}
          alt={room.area}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
          onClick={() => photos.length > 0 && onViewPhotos(photos, 0)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge badge-blue text-[11px]">{room.type}</span>
          {isMyBooking && <span className="badge badge-green text-[11px]">✓ Booked</span>}
          {!isMyBooking && room.is_booked && <span className="badge badge-red text-[11px]">Booked</span>}
          {!isMyBooking && room.has_pending && <span className="badge badge-amber text-[11px]">Pending</span>}
        </div>

        {photos.length > 0 && (
          <button
            onClick={() => onViewPhotos(photos, 0)}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-medium hover:bg-black/70 transition-colors cursor-pointer"
          >
            <Camera size={11} />
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-main-text text-base leading-snug flex-1 min-w-0 truncate">
            {displayLocation}
          </h3>
          <div className="text-right shrink-0">
            <p className="text-primary font-bold text-lg leading-tight">₹{room.price_monthly?.toLocaleString()}</p>
            <p className="text-secondary-text text-[10px] font-medium">/month</p>
            {(room.annual_rent > 0 || room.price_yearly > 0) && (
              <p className="text-success font-semibold text-xs mt-0.5">₹{(room.annual_rent || room.price_yearly)?.toLocaleString()}/yr</p>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-sm text-secondary-text">
            <MapPin size={13} className="text-primary mt-0.5 shrink-0" />
            {room.is_locked ? (
              <span className="italic flex items-center gap-1.5 opacity-60">
                <Lock size={12} /> Exact location locked
              </span>
            ) : (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(room.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors truncate font-medium"
                onClick={e => e.stopPropagation()}
              >
                {room.location}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-secondary-text">
            <Phone size={13} className="text-primary shrink-0" />
            {room.is_locked ? (
              <span className="italic flex items-center gap-1.5 opacity-60">
                <Lock size={12} /> Contact hidden
              </span>
            ) : (
              <a
                href={`tel:${room.contact}`}
                className="hover:text-primary transition-colors font-medium"
                onClick={e => e.stopPropagation()}
              >
                {room.contact}
              </a>
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="mb-4">
          <span className={`badge ${badge.color} text-[11px]`}>{badge.label}</span>
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          {isMyBooking ? (
            <div className="w-full py-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-xl text-sm font-semibold text-center">
              ✓ Your Booking Confirmed
            </div>
          ) : room.is_booked ? (
            <div className="w-full py-3 bg-background border border-border text-secondary-text rounded-xl text-sm font-semibold text-center cursor-not-allowed">
              Already Booked
            </div>
          ) : room.is_locked ? (
            <button
              onClick={() => navigate('/subscribe')}
              className="w-full py-3 bg-[#111827] hover:bg-[#0F172A] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <Lock size={14} /> Subscribe to Unlock Details
            </button>
          ) : room.has_pending ? (
            <div className="w-full py-3 bg-[#FFFBEB] border border-[#FDE68A] text-warning rounded-xl text-sm font-semibold text-center cursor-not-allowed">
              Pending Approval
            </div>
          ) : (
            <button
              onClick={onBook}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition-all shadow-blue hover:shadow-lg active:scale-[0.98] cursor-pointer"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
