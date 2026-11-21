import React, { useState } from 'react';
import { X, Lock, Shield, User, Stethoscope, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (loginEmail, loginPass) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail || email, password: loginPass || password })
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const data = await res.json();
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    handleLogin(presetEmail, presetPass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-sky-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-200" />
              Sign in to Swasthya Sahayak
            </h3>
            <p className="text-xs text-sky-100 mt-0.5">
              Role-based access for Voice AI for Bharat
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick 1-Click Demo Logins for Judges */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              1-Click Fast Login (For Hackathon Judges)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePresetLogin('admin@swasthya.gov.in', 'admin123')}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-purple-700 font-extrabold text-xs">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </div>
                <p className="text-[10px] text-purple-600 font-medium mt-0.5">Model config & RL</p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('ravi@bharat.in', 'patient123')}
                className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-sky-700 font-extrabold text-xs">
                  <User className="w-3.5 h-3.5" /> Patient
                </div>
                <p className="text-[10px] text-sky-600 font-medium mt-0.5">Voice booking</p>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('dr.ramesh@manipal.in', 'doctor123')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-left transition group"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor
                </div>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Slot management</p>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-slate-200" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 absolute">OR ENTER CREDENTIALS</span>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3.5">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@swasthya.gov.in"
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
