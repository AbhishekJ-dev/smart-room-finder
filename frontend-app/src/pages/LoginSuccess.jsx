import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // We'll manually update auth state or use a dedicated method

  useEffect(() => {
    const token = searchParams.get('token');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');

    const newUser = searchParams.get('newUser');
    const googleId = searchParams.get('googleId');
    const picture = searchParams.get('picture');

    if (newUser === 'true') {
      // Pass Google info to the completion page
      const params = new URLSearchParams({
        email: email || '',
        name: name || '',
        googleId: googleId || '',
        picture: picture || ''
      });
      navigate(`/complete-registration?${params.toString()}`);
      return;
    }

    if (token && id && email) {
      const userData = { id, name, email, role };
      
      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', id);

      // Update axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Redirect based on role
      if (role === 'admin') {
        window.location.href = '/admin-dashboard';
      } else if (role === 'owner') {
        window.location.href = '/owner-dashboard';
      } else {
        window.location.href = '/user-dashboard';
      }
    } else {
      // Missing info, go back to login
      navigate('/login?error=auth_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-card relative overflow-hidden">
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="w-12 h-12 border-[4px] border-[#4F46E5]/10 border-t-[#4F46E5] rounded-full animate-spin mb-6" />
      <p className="text-[11px] uppercase tracking-[0.4em] font-black text-[#6b7280] animate-pulse">Completing Sign In...</p>
    </div>
  );
};

export default LoginSuccess;
