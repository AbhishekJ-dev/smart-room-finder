import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { User, Shield, Mail, CheckCircle } from 'lucide-react';

const CompleteRegistration = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: searchParams.get('name') || '',
        email: searchParams.get('email') || '',
        googleId: searchParams.get('googleId') || '',
        role: ''
    });
    
    const [picture] = useState(searchParams.get('picture') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!formData.email || !formData.googleId) {
            navigate('/login');
        }
    }, [formData, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.role) {
            setError("Please select your role (Tenant or Owner).");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/complete-google-registration', formData);
            const { token, user } = res.data;

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userId', user.id);

            // Update axios header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Redirect based on role
            if (user.role === 'admin') {
                window.location.href = '/admin-dashboard';
            } else if (user.role === 'owner') {
                window.location.href = '/owner-dashboard';
            } else {
                window.location.href = '/user-dashboard';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete registration');
            setLoading(false);
        }
    };

    return (
        <AuthLayout 
            title="Complete Registration" 
            subtitle="Finalize your account to start looking for rooms."
        >
            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl font-bold flex items-center gap-3 shadow-sm animate-shake">
                    <Mail size={16} className="shrink-0" /> {error}
                </div>
            )}

            {picture && (
                <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                        <img 
                            src={picture} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full border-4 border-[#2563eb]/10 p-1 object-cover shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                            <CheckCircle size={12} />
                        </div>
                    </div>
                    <p className="mt-3 text-[11px] uppercase tracking-widest font-black text-[#6b7280]">Google Account Verified</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ ...formData, role: 'user' });
                            setError('');
                        }}
                        className={`p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-3 cursor-pointer shadow-sm active:scale-[0.98] ${
                            formData.role === 'user'
                                ? 'bg-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/40 shadow-blue-500/5'
                                : 'bg-[#f9fafb] border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]'
                        }`}
                    >
                        <User size={24} /> Tenant
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({ ...formData, role: 'owner' });
                            setError('');
                        }}
                        className={`p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-[0.2em] flex flex-col items-center gap-3 cursor-pointer shadow-sm active:scale-[0.98] ${
                            formData.role === 'owner'
                                ? 'bg-[#2563eb]/5 text-[#2563eb] border-[#2563eb]/40 shadow-blue-500/5'
                                : 'bg-[#f9fafb] border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]'
                        }`}
                    >
                        <Shield size={24} /> Owner
                    </button>
                </div>

                <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    prefix={<User size={16} />}
                />

                <Input
                    label="Email Address"
                    value={formData.email}
                    readOnly
                    className="opacity-70 bg-gray-50"
                    prefix={<Mail size={16} />}
                />

                <Button 
                    type="submit" 
                    loading={loading} 
                    className="w-full py-4 rounded-2xl mt-4"
                >
                    Finish Registration 🚀
                </Button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-[#6b7280] text-[11px] font-black uppercase tracking-widest">
                    Wrong account? <button onClick={() => navigate('/login')} className="text-[#2563eb] font-black hover:underline ml-1">Go back</button>
                </p>
            </div>
        </AuthLayout>
    );
};

export default CompleteRegistration;
