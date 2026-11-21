import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw, Stethoscope, Users, Settings, LogOut,
  Radio, Volume2, MapPin, ChevronDown
} from 'lucide-react';

const LOCATIONS = [
  { area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { area: 'Indiranagar', city: 'Bengaluru', lat: 12.9784, lng: 77.6408 },
  { area: 'Jubilee Hills', city: 'Hyderabad', lat: 17.4319, lng: 78.4073 },
  { area: 'Banjara Hills', city: 'Hyderabad', lat: 17.4156, lng: 78.4347 },
  { area: 'Okhla', city: 'Delhi', lat: 28.5603, lng: 77.2797 },
  { area: 'Saket', city: 'Delhi', lat: 28.5245, lng: 77.2066 },
  { area: 'Vile Parle', city: 'Mumbai', lat: 19.0968, lng: 72.8433 },
  { area: 'Bandra', city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
];

const LANG_OPTIONS = [
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'te', label: 'Telugu' },
  { code: 'en', label: 'English' },
];

export default function Header({
  currentLang, onSelectLang, onReset, onOpenDoctors, onOpenAdmin,
  currentUser, onLogout, isAgoraActive,
  userLocation, onLocationChange
}) {
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) setShowLocDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loc = userLocation || { area: 'Koramangala', city: 'Bengaluru' };

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">

        {/* Left: Logo & Clinical Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-sky-500/15 flex-shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight truncate">
              Swasthya Sahayak <span className="text-sky-600 text-sm font-semibold">(स्वास्थ्य सहायक)</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Agora RTC
              </span>
              <span>•</span>
              <span className="text-slate-500">Murf Falcon 2.1</span>
            </div>
          </div>
        </div>

        {/* Center: Location Pill Selector */}
        <div className="relative" ref={locRef}>
          <button 
            onClick={() => setShowLocDropdown(!showLocDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{loc.area}, {loc.city}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          
          {showLocDropdown && (
            <div className="absolute top-full mt-1.5 left-0 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-1.5 min-w-[210px] max-h-64 overflow-y-auto animate-fade-in">
              {LOCATIONS.map((l, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    onLocationChange && onLocationChange(l);
                    setShowLocDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-sky-50 transition flex items-center gap-2 ${
                    loc.area === l.area ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{l.area}, {l.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions & Language Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Clean Language Segmented Controller */}
          <div className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1 border border-slate-200/60">
            {LANG_OPTIONS.map(l => (
              <button 
                key={l.code} 
                onClick={() => onSelectLang(l.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  currentLang === l.code 
                    ? 'bg-white text-sky-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>

          <button 
            onClick={onOpenDoctors}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-slate-700 hover:text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users className="w-3.5 h-3.5" /> 
            <span>Doctors</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button 
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Settings className="w-3.5 h-3.5" /> 
              <span>Admin</span>
            </button>
          )}

          <button 
            onClick={onReset}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 
            <span>Reset</span>
          </button>

          <button 
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" /> 
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
