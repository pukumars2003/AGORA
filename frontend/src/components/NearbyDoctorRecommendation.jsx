import React from 'react';
import { 
  Navigation, Star, Award, Heart, CheckCircle2, 
  MapPin, Clock, ShieldCheck, ChevronRight 
} from 'lucide-react';

export default function NearbyDoctorRecommendation({ doctor, onConfirmSlot }) {
  if (!doctor) return null;

  return (
    <div className="bg-white rounded-3xl border border-brand-200/90 shadow-md p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-700 to-sky-600 -mx-5 -mt-5 px-5 py-2.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-200" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider">Top Matched Doctor Nearby</span>
        </div>
        <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Navigation className="w-3 h-3 text-emerald-300" />
          {doctor.distance || '1.2 km away'}
        </span>
      </div>

      {/* Doctor Header */}
      <div className="flex items-start gap-3.5 mt-4">
        <img
          src={doctor.avatar}
          alt={doctor.name}
          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-slate-900 text-base truncate">{doctor.name}</h4>
            <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {doctor.rating}
            </span>
          </div>
          <p className="text-xs font-bold text-brand-700 mt-0.5">{doctor.degrees || doctor.speciality}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            {doctor.hospital} ({doctor.landmark || doctor.city})
          </p>
        </div>
      </div>

      {/* WHY THIS DOCTOR IS BEST */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 px-5 py-3 text-xs">
        <span className="text-[10px] font-extrabold text-brand-800 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Why Patients Trust & Love Dr. {doctor.name.split(' ')[1] || doctor.name}
        </span>
        <div className="space-y-1.5 text-slate-700 text-[11px]">
          {(doctor.why_best || [
            "Listens patiently without medical jargon",
            "Prescribes minimal, affordable generic medicines"
          ]).slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Featured Patient Review Quote */}
        {doctor.top_reviews && doctor.top_reviews.length > 0 && (
          <div className="mt-2.5 p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 italic">
            "{doctor.top_reviews[0].text}"
            <span className="block text-[10px] font-bold text-slate-500 font-sans not-italic mt-0.5">
              — {doctor.top_reviews[0].patient} (Verified Patient)
            </span>
          </div>
        )}
      </div>

      {/* Slot Booking Bar */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Fee & Next Slot</span>
          <span className="font-extrabold text-slate-900 text-sm">{doctor.fee || '₹400'}</span>
          <span className="text-emerald-700 font-bold text-xs ml-2">Tomorrow at 11:30 AM</span>
        </div>

        <button
          onClick={() => onConfirmSlot && onConfirmSlot(doctor)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-xs"
        >
          <span>Confirm Slot</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
