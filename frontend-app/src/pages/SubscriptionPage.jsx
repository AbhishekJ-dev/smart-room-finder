import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Zap, Star, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const SubscriptionPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);

    useEffect(() => {
        fetchPlans();
        loadRazorpayScript();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axios.get(`${API}/subscriptions/plans`);
            setPlans(res.data);
        } catch (error) {
            toast.error('Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    };

    const handleSubscribe = async (planId) => {
        setPurchasing(planId);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Create Order in Backend
            const { data: orderData } = await axios.post(`${API}/subscriptions/create-order`, { planId }, { headers });

            // 2. Open Razorpay Checkout
            const options = {
                key: 'rzp_test_placeholder_key', // This should ideally be fetched from backend or env
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Smart Room Finder',
                description: `Subscription: ${orderData.planName}`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    // 3. Verify Payment
                    try {
                        await axios.post(`${API}/subscriptions/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, { headers });

                        toast.success('Subscription activated successfully!');
                        navigate('/user-dashboard');
                    } catch (err) {
                        toast.error('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                },
                theme: {
                    color: '#2563EB',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setPurchasing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black text-[#1E293B] mb-4"
                >
                    Unlock Your Perfect Room
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-[#64748B] max-w-2xl mx-auto"
                >
                    Choose a plan to get instant access to owner contacts, exact locations, and priority booking features.
                </motion.p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {plans.map((plan, idx) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -12, transition: { duration: 0.3 } }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSubscribe(plan.id)}
                        className={`bg-white rounded-3xl border ${idx === 1 ? 'border-[#2563EB] shadow-xl ring-4 ring-[#2563EB]/10' : 'border-[#E2E8F0] shadow-soft'} overflow-hidden flex flex-col cursor-pointer transition-shadow hover:shadow-2xl`}
                    >
                        {idx === 1 && (
                            <div className="bg-[#2563EB] text-white text-center py-2 text-xs font-black uppercase tracking-widest">
                                Most Popular
                            </div>
                        )}
                        <div className="p-8 flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-[#1E293B]">{plan.name}</h3>
                                {idx === 1 ? <Zap className="text-[#2563EB] fill-[#2563EB]" /> : <Star className="text-[#94A3B8]" />}
                            </div>
                            <div className="flex items-baseline mb-8">
                                <span className="text-5xl font-black text-[#1E293B]">₹{Math.round(plan.price)}</span>
                                <span className="text-[#64748B] ml-2 text-lg">/ {plan.duration_days} days</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <FeatureItem text="Unlock exact room locations" />
                                <FeatureItem text="Get direct owner contact details" />
                                <FeatureItem text="Enable instant booking requests" />
                                <FeatureItem text="Verified listings access" />
                                <FeatureItem text="24/7 Priority Support" />
                            </ul>
                        </div>
                        <div className="p-8 pt-0 mt-auto">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSubscribe(plan.id); }}
                                disabled={purchasing !== null}
                                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                                    idx === 1 
                                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-blue' 
                                    : 'bg-[#F1F5F9] text-[#1E293B] hover:bg-[#E2E8F0]'
                                } disabled:opacity-50`}
                            >
                                {purchasing === plan.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Subscribe Now <ArrowRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-16 max-w-2xl mx-auto bg-white rounded-2xl p-6 border border-[#E2E8F0] flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-[#1E293B]">Secure Payments by Razorpay</h4>
                    <p className="text-sm text-[#64748B]">Your transaction is protected with 128-bit SSL encryption. We don't store your card details.</p>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ text }) => (
    <li className="flex items-center gap-3 text-sm text-[#475569] font-medium">
        <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
            <Check size={14} />
        </div>
        {text}
    </li>
);

export default SubscriptionPage;
