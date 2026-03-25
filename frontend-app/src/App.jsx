import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import { useAuth } from './context/AuthContext';

/* ─── Page Jailing: Disable browser back/forward on protected pages ─── */
function PageJail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const protectedPaths = ['/user-dashboard', '/owner-dashboard'];
    const authPaths = ['/login', '/register'];

    const handlePopState = (e) => {
      // If user is logged in and on a dashboard, prevent going back to login/register
      if (user && protectedPaths.some(p => location.pathname.startsWith(p))) {
        window.history.pushState(null, '', location.pathname);
      }
      // If user is on login/register, prevent going forward to dashboard without auth
      if (!user && protectedPaths.some(p => window.location.pathname.startsWith(p))) {
        navigate('/login', { replace: true });
      }
    };

    // Push a dummy state so back button triggers popstate instead of leaving
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, user, navigate]);

  return null;
}

/* ─── Protected Route ─── */
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
    if (!loading && user && allowedRole && user.role !== allowedRole) {
      navigate(user.role === 'user' ? '/user-dashboard' : '/owner-dashboard', { replace: true });
    }
  }, [user, loading, navigate, allowedRole]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Loading...</div>;
  if (!user) return null;

  return children;
}

/* ─── Redirect if already logged in ─── */
function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'user' ? '/user-dashboard' : '/owner-dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Loading...</div>;

  return children;
}

function App() {
  return (
    <Router>
      <PageJail />
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
          <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
          <Route path="/user-dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/owner-dashboard" element={<ProtectedRoute allowedRole="owner"><OwnerDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
