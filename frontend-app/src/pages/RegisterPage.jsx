import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { validatePassword } from '../utils/passwordValidation';

import { User, Shield, Mail, Lock, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role) { setError('Please select your role first.'); return; }
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all details correctly.');
      return;
    }
    
    const { isValid, errors } = validatePassword(formData.password);
    if (!isValid) {
      setError(errors[0]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(formData.name, formData.email, formData.password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands finding their perfect room smartly."
    >
      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-error text-sm rounded-xl font-medium flex items-center gap-2.5 animate-shake">
          <span className="shrink-0">⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-3" noValidate>
        {/* Role Selection */}
        <div className="flex bg-background p-1.5 rounded-[14px] border border-border relative">
          <button
            type="button"
            onClick={() => { setRole('user'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer z-10 ${
              role === 'user' ? 'text-primary shadow-sm bg-card border border-border' : 'text-secondary-text hover:text-main-text border border-transparent'
            }`}
          >
            <User size={16} className={role === 'user' ? 'text-primary' : 'text-secondary-text'} />
            Tenant
          </button>
          <button
            type="button"
            onClick={() => { setRole('owner'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer z-10 ${
              role === 'owner' ? 'text-primary shadow-sm bg-card border border-border' : 'text-secondary-text hover:text-main-text border border-transparent'
            }`}
          >
            <Shield size={16} className={role === 'owner' ? 'text-primary' : 'text-secondary-text'} />
            Owner
          </button>
        </div>

        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={e => {
            setFormData({ ...formData, name: e.target.value });
            if (error === 'Please fill in all details correctly.') setError('');
          }}
          prefix={<User size={16} />}
          error={error === 'Please fill in all details correctly.' && !formData.name.trim() ? true : undefined}
        />
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
        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={e => {
            setFormData({ ...formData, password: e.target.value });
            if (error) setError('');
          }}
          prefix={<Lock size={16} />}
          required
        />

        <Button type="submit" loading={loading} className="w-full py-3 rounded-xl mt-1">
          Create Account <ArrowRight size={16} />
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#E5E7EB]" />
        <span className="text-[11px] text-secondary-text font-bold uppercase tracking-widest">or continue with</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#E5E7EB]" />
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={() => {
          if (!role) { setError('Please select your role first.'); return; }
          window.top.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google?role=${role}`;
        }}
        className="w-full py-3.5 bg-card border border-border shadow-sm rounded-xl font-bold text-main-text flex items-center justify-center gap-3 hover:bg-background hover:border-[#CBD5E1] hover:shadow-md transition-all cursor-pointer text-sm active:scale-[0.98]"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>

      <p className="text-center text-sm text-secondary-text mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;
