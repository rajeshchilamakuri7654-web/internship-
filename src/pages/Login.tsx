import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import { toast } from '../hooks/useToast';

export default function Login() {
  const [email, setEmail] = useState('admin@daycare.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      toast('Welcome back! 👋', 'success');
      if (result.user.role === 'parent') {
        navigate('/parent-portal');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Login failed. Check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
      backgroundImage: 'radial-gradient(ellipse at top left, rgba(37, 99, 235, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '1rem',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 40px rgba(37, 99, 235, 0.4)',
          }}>
            <ShieldAlert size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '0.375rem' }}>
            AllergyGuard
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Daycare Food Safety Management System
          </p>
        </div>

        {/* Login form */}
        <div style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: '1rem', padding: '2rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem', textAlign: 'center' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@daycare.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: '#0f172a', borderRadius: '0.5rem', border: '1px solid #1e293b' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.5rem' }}>
              🔑 Demo Credentials
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.8 }}>
              <div><span style={{ color: '#60a5fa' }}>Admin:</span> admin@daycare.com / admin123</div>
              <div><span style={{ color: '#4ade80' }}>Teacher:</span> teacher@daycare.com / admin123</div>
              <div><span style={{ color: '#f59e0b' }}>Parent:</span> parent@daycare.com / admin123</div>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginTop: '1.5rem' }}>
          Internship Project — Food Allergy-Safe Meal Planner
        </p>
      </div>
    </div>
  );
}
