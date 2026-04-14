import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, ShieldCheck, ShieldAlert,
  Pencil, Check, X, KeyRound, Loader2, ArrowRight, ArrowLeft, Send, Timer
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import StatusModal from '../ui/StatusModal';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

/* ── OTP Countdown Timer Component ───────────────────────────────── */
const OTPTimer = ({ initialMinutes = 5, onExpire }) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let myInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(myInterval);
          if (onExpire) onExpire();
        } else {
          setMinutes(minutes - 1);
          setSeconds(59);
        }
      }
    }, 1000);
    return () => clearInterval(myInterval);
  }, [minutes, seconds, onExpire]);

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
      <Timer size={14} className="animate-pulse" />
      <span>OTP expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</span>
    </div>
  );
};

/* ── OTP Input 6 Boxes ───────────────────────────────────────────── */
const OTPInput = ({ value, onChange, disabled }) => {
  const r0 = useRef(null), r1 = useRef(null), r2 = useRef(null);
  const r3 = useRef(null), r4 = useRef(null), r5 = useRef(null);
  const refs = [r0, r1, r2, r3, r4, r5];
  const digits = (value || '').split('');

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = '';
        onChange(next.join(''));
      } else if (i > 0) refs[i - 1].current?.focus();
    }
  };
  const handleChange = (e, i) => {
    const v = e.target.value.replace(/\D/, '').slice(-1);
    const next = [...digits]; next[i] = v;
    onChange(next.join(''));
    if (v && i < 5) refs[i + 1].current?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          disabled={disabled}
          value={digits[i] || ''} onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKey(e, i)} onPaste={handlePaste}
          className={`w-11 h-14 text-center text-xl font-black border-2 rounded-xl outline-none transition-all duration-200 bg-white text-[#111827]
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : digits[i] ? 'border-[#2563eb] bg-[#eff6ff] shadow-[0_0_0_3px_rgba(37,99,235,0.15)]' : 'border-[#e5e7eb] focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]'}`}
        />
      ))}
    </div>
  );
};

/* ── Shared Modal Shell ──────────────────────────────────────────── */
const ModalShell = ({ onClose, icon, title, subtitle, children }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[999] flex items-center justify-center p-4">
    <motion.div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e5e7eb] overflow-hidden z-10">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#60a5fa]" />
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-[#eff6ff] rounded-xl">{icon}</div>
              <h3 className="text-lg font-black text-[#111827]">{title}</h3>
            </div>
            <p className="text-xs text-[#6b7280] font-medium ml-10">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-xl transition-all cursor-pointer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </motion.div>
  </motion.div>
);

/* ── Verify Account Modal ────────────────────────────────────────── */
const VerifyModal = ({ user, onClose, onSuccess, showAlert }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const isOwner = user?.role === 'owner';
  const apiPath = isOwner ? '/api/owner' : `/api/users/${user?.id}`;
  const sendPath = isOwner ? `${apiPath}/send-otp` : `${apiPath}/send-verify-otp`;
  const confirmPath = isOwner ? `${apiPath}/verify-otp` : `${apiPath}/confirm-verify`;

  const sendOTP = async () => {
    setLoading(true);
    setIsExpired(false);
    try {
      await axios.post(sendPath, {}, { headers: authHeaders() });
      showAlert('OTP Sent', 'An authentication code has been sent to your email address.', 'success');
      setStep(2);
    } catch (err) {
      showAlert('Mail Error', err.response?.data?.message || 'Failed to send OTP. Please check your connection.', 'error');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      await axios.post(confirmPath, { otp }, { headers: authHeaders() });
      showAlert('Account Verified', 'Your identity has been successfully confirmed. You can now access all features.', 'success');
      await refreshUser();
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err) {
      showAlert('Invalid Code', err.response?.data?.message || 'The OTP entered is incorrect or expired. Please try again.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <ModalShell onClose={onClose}
      icon={<ShieldCheck size={18} className="text-[#2563eb]" />}
      title="Verify Your Account"
      subtitle={step === 1 ? `An OTP will be sent to ${user?.email}` : 'Check your email for the OTP'}
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="v1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            <div className="p-4 bg-[#eff6ff] rounded-2xl border border-[#dbeafe] flex items-center gap-3">
              <Mail size={18} className="text-[#2563eb] shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-black">OTP will be sent to</p>
                <p className="text-sm font-bold text-[#111827]">{user?.email}</p>
              </div>
            </div>
            {isOwner && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">Verification is required to list properties.</p>
              </div>
            )}
            <button onClick={sendOTP} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-60 shadow-[0_6px_20px_-6px_rgba(37,99,235,0.5)]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {loading ? 'Sending OTP...' : 'Send OTP to My Email'}
            </button>
          </motion.div>
        ) : (
          <motion.div key="v2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
            <div className="flex flex-col items-center">
              <OTPTimer onExpire={() => setIsExpired(true)} />
              <p className="text-xs text-[#9ca3af] mt-3">Check your <span className="font-bold text-[#2563eb]">email</span> for the code</p>
            </div>
            <OTPInput value={otp} onChange={setOtp} disabled={isExpired || loading} />
            <div className="space-y-2.5">
              <button onClick={verifyOTP} disabled={loading || otp.length < 6 || isExpired}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-[0_6px_20px_-6px_rgba(16,185,129,0.4)]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Verifying...' : 'Confirm & Verify Account'}
              </button>
              <button onClick={() => { setStep(1); setOtp(''); setIsExpired(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[#6b7280] hover:text-[#111827] text-sm font-bold rounded-2xl hover:bg-[#f3f4f6] transition-all cursor-pointer">
                <ArrowLeft size={14} />
                {isExpired ? 'OTP Expired - Resend' : 'Resend OTP'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalShell>
  );
};

/* ── Email Change Modal ──────────────────────────────────────────── */
const EmailModal = ({ user, onClose, onSuccess, showAlert }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const sendOTP = async () => {
    if (!newEmail) return showAlert('Email Required', 'Please enter a valid email address.', 'error');
    setLoading(true);
    setIsExpired(false);
    try {
      await axios.post(`/api/users/${user?.id}/send-email-otp`, { newEmail }, { headers: authHeaders() });
      showAlert('OTP Sent', `Email updated to ${newEmail}. Please verify it using the OTP sent.`, 'success');
      await refreshUser(); // Fetch the new email and is_verified=false
      setStep(2);
    } catch (err) {
      showAlert('Update Error', err.response?.data?.message || 'Failed to prepare email change.', 'error');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length < 6) return showAlert('Invalid Code', 'Please enter a 6-digit verification code.', 'error');
    setLoading(true);
    try {
      await axios.post(`/api/users/${user?.id}/update-email`, { otp }, { headers: authHeaders() });
      showAlert('Success', 'Email updated and verified successfully.', 'success');
      await refreshUser();
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err) {
      showAlert('Verification Failed', err.response?.data?.message || 'Invalid OTP code provided.', 'error');
    } finally { setLoading(false); }
  };

  return (
    <ModalShell onClose={onClose}
      icon={<Mail size={18} className="text-[#2563eb]" />}
      title="Change Email Address"
      subtitle={step === 1 ? 'Enter your new email address.' : `OTP sent for ${newEmail}`}
    >
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="e1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#6b7280] mb-1.5">New Email Address</label>
              <input type="email" placeholder="name@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/20 bg-[#f9fafb] transition-all" />
            </div>
            <button onClick={sendOTP} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-60 shadow-[0_6px_20px_-6px_rgba(37,99,235,0.5)]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Sending OTP...' : 'Generate OTP'}
            </button>
          </motion.div>
        ) : (
          <motion.div key="e2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
            <div className="flex flex-col items-center">
              <OTPTimer onExpire={() => setIsExpired(true)} />
              <p className="text-xs text-[#9ca3af] mt-3">Enter the code sent to your <span className="font-bold text-[#2563eb]">new email</span></p>
            </div>
            <OTPInput value={otp} onChange={setOtp} disabled={isExpired || loading} />
            <div className="space-y-2.5">
              <button onClick={verifyOTP} disabled={loading || otp.length < 6 || isExpired}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-[0_6px_20px_-6px_rgba(37,99,235,0.5)]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {loading ? 'Verifying...' : 'Verify & Update Email'}
              </button>
              <button onClick={() => { setStep(1); setOtp(''); setIsExpired(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-[#6b7280] hover:text-[#111827] text-sm font-bold rounded-2xl hover:bg-[#f3f4f6] transition-all cursor-pointer">
                <ArrowLeft size={14} />
                {isExpired ? 'OTP Expired - Resend' : 'Back & Resend OTP'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalShell>
  );
};

/* ── Profile Component ───────────────────────────────────────────── */
const Profile = ({ userId: propsUserId }) => {
  const { refreshUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const showAlert = (title, message, type = 'info') => setModal({ show: true, title, message, type });

  const fetchProfile = async () => {
    const userId = propsUserId || localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const updated = await refreshUser();
      if (updated) {
        setUserData(updated);
        setNameValue(updated.name || '');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [propsUserId]);

  const saveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === userData?.name) {
      setEditingName(false); return;
    }
    setNameLoading(true);
    const userId = localStorage.getItem('userId');
    try {
      await axios.put(`/api/users/${userId}/name`, { name: nameValue.trim() }, { headers: authHeaders() });
      setUserData(prev => ({ ...prev, name: nameValue.trim() }));
      setEditingName(false);
      showAlert('Success', 'Profile name updated successfully.', 'success');
    } catch (err) {
      showAlert('Update Failed', err.response?.data?.message || 'Failed to update name.', 'error');
    } finally { setNameLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!userData) return (
    <div className="p-8 text-center bg-white rounded-3xl border border-[#e5e7eb]">
      <p className="text-[#6b7280]">Failed to load profile data.</p>
    </div>
  );

  const isVerified = !!userData?.is_verified;
  const isOwner = userData?.role === 'owner';

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          {/* Hero gradient */}
          <div className="h-32 bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center shrink-0 z-10 transition-transform hover:scale-105">
                <User size={48} className="text-[#2563eb]" />
              </div>
              <div className="pt-3">
                <h2 className="text-2xl font-black text-[#111827] leading-tight">{userData.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <p className="text-[#6b7280] text-sm font-medium">{userData.email}</p>
                  {isVerified && <ShieldCheck size={14} className="text-emerald-500 fill-emerald-50" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
               {/* Role Badge Section */}
               <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
                 <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                       <KeyRound size={13} className="text-slate-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Type</span>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                   isOwner ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-sky-50 text-sky-600 border-sky-100'
                 }`}>
                   {userData.role}
                 </span>
               </div>

              {/* Full Name */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] group">
                <div className="p-2.5 bg-white rounded-xl text-[#2563eb] shadow-sm border border-[#e5e7eb] shrink-0">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-black mb-1">Full Name</p>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input autoFocus value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                        className="flex-1 min-w-0 border border-[#2563eb] rounded-xl px-3 py-1.5 text-sm text-[#111827] outline-none bg-white font-bold" />
                      <button onClick={saveName} className="p-1.5 bg-[#2563eb] text-white rounded-xl">
                        {nameLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#111827] truncate">{userData.name}</p>
                      <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#6b7280] hover:text-[#2563eb] transition-all"><Pencil size={13} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] group">
                <div className="p-2.5 bg-white rounded-xl text-[#2563eb] shadow-sm border border-[#e5e7eb] shrink-0">
                  <Mail size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-black mb-1">Email Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#111827] truncate">{userData.email}</p>
                    <button onClick={() => setShowEmailModal(true)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#2563eb] hover:bg-[#eff6ff] rounded-xl border border-transparent hover:border-[#dbeafe] transition-all">
                      <Pencil size={11} /> Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className={`p-2.5 rounded-xl shadow-sm border shrink-0 ${isVerified ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-white text-amber-500 border-amber-100'}`}>
                  {isVerified ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-[#6b7280] font-black mb-1">Verification Status</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-black ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isVerified ? 'Verified Account' : 'Action Required'}
                    </span>
                    {!isVerified && (
                      <button onClick={() => setShowVerifyModal(true)}
                        className="text-[11px] font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm">
                        Verify Now
                      </button>
                    )}
                  </div>
                  {!isVerified && isOwner && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">Please verify to unlock property listing feature.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVerifyModal && (
          <VerifyModal
            user={userData}
            onClose={() => setShowVerifyModal(false)}
            onSuccess={() => setUserData(prev => ({ ...prev, is_verified: true }))}
            showAlert={showAlert}
          />
        )}
        {showEmailModal && (
          <EmailModal
            user={userData}
            onClose={() => setShowEmailModal(false)}
            onSuccess={(newEmail) => setUserData(prev => ({ ...prev, email: newEmail, is_verified: false }))}
            showAlert={showAlert}
          />
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={modal.show}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </>
  );
};

export default Profile;
