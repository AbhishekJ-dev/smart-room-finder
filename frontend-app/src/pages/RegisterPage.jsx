import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Home, Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData.name, formData.email, formData.password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-transparent text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Create Account
        </h2>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 text-sm rounded-xl">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex justify-center gap-4 mb-6">
            <button 
              type="button"
              onClick={() => setRole('user')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${role === 'user' ? 'bg-blue-600 text-white scale-105' : 'bg-white/5 text-slate-400'}`}
            >
              <User size={18} /> User
            </button>
            <button 
              type="button"
              onClick={() => setRole('owner')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${role === 'owner' ? 'bg-purple-600 text-white scale-105' : 'bg-white/5 text-slate-400'}`}
            >
              <Home size={18} /> Room Owner
            </button>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Full Name" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all font-light"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all font-light"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 transition-all font-light"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="mx-4 text-slate-500 text-sm">OR</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
