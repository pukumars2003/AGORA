import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, CheckCircle2, ShieldCheck, 
  QrCode, Phone, Navigation, Star, Heart, Compass, ExternalLink,
  Car, Bell, Volume2, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AppointmentCard({ appointment, onOpenMapModal }) {
  const [activeTab, setActiveTab] = useState('directions'); // Default to directions & map right after booking!
  const [reminders, setReminders] = useState([
    {
      id: 'rem-1',
      title: 'T-2 Hours Outbound Call & SMS Confirmation',
      time: 'Tomorrow, 09:30 AM',
      type: 'voice_call',
      status: 'SCHEDULED',
      desc: 'Agora AI Outbound agent will call +91 98450 12345 to confirm attendance & route.'
    },
    {
      id: 'rem-2',
      title: 'Departure Alert & Live Traffic Route',
      time: 'Tomorrow, 10:45 AM',
      type: 'navigation',
      status: 'SCHEDULED',
      desc: 'Turn-by-turn Google Maps direction alert with estimated 5 min travel time.'
    },
    {
      id: 'rem-3',
      title: 'Clinic Check-in & Fast Pass QR',
      time: 'Tomorrow, 11:15 AM',
      type: 'checkin',
      status: 'READY',
      desc: 'Show QR code at clinic reception desk for priority queue admission.'
    },
    {
      id: 'rem-4',
      title: 'Post-Consultation Prescription & Tablet Alarms',
      time: 'Auto-sync from Rx',
      type: 'medication',
      status: 'ACTIVE',
      desc: 'Morning (08:00 AM), Lunch (01:30 PM), Evening (05:30 PM), Night (08:30 PM).'
    }
  ]);

  useEffect(() => {
    if (appointment) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}
      // Automatically switch to directions tab so user is taken directly to doctor location & directions!
      setActiveTab('directions');
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
          When the voice agent confirms your slot, the live verified appointment pass, Google Maps directions, and reminders will appear here.
        </p>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((appointment.hospital || 'Hospital') + ' ' + (appointment.city || 'Bengaluru'))}`;

  return (
    <div className="bg-white rounded-3xl border border-emerald-200 shadow-md p-5 relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 -mx-5 -mt-5 px-5 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span className="text-xs font-bold uppercase tracking-wider">Slot Confirmed & Active</span>
        </div>
        <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
          {appointment.id}
        </span>
      </div>

      {/* Doctor Summary Header */}
      <div className="flex items-start gap-3.5 mt-4 pb-3.5 border-b border-slate-100">
        <img
          src={appointment.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
          alt={appointment.doctor_name}
          className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-1.5">
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
            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
              <Navigation className="w-3 h-3" /> {appointment.distance || '1.0 km away'}
            </span>
            <span className="truncate text-[11px]">{appointment.hospital}</span>
          </div>
        </div>
      </div>

      {/* 3 Interactive Post-Booking Tabs */}
      <div className="flex items-center gap-1 my-3 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('directions')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'directions'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Clinic Directions & Maps</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'reminders'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Reminders Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('pass')}
          className={`flex-1 py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === 'pass'
              ? 'bg-white text-emerald-800 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Pass Details</span>
        </button>
      </div>

      {/* TAB 1: CLINIC DIRECTIONS & GOOGLE MAPS INTEGRATION */}
      {activeTab === 'directions' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Distance, ETA & Open in Google Maps Button */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                  Estimated Travel Time
                </span>
                <span className="text-sm font-extrabold text-emerald-950">
                  {appointment.travel_time || '5 mins'} ({appointment.distance || '1.0 km away'})
                </span>
              </div>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Turn-by-Turn Navigation Steps */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-emerald-600" /> Live Route Guidance
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">Normal Traffic</span>
            </div>

            <div className="space-y-2 text-xs">
              {(appointment.map_directions || [
                `Head south from your location toward ${appointment.landmark || 'Main Road'} (300 m)`,
                `Continue on 80 Feet Road past the signal (400 m)`,
                `${appointment.hospital} will be on your left, entrance near clinic reception (200 m)`
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Landmark Callout */}
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-[11px] text-slate-700 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span><strong>Clinic Landmark:</strong> {appointment.landmark || 'City Center, Near Signal'}</span>
          </div>
        </div>
      )}

      {/* TAB 2: REMINDERS SCHEDULE */}
      {activeTab === 'reminders' && (
        <div className="space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Bell className="w-3 h-3 text-blue-600" /> Automated Reminder Pipeline
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              4 Alarms Active
            </span>
          </div>

          {reminders.map((rem) => (
            <div key={rem.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-brand-600 shadow-2xs mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs truncate">{rem.title}</h4>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    {rem.time}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {rem.desc}
                </p>
              </div>
            </div>
          ))}

          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Agora Conversational AI agent scheduled to call patient automatically 2 hours prior.</span>
          </div>
        </div>
      )}

      {/* TAB 3: PASS DETAILS */}
      {activeTab === 'pass' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Booking Grid */}
          <div className="grid grid-cols-2 gap-2.5 py-1 text-xs">
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
            <div className="py-2 px-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
              <span className="font-extrabold flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-800 mb-0.5">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Patient Trust Guarantee
              </span>
              <p className="italic leading-snug">"{appointment.why_best[0]}"</p>
            </div>
          )}

          {/* Consultation Fee & Pass Footer */}
          <div className="flex items-center justify-between pt-1 text-xs">
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
      )}

    </div>
  );
}