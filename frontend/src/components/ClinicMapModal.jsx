import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Navigation, Compass, ExternalLink, 
  Car, Clock, ShieldCheck, ArrowRight 
} from 'lucide-react';

export default function ClinicMapModal({ isOpen, onClose, doctor }) {
  const [directionsData, setDirectionsData] = useState(null);

  useEffect(() => {
    if (isOpen && doctor) {
      fetch(`/api/clinic/directions?doctor_id=${doctor.id || 'doc-001'}`)
        .then(res => res.json())
        .then(data => setDirectionsData(data))
        .catch(err => console.error("Error loading directions:", err));
    }
  }, [isOpen, doctor?.id]);

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-sky-700 to-brand-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Navigation className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                Turn-by-Turn Clinic Route & Directions
              </h3>
              <p className="text-xs text-sky-100">
                {doctor.name} • {doctor.hospital}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Distance & ETA Bar */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-bold block">Estimated Travel Time</span>
                <span className="text-lg font-extrabold text-emerald-950">
                  {doctor.travel_time || '5 mins'} ({doctor.distance || '1.2 km away'})
                </span>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.hospital + ' ' + doctor.city)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Turn-by-Turn Route Guidance */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-brand-600" /> Navigation Steps from Your Location
            </h4>

            <div className="space-y-2.5 text-xs">
              {(doctor.map_directions || [
                "Head south on 80 Feet Road toward 4th Block (400 m)",
                "Turn left at Sony World Signal onto 100 Feet Road (500 m)",
                "Manipal Clinic will be on your left, next to Apollo Pharmacy (300 m)"
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landmark Callout */}
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <span><strong>Clinic Landmark:</strong> {doctor.landmark || 'City Center, Koramangala 4th Block'}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
