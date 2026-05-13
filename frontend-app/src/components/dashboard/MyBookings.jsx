import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, MapPin, CreditCard, Search, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { Badge } from '../ui/Badge';

axios.defaults.baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

const MyBookings = ({ userId: propsUserId, onExploreRooms }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        console.log("Fetching bookings for userId:", userId);
        if (userId) {
            fetchBookings(userId);
        } else {
            setLoading(false);
        }
    }, [propsUserId]);

    const fetchBookings = async (userId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/bookings/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Bookings API Response:", res.data);
            setBookings(res.data);
        } catch (err) {
            console.error('Fetch bookings error:', err);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="h-48 rounded-3xl bg-card border border-[#e5e7eb] animate-pulse shadow-sm" />
                ))}
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card border border-[#e5e7eb] rounded-3xl shadow-sm"
            >
                <div className="w-20 h-20 bg-[#f9fafb] rounded-full flex items-center justify-center mb-6 border border-[#e5e7eb]">
                    <CreditCard size={32} className="text-[#6b7280]/30" />
                </div>
                <h3 className="text-xl font-black mb-2 text-main-text">No bookings yet</h3>
                <p className="text-[#6b7280] text-sm mb-8 max-w-xs leading-relaxed">
                    You haven't made any room bookings yet. Find your perfect stay today!
                </p>
                <button
                    onClick={onExploreRooms}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-black rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-[#4F46E5]/20 cursor-pointer"
                >
                    <Search size={16} />
                    Explore Rooms
                </button>
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking, idx) => (
                <motion.div
                    key={booking.booking_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card rounded-3xl border border-[#e5e7eb] overflow-hidden flex flex-col sm:flex-row shadow-sm hover:shadow-md transition-all group"
                >
                    {/* Room Image */}
                    <div className="w-full sm:w-40 h-40 shrink-0 relative overflow-hidden">
                        <img 
                            src={(() => {
                                const path = booking.image;
                                if (!path) return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400';
                                if (path.startsWith('http')) return path;
                                return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${path}`;
                            })()} 
                            alt={booking.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-2 left-2">
                            <Badge variant={booking.status === 'confirmed' ? 'emerald' : booking.status === 'pending' ? 'blue' : 'red'}>
                                {booking.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-extrabold text-main-text text-lg leading-tight tracking-tight">{booking.title}</h3>
                                <p className="text-primary font-black text-sm">₹{booking.price}</p>
                            </div>
                            <p className="text-[#6b7280] text-xs font-medium flex items-center gap-1.5 mb-4">
                                <MapPin size={12} className="text-[#6b7280]/60" /> {booking.area}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-[#f3f4f6]">
                           <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <p className="text-[9px] uppercase tracking-widest text-[#6b7280] font-black">Duration</p>
                                    <p className="text-xs font-bold text-main-text">{booking.duration}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] uppercase tracking-widest text-[#6b7280] font-black">Total</p>
                                    <p className="text-xs font-bold text-main-text">₹{booking.total_price}</p>
                                </div>
                           </div>
                           <ChevronRight size={16} className="text-[#6b7280]/40 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default MyBookings;
