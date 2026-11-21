import React, { useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle2, ShieldCheck, QrCode, Phone, Navigation, Star, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AppointmentCard({ appointment }) {
  useEffect(() => {
    if (appointment) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
    }
  }, [appointment?.id]);

  if (!appointment) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-700">No Active Booking Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          When the voice agent confirms your slot, the live verified appointment pass with doctor credentials and distance will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-md p-5 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 -mx-5 -mt-5 px-5 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span className="text-xs font-bold uppercase tracking-wider">Appointment Confirmed</span>
        </div>
        <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
          {appointment.id}
        </span>
      </div>

      {/* Doctor Info with Degrees & Distance */}
      <div className="flex items-start gap-3.5 mt-4 pb-3.5 border-b border-slate-100">
        <img
          src={appointment.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
          alt={appointment.doctor_name}
          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base truncate flex items-center gap-1.5">
              {appointment.doctor_name}
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            </h3>
            {appointment.rating && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {appointment.rating}
              </span>
            )}
          </div>
          <p className="text-[11px] font-bold text-brand-700 mt-0.5 truncate">
            {appointment.degrees || appointment.speciality}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 truncate">
            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
              <Navigation className="w-3 h-3" /> {appointment.distance || '1.2 km away'}
            </span>
            <span className="truncate">{appointment.hospital}</span>
          </div>
        </div>
      </div>

      {/* Booking Grid */}
      <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date & Time
          </span>
          <p className="font-bold text-slate-800 mt-1">
            {appointment.date || 'Tomorrow'}
          </p>
          <p className="text-xs text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {appointment.slot}
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3" /> Patient Details
          </span>
          <p className="font-bold text-slate-800 mt-1 truncate">
            {appointment.patient_name}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" /> {appointment.phone}
          </p>
        </div>
      </div>

      {/* Why Patients Love Doctor Highlight */}
      {appointment.why_best && appointment.why_best.length > 0 && (
        <div className="py-2.5 px-3 bg-emerald-50/60 rounded-xl my-2 border border-emerald-100 text-[11px] text-emerald-900">
          <span className="font-extrabold flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-800 mb-0.5">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Patient Trust Guarantee
          </span>
          <p className="italic">"{appointment.why_best[0]}"</p>
        </div>
      )}

      {/* Consultation Fee & Pass Footer */}
      <div className="flex items-center justify-between pt-2 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Consultation Fee</span>
          <span className="font-extrabold text-slate-800 text-sm">{appointment.fee || '₹400'}</span>
          <span className="text-[10px] text-slate-400 ml-1">(Pay at Clinic)</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-bold text-xs">
          <QrCode className="w-4 h-4" />
          <span>Fast-Pass Active</span>
        </div>
      </div>

    </div>
  );
}
