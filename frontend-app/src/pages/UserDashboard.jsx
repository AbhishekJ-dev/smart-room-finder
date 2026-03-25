import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Phone, CreditCard, LogOut, User as UserIcon, Home, Zap, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API}/rooms`);
        setRooms(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(r => {
    const matchSearch = r.area?.toLowerCase().includes(search.toLowerCase()) || r.type?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.type === filter;
    return matchSearch && matchFilter;
  });

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <div className="w-64 glass border-r border-white/10 p-6 flex flex-col gap-8 shrink-0">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">SmartFinder</h2>
        <nav className="flex flex-col gap-4">
          <NavItem icon={<Home size={20} />} label="Search Rooms" active />
          <NavItem icon={<Zap size={20} />} label="My Bookings" />
          <NavItem icon={<CreditCard size={20} />} label="Subscription" />
          <NavItem icon={<UserIcon size={20} />} label="Profile" />
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
            <p className="text-slate-400">Find your perfect stay today.</p>
          </div>
          {!isSubscribed && (
            <motion.button whileHover={{ scale: 1.02 }} className="bg-gradient-to-r from-yellow-500 to-orange-600 px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer">
              <CreditCard size={16} /> Get Subscription
            </motion.button>
          )}
        </header>

        {/* Search + Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search by area or room type..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="glass px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
            <Filter size={20} /> Filter
          </button>
        </div>

        {/* Filter chips */}
        {showFilters && (
          <div className="flex gap-3 mb-6 flex-wrap">
            {['All', '1BHK', '2BHK', 'PG', 'Room'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-slate-500 text-sm mb-4">{filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found</p>

        {/* Room Grid */}
        {loading ? (
          <p className="text-slate-400">Loading rooms...</p>
        ) : filteredRooms.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Search size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Rooms Found</h3>
            <p className="text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map(room => (
              <RoomCard key={room.id} room={room} isSubscribed={isSubscribed} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }) => (
  <button className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
    {icon} <span>{label}</span>
  </button>
);

const RoomCard = ({ room, isSubscribed }) => {
  const imgSrc = room.photos?.[0] ? `http://localhost:5000${room.photos[0]}` : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400';

  return (
    <motion.div whileHover={{ y: -5 }} className="glass-card overflow-hidden group border border-white/5 hover:border-white/20 transition-all">
      <div className="h-48 overflow-hidden relative">
        <img src={imgSrc} alt={room.type} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
        <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">{room.type}</div>
        {room.is_booked && <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-xs font-bold">Booked</div>}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-1">{room.area}</h3>
        <p className="text-blue-400 font-semibold mb-4 text-lg">₹{room.price_monthly}/mo</p>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin size={16} />
            {isSubscribed ? room.location : <span className="blur-sm select-none">Subscribe to see location</span>}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Phone size={16} />
            {isSubscribed ? room.contact : <span className="blur-sm select-none">Subscribe to see contact</span>}
          </div>
        </div>
        <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-blue-600 hover:border-blue-600 transition-all cursor-pointer">
          {isSubscribed ? (room.is_booked ? 'Room Booked' : 'Book Now') : 'Unlock Details'}
        </button>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
