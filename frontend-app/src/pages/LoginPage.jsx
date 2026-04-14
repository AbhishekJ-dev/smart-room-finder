import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get('error');
    if (errParam) {
      if (errParam === 'google_failed') {
        setError('Google Sign-In failed. Please try again.');
      } else if (errParam === 'server_error') {
        setError('Server error during Google Sign-In. Please try again later.');
      } else {
        setError(errParam);
      }
      window.history.replaceState({}, document.title, '/login');
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all details correctly.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'owner') navigate('/owner-dashboard');
      else navigate('/user-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue finding your perfect room."
    >
      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#DC2626] text-sm rounded-xl font-medium flex items-center gap-2.5 animate-shake">
          <span className="shrink-0">⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={e => {
            setFormData({ ...formData, email: e.target.value });
            if (error === 'Please fill in all details correctly.') setError('');
          }}
          prefix={<Mail size={16} />}
          error={error === 'Please fill in all details correctly.' && !formData.email.trim() ? true : undefined}
        />
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={e => {
            setFormData({ ...formData, password: e.target.value });
            if (error === 'Please fill in all details correctly.') setError('');
          }}
          prefix={<Lock size={16} />}
          error={error === 'Please fill in all details correctly.' && !formData.password.trim() ? true : undefined}
        />

        <div className="flex justify-end mt-[-8px]">
          <Link to="/forgot-password" size="sm" className="text-[#2563EB] text-[13px] font-semibold hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full py-3 rounded-xl mt-1">
          Sign In <ArrowRight size={16} />
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#E2E8F0]" />
        <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-widest">or continue with</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#E2E8F0]" />
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={() => {
          window.top.location.href = 'http://localhost:5000/auth/google';
        }}
        className="w-full py-3.5 bg-white border border-[#E2E8F0] shadow-sm rounded-xl font-bold text-[#1E293B] flex items-center justify-center gap-3 hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:shadow-md transition-all cursor-pointer text-sm active:scale-[0.98]"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="text-center text-sm text-[#64748B] mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#2563EB] font-semibold hover:underline">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
