import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth`;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your registered email');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/forgot-password`, { email: formData.email });
      toast.success(res.data.message || 'OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/verify-reset-otp`, { 
        email: formData.email, 
        otp: formData.otp 
      });
      toast.success(res.data.message || 'OTP verified successfully');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reset-password`, {
        email: formData.email,
        newPassword: formData.newPassword
      });
      toast.success(res.data.message || 'Password reset successful!');
      setStep(4);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === 4 ? "All Set!" : "Reset Password"}
      subtitle={
        step === 1 ? "Enter your email to receive a reset code." :
        step === 2 ? "We've sent a 6-digit code to your email." :
        step === 3 ? "Choose a strong new password for your account." :
        "Your password has been updated. Redirecting to login..."
      }
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSendOTP}
            className="space-y-5"
          >
            <Input
              label="Registered Email"
              type="email"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              prefix={<Mail size={16} />}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Send Reset Code <ArrowRight size={16} />
            </Button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm font-medium text-[#6B7280] hover:text-[#4F46E5] flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOTP}
            className="space-y-5"
          >
            <Input
              label="Enter 6-Digit Code"
              type="text"
              placeholder="XXXXXX"
              maxLength={6}
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              prefix={<ShieldCheck size={16} />}
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Verify OTP <ArrowRight size={16} />
            </Button>
            <div className="flex justify-between items-center mt-4">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-[#6B7280] hover:text-[#4F46E5] flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Edit Email
              </button>
              <button 
                type="button"
                onClick={handleSendOTP}
                className="text-sm font-medium text-[#4F46E5] hover:underline"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.form
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              prefix={<Lock size={16} />}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              prefix={<Lock size={16} />}
              required
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Reset Password <CheckCircle2 size={16} />
            </Button>
          </motion.form>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <div className="w-20 h-20 bg-[#DCFCE7] rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 size={40} className="text-[#22C55E]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2">Success!</h3>
            <p className="text-[#6B7280] mb-6">Your password has been reset successfully.</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ForgotPassword;
