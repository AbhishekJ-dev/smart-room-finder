import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Home, List, MessageSquare, LogOut, Upload, MapPin, Phone, IndianRupee, X, ImagePlus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch owner's rooms
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/rooms/my-rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/rooms/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(rooms.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete room');
    }
  };

  const handleToggleBooked = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/rooms/${id}`, { is_booked: currentStatus ? 0 : 1 }, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(rooms.map(r => r.id === id ? { ...r, is_booked: !r.is_booked } : r));
    } catch (err) {
      alert('Failed to update room status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <div className="w-64 glass border-r border-white/10 p-6 flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">OwnerPanel</h2>
        <nav className="flex flex-col gap-4">
          <NavItem icon={<List size={20} />} label="My Listings" active />
          <NavItem icon={<Plus size={20} />} label="Add New Room" onClick={() => setShowAddForm(true)} />
          <NavItem icon={<MessageSquare size={20} />} label="Bookings" />
        </nav>
        <div className="mt-auto">
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-all cursor-pointer">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
            <p className="text-slate-400">Manage your properties and bookings.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus size={20} /> Add Property
          </button>
        </header>

        {/* Listings */}
        <h2 className="text-2xl font-bold mb-6">Your Properties ({rooms.length})</h2>
        {loading ? (
          <p className="text-slate-400">Loading your rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Home size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Properties Yet</h3>
            <p className="text-slate-400 mb-6">Start by adding your first property listing.</p>
            <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold cursor-pointer">
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rooms.map(room => (
              <ListingCard key={room.id} room={room} onDelete={handleDelete} onToggle={handleToggleBooked} />
            ))}
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddForm && <AddRoomModal onClose={() => setShowAddForm(false)} onSuccess={() => { setShowAddForm(false); fetchRooms(); }} />}
    </div>
  );
};

/* ─── Add Room Modal with 5-photo minimum ─── */
const AddRoomModal = ({ onClose, onSuccess }) => {
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formData, setFormData] = useState({
    type: '1BHK', area: '', location: '', contact: '', description: '',
    price_daily: '', price_weekly: '', price_monthly: '', price_quarterly: '', price_yearly: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    // Create previews
    const newPreviews = [...previews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPreviews.push(ev.target.result);
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length < 5) {
      setError(`Minimum 5 photos required. You have ${photos.length}.`);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      photos.forEach(p => data.append('photos', p));
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/rooms', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"><X size={24} /></button>
        <h2 className="text-2xl font-bold mb-2">Add New Property</h2>
        <p className="text-slate-400 text-sm mb-6">Fill in all details and upload at least 5 photos.</p>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Photo Upload Section */}
          <div className="mb-6">
            <label className="block text-sm text-slate-300 mb-2 font-semibold">
              Room Photos <span className="text-red-400">* (Minimum 5 required)</span>
            </label>
            <div className="grid grid-cols-5 gap-3 mb-3">
              {previews.map((p, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1 cursor-pointer hover:bg-white/5 transition-all">
                <ImagePlus size={24} />
                <span className="text-xs">Add</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {photos.length >= 5 ? (
                <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14} /> {photos.length} photos uploaded</span>
              ) : (
                <span className="text-yellow-400">{photos.length}/5 photos (need {5 - photos.length} more)</span>
              )}
            </div>
          </div>

          {/* Room Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Room Type *</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500 transition-all">
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="PG">PG</option>
                <option value="Room">Room</option>
              </select>
            </div>
            <Input label="Area *" placeholder="e.g. Koramangala" value={formData.area} onChange={v => setFormData({...formData, area: v})} icon={<MapPin size={16} />} />
            <Input label="Exact Location *" placeholder="Full address" value={formData.location} onChange={v => setFormData({...formData, location: v})} icon={<MapPin size={16} />} />
            <Input label="Contact Number *" placeholder="Phone number" value={formData.contact} onChange={v => setFormData({...formData, contact: v})} icon={<Phone size={16} />} />
          </div>

          {/* Pricing */}
          <h3 className="text-lg font-bold mb-3">Pricing</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <PriceInput label="Daily" value={formData.price_daily} onChange={v => setFormData({...formData, price_daily: v})} />
            <PriceInput label="Weekly" value={formData.price_weekly} onChange={v => setFormData({...formData, price_weekly: v})} />
            <PriceInput label="Monthly" value={formData.price_monthly} onChange={v => setFormData({...formData, price_monthly: v})} />
            <PriceInput label="Quarterly" value={formData.price_quarterly} onChange={v => setFormData({...formData, price_quarterly: v})} />
            <PriceInput label="Yearly" value={formData.price_yearly} onChange={v => setFormData({...formData, price_yearly: v})} />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500 transition-all resize-none" placeholder="Describe your room..."></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

/* ─── Sub Components ─── */
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

const ListingCard = ({ room, onDelete, onToggle }) => (
  <div className="glass-card overflow-hidden flex flex-col md:flex-row gap-0 border border-white/5">
    <div className="w-full md:w-48 h-48 overflow-hidden relative shrink-0">
      <img src={room.photos?.[0] ? `http://localhost:5000${room.photos[0]}` : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400'} alt={room.area} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 text-xs font-bold uppercase bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">{room.type}</div>
    </div>
    <div className="p-6 flex-grow flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold">{room.area}</h3>
        <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${room.is_booked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {room.is_booked ? 'Booked' : 'Available'}
        </span>
      </div>
      <p className="text-purple-400 font-semibold text-lg mb-1">₹{room.price_monthly}/mo</p>
      <p className="text-slate-500 text-sm mb-4 flex-grow">{room.photos?.length || 0} photos uploaded</p>
      <div className="flex gap-3">
        <button onClick={() => onToggle(room.id, room.is_booked)} className="flex-grow py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
          Mark {room.is_booked ? 'Available' : 'Booked'}
        </button>
        <button onClick={() => onDelete(room.id)} className="py-2 px-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-all cursor-pointer">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

const Input = ({ label, placeholder, icon, value, onChange }) => (
  <div>
    <label className="block text-sm text-slate-400 mb-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 ${icon ? 'pl-10' : 'px-4'} pr-4 focus:outline-none focus:border-purple-500 transition-all`} />
    </div>
  </div>
);

const PriceInput = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs text-slate-500 mb-1">{label}</label>
    <input type="number" placeholder="₹" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500 transition-all" />
  </div>
);

export default OwnerDashboard;
