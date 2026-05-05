import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import SplashScreen from './pages/SplashScreen';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPassword from './pages/ForgotPassword';
import LoginSuccess from './pages/LoginSuccess';
import CompleteRegistration from './pages/CompleteRegistration';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProperties from './pages/admin/AdminProperties';
import AdminBookings from './pages/admin/AdminBookings';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminPlans from './pages/admin/AdminPlans';
import SubscriptionPage from './pages/SubscriptionPage';
import NotificationsPage from './pages/NotificationsPage';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

/* ── Page Jailing: Disable browser back/forward on protected pages ── */
function PageJail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const protectedPaths = ['/user-dashboard', '/owner-dashboard', '/admin'];

    const handlePopState = () => {
      if (user && protectedPaths.some(p => location.pathname.startsWith(p))) {
        window.history.pushState(null, '', location.pathname);
      }
      if (!user && protectedPaths.some(p => window.location.pathname.startsWith(p))) {
        navigate('/login', { replace: true });
      }
    };

    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, user, navigate]);

  return null;
}

/* ── Protected Route ── */
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
    if (!loading && user && allowedRole && user.role !== allowedRole) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate, allowedRole]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
      <div className="w-10 h-10 border-[3px] border-[#E5E7EB] border-t-[#4F46E5] rounded-full animate-spin mb-4" />
      <p className="text-xs font-semibold text-[#9CA3AF] tracking-widest uppercase">Loading…</p>
    </div>
  );
  if (!user) return null;

  return children;
}

/* ── Redirect if already logged in ── */
function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (user.role === 'owner') {
        navigate('/owner-dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-[4px] border-[#4F46E5]/10 border-t-[#4F46E5] rounded-full animate-spin" />
    </div>
  );

  return children;
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
        className: '',
        style: {
          marginTop: '20px',
          padding: '16px',
          color: '#111827',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        },
      }} />
      <PageJail />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/home" element={<WelcomePage />} />
          <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route path="/complete-registration" element={<CompleteRegistration />} />
          <Route path="/user-dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/subscribe" element={<ProtectedRoute allowedRole="user"><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/owner-dashboard" element={<ProtectedRoute allowedRole="owner"><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute allowedRole="admin"><AdminProperties /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute allowedRole="admin"><AdminBookings /></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRole="admin"><AdminSubscriptions /></ProtectedRoute>} />
          <Route path="/admin/plans" element={<ProtectedRoute allowedRole="admin"><AdminPlans /></ProtectedRoute>} />
          {/* Fallback for manually typed routes that do not exist */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;
