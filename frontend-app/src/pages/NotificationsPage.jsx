import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock, CheckCircle2, Trash2, MailOpen } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { API_URL, API_BASE_URL } from '../utils/api';

const API = `${API_URL}/notifications`;

const NotificationsPage = () => {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(API, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchNotifications();
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${API}/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    return (
        <DashboardLayout title="Notification Center" subtitle="View and manage all your alerts">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-main-text">All Notifications</h2>
                            <p className="text-xs text-secondary-text">{notifications.filter(n => !n.is_read).length} unread</p>
                        </div>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                        <button 
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <MailOpen size={14} />
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="p-12 text-center bg-card rounded-2xl border border-border">
                            <div className="animate-spin w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-sm text-secondary-text">Loading notifications...</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={notification.id}
                                className={`group p-5 bg-card rounded-2xl border transition-all hover:shadow-md flex items-center gap-5 relative ${
                                    !notification.is_read ? 'border-[#4F46E5] bg-primary/10/10' : 'border-border'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    !notification.is_read ? 'bg-primary text-white' : 'bg-section text-secondary-text'
                                }`}>
                                    <Bell size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-relaxed mb-1 ${!notification.is_read ? 'text-main-text font-bold' : 'text-secondary-text'}`}>
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3 text-[11px] text-secondary-text">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                                        </div>
                                        {notification.is_read && (
                                            <div className="flex items-center gap-1 text-success">
                                                <CheckCircle2 size={12} />
                                                <span>Read</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!notification.is_read && (
                                    <button 
                                        onClick={() => markAsRead(notification.id)}
                                        className="p-2 text-secondary-text hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                        title="Mark as read"
                                    >
                                        <MailOpen size={18} />
                                    </button>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-16 text-center bg-card rounded-3xl border-2 border-dashed border-border">
                            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-secondary-text">
                                <Bell size={36} />
                            </div>
                            <h3 className="text-lg font-bold text-main-text mb-2">No notifications yet</h3>
                            <p className="text-sm text-secondary-text max-w-xs mx-auto">
                                We'll notify you here about bookings, subscriptions, and account activity.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NotificationsPage;
