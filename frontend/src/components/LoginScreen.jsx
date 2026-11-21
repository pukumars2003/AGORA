import React, { useState } from 'react';
import {
  ShieldCheck, User, Stethoscope, ArrowRight,
  Sparkles, Heart, Radio, Volume2, Lock, Phone, Mail, Chrome,
  CheckCircle, Loader2
} from 'lucide-react';

const DEMO_QUICK_FILLS = {
  otp: [
    { label: 'Patient (Ravi)', phone: '+919845012345', otp: '123456', role: 'patient' },
    { label: 'Doctor (Dr. Ramesh)', phone: '+919845067890', otp: '123456', role: 'doctor' },
    { label: 'Admin', phone: '+919845099999', otp: '123456', role: 'admin' },
  ],
  email: [
    { label: 'Patient', email: 'ravi@bharat.in', password: 'patient123', role: 'patient', color: 'sky' },
    { label: 'Doctor', email: 'dr.ramesh@manipal.in', password: 'doctor123', role: 'doctor', color: 'emerald' },
    { label: 'Admin', email: 'admin@swasthya.gov.in', password: 'admin123', role: 'admin', color: 'purple' },
  ]
};

export default function LoginScreen({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(true);

  const handleLogin = async (endpoint, body) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
      }
      const data = await res.json();
      setSuccess(true);
      setTimeout(() => onLoginSuccess(data.user), 800);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = (p, o) => handleLogin('/api/auth/login-otp', { phone: p || phone, otp: o || otp });
  const handleEmailLogin = (e, pw) => handleLogin('/api/auth/login', { email: e || email, password: pw || password });
  const handleGoogleLogin = (ge) => handleLogin('/api/auth/login-google', { google_id: 'demo', email: ge || googleEmail });

  const tabs = [
    { id: 'otp', label: '📱 Mobile + OTP', icon: Phone },
    { id: 'email', label: '📧 Email', icon: Mail },
    { id: 'google', label: '🔵 Google', icon: Chrome },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-white flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome!</h2>
          <p className="text-sm text-slate-500 mt-1">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-white flex flex-col text-slate-800 animate-fade-in">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">
              Swasthya Sahayak <span className="text-sky-600 font-semibold text-base">(स्वास्थ्य सहायक)</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Voice AI for Bharat • Agora Conversational AI & Murf Falcon 2.1 TTS</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>Agora RTC Active</span>
          <span className="text-slate-300">•</span>
          <Volume2 className="w-3.5 h-3.5 text-sky-600" />
          <span>Murf Falcon 2.1 (~100ms)</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg w-full mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sign in to access your Healthcare Dashboard</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center leading-tight mb-2">
          Multilingual Healthcare for Every Citizen
        </h2>
        <p className="text-xs text-slate-500 text-center max-w-md font-medium mb-6">
          Speak Hindi, Kannada, Telugu or English. Book appointments, scan prescriptions, navigate clinics.
        </p>

        {/* Tab Switcher */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all ${activeTab === tab.id ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* OTP Tab */}
            {activeTab === 'otp' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Mobile Number</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98450 12345" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                    placeholder="123456" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm tracking-[0.3em] text-center font-bold focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <button onClick={() => handleOTPLogin()} disabled={loading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Verify & Login
                </button>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Quick Demo Login</p>
                  <div className="flex gap-2">
                    {DEMO_QUICK_FILLS.otp.map(d => (
                      <button key={d.phone} onClick={() => handleOTPLogin(d.phone, d.otp)} disabled={loading}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-xl border transition hover:scale-105 ${d.role === 'patient' ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100' : d.role === 'doctor' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="ravi@bharat.in" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <button onClick={() => handleEmailLogin()} disabled={loading}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Sign In
                </button>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">1-Tap Demo Login</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEMO_QUICK_FILLS.email.map(d => (
                      <button key={d.email} onClick={() => handleEmailLogin(d.email, d.password)} disabled={loading}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition hover:scale-105 flex flex-col items-center gap-1 ${d.color === 'sky' ? 'bg-sky-50 border-sky-200 text-sky-700' : d.color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                        {d.role === 'patient' ? <User className="w-4 h-4" /> : d.role === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Google Tab */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Google Email</label>
                  <input type="email" value={googleEmail} onChange={e => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none" />
                </div>
                <button onClick={() => handleGoogleLogin()} disabled={loading}
                  className="w-full py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold text-sm rounded-xl flex items-center justify-center gap-3 shadow-sm transition disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                  )}
                  Sign in with Google
                </button>
                <button onClick={() => handleGoogleLogin('ravi@bharat.in')} disabled={loading}
                  className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition">
                  <User className="w-3.5 h-3.5" /> Quick: Sign in as Ravi Kumar
                </button>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 font-bold mt-3 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 text-center">
                {error}
              </p>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-400 font-medium">
        Swasthya Sahayak (स्वास्थ्य सहायक) • Voice AI for Bharat Hackathon
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-bounce-in { animation: bounceIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}
