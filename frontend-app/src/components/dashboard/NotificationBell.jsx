import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:5000/api/notifications';

const NotificationBell = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotifications();
            // Polling every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API_URL}/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API_URL}/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const latestNotifications = notifications.slice(0, 5);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2563EB] transition-all cursor-pointer"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
                            <h3 className="font-bold text-[#1E293B]">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                            {latestNotifications.length > 0 ? (
                                latestNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                        className={`p-4 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors cursor-pointer relative ${!notification.is_read ? 'bg-[#EFF6FF]/30' : ''}`}
                                    >
                                        {!notification.is_read && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
                                        )}
                                        <div className="pl-2">
                                            <p className={`text-sm leading-relaxed ${!notification.is_read ? 'text-[#1E293B] font-semibold' : 'text-[#64748B]'}`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#94A3B8]">
                                                <Clock size={12} />
                                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-3 text-[#94A3B8]">
                                        <Bell size={20} />
                                    </div>
                                    <p className="text-sm text-[#94A3B8] font-medium">No new notifications</p>
                                </div>
                            )}
                        </div>

                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block p-3 text-center text-xs font-bold text-[#2563EB] hover:bg-[#F1F5F9] border-t border-[#E2E8F0] uppercase tracking-wider transition-colors"
                        >
                            View All Notifications
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
