import React from 'react';
import { 
  Navigation, Star, CheckCircle2, MapPin, ShieldCheck, ChevronRight 
} from 'lucide-react';

export default function NearbyDoctorRecommendation({ doctors, doctor, onConfirmSlot }) {
  // Support both list of doctors or single doctor
  const docList = doctors && doctors.length > 0 ? doctors : (doctor ? [doctor] : []);
  if (docList.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Nearby Recommended Doctors ({docList.length})
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          Ranked by distance & patient ratings
        </span>
      </div>

      {docList.map((doc, idx) => (
        <div 
          key={doc.id || idx}
          className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 relative overflow-hidden transition-all duration-200 hover:border-blue-400 hover:shadow-md"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-700">
                {idx === 0 ? 'Top Matched Doctor' : `Alternative Specialist ${idx + 1}`}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200/60">
              <Navigation className="w-3 h-3 text-emerald-600" />
              {doc.distance || `${doc.distance_km || 1.2} km away`}
            </span>
          </div>

          {/* Doctor Header */}
          <div className="flex items-start gap-3.5 mt-3.5">
            <img
              src={doc.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}
              alt={doc.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{doc.name}</h4>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {doc.rating || 4.9}
                </span>
              </div>
              <p className="text-xs font-bold text-blue-700 mt-0.5 truncate">{doc.degrees || doc.speciality}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{doc.hospital}</span>
              </p>
            </div>
          </div>

          {/* Doctor Trust Signals */}
          {doc.why_best && doc.why_best.length > 0 && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{doc.why_best[0]}</span>
              </div>
            </div>
          )}

          {/* Slot Booking Footer */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Consultation Fee</span>
              <span className="font-extrabold text-slate-900 text-sm">{doc.fee || '₹400'}</span>
              <span className="text-emerald-700 font-bold text-xs ml-2">Tomorrow at 11:30 AM</span>
            </div>

            <button
              onClick={() => onConfirmSlot && onConfirmSlot(doc)}
              className="px-4 py-2 bg-[#1D4ED8] hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-xs"
            >
              <span>Confirm Slot</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}
