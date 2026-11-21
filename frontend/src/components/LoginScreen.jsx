import React, { useState } from 'react';
import {
  ShieldCheck, User, Stethoscope, ArrowRight,
  Lock, Phone, Mail, CheckCircle, Loader2, Sparkles
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('patient'); // 'patient' | 'doctor' | 'admin'
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'email' for patient

  // Form Fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Autofill helper so credentials appear inside the actual input fields before submitting
  const handleAutofill = (roleToFill) => {
    setError('');
    if (roleToFill === 'patient') {
      setSelectedRole('patient');
      setPhone('+91 98450 12345');
      setOtp('123456');
      setEmail('ravi@bharat.in');
      setPassword('patient123');
    } else if (roleToFill === 'doctor') {
      setSelectedRole('doctor');
      setEmail('dr.ramesh@manipal.in');
      setPassword('doctor123');
      setPhone('+91 98450 67890');
      setOtp('123456');
    } else if (roleToFill === 'admin') {
      setSelectedRole('admin');
      setEmail('admin@swasthya.gov.in');
      setPassword('admin123');
      setPhone('+91 98450 99999');
      setOtp('123456');
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    // Clear fields or autofill cleanly
    if (role === 'doctor') {
      setEmail('dr.ramesh@manipal.in');
      setPassword('doctor123');
    } else if (role === 'admin') {
      setEmail('admin@swasthya.gov.in');
      setPassword('admin123');
    } else {
      setPhone('+91 98450 12345');
      setOtp('123456');
      setEmail('ravi@bharat.in');
      setPassword('patient123');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = '/api/auth/login';
      let body = {};

      if (selectedRole === 'patient') {
        if (loginMethod === 'otp') {
          const cleanPhone = phone.replace(/\s+/g, '');
          if (!cleanPhone) throw new Error('Please enter mobile number');
          if (!otp) throw new Error('Please enter 6-digit OTP');
          endpoint = '/api/auth/login-otp';
          body = { phone: cleanPhone, otp };
        } else {
          if (!email) throw new Error('Please enter email address');
          if (!password) throw new Error('Please enter password');
          endpoint = '/api/auth/login';
          body = { email, password };
        }
      } else {
        // Doctor and Admin use email & password
        if (!email) throw new Error('Please enter your work email');
        if (!password) throw new Error('Please enter your password');
        endpoint = '/api/auth/login';
        body = { email, password };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.');
      }

      const data = await res.json();
      setSuccess(true);
      setTimeout(() => onLoginSuccess(data.user), 600);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center font-sans">
        <div className="text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Welcome!</h2>
          <p className="text-xs text-slate-500 mt-1">Opening your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-slate-800">
      
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto px-6 pt-8 pb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h1 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Swasthya Sahayak
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-500">
          Healthcare that speaks your language
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700">
          <span>हिन्दी</span>
          <span className="text-slate-300">•</span>
          <span>ಕನ್ನಡ</span>
          <span className="text-slate-300">•</span>
          <span>తెలుగు</span>
          <span className="text-slate-300">•</span>
          <span>English</span>
        </div>
      </header>

      {/* Main Login Card - Figma Screen 5 Exact Design */}
      <main className="max-w-md w-full mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100 p-6 sm:p-8">
          
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Choose your role to sign in
            </p>
          </div>

          {/* 3 Role Selection Pills (Screen 5) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('patient')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'patient'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('doctor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'doctor'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* PATIENT ROLE: OTP or Password */}
            {selectedRole === 'patient' && (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Mobile number</span>
                  <div className="flex gap-2 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('otp')}
                      className={`hover:underline ${loginMethod === 'otp' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                      Use OTP
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('email')}
                      className={`hover:underline ${loginMethod === 'email' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}
                    >
                      Use Email
                    </button>
                  </div>
                </div>

                {loginMethod === 'otp' ? (
                  <>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                    />

                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        6-Digit OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm tracking-[0.25em] text-center font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ravi@bharat.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                    />

                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="patient123"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* DOCTOR ROLE */}
            {selectedRole === 'doctor' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Doctor Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.ramesh@manipal.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="doctor123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-800"
                  />
                </div>
              </>
            )}

            {/* ADMIN ROLE */}
            {selectedRole === 'admin' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Admin Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@swasthya.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Master Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-slate-800"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            {/* 1-Tap Fill Credentials Chip */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleAutofill(selectedRole)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-[11px] font-bold text-slate-600 hover:text-blue-700 transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Fill {selectedRole.toUpperCase()} credentials into fields</span>
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 disabled:opacity-50 ${
                selectedRole === 'patient'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : selectedRole === 'doctor'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</span>
            </button>

          </form>

          {/* Footer note from Screen 5 */}
          <p className="text-[11px] text-slate-400 text-center font-medium mt-5">
            Doctors and admins use work credentials. Demo data only.
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 font-medium">
        Swasthya Sahayak (स्वास्थ्य सहायक) • Voice AI for Bharat
      </footer>

    </div>
  );
}