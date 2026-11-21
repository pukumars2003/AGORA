import React, { useState, useEffect } from 'react';
import { 
  X, Search, MapPin, Star, Languages, ShieldCheck, 
  Award, ThumbsUp, Heart, CheckCircle2, Navigation, Clock 
} from 'lucide-react';

export default function DoctorDirectoryModal({ isOpen, onClose, onSelectDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/doctors')
        .then(res => res.json())
        .then(data => {
          const list = data.doctors || [];
          setDoctors(list);
          if (list.length > 0 && !selectedDoc) {
            setSelectedDoc(list[0]);
          }
        })
        .catch(err => console.error("Error fetching doctors:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = doctors.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.speciality.toLowerCase().includes(q) ||
      (d.expertise_tags && d.expertise_tags.some(tag => tag.toLowerCase().includes(q))) ||
      (d.diseases_treated && d.diseases_treated.some(dis => dis.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-sky-700 to-brand-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <ShieldCheck className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Verified Doctors & Specialist Network (Bharat)
              </h3>
              <p className="text-xs text-sky-100">
                Detailed clinical expertise, nearby distance, patient trust reviews & why they are the best
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Disease Filters */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by disease (Migraine, Fever, Asthma, Knee Pain), city, or doctor name..."
              className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
            {['Migraine', 'Viral Fever', 'Pediatric', 'Knee Pain', 'Diabetes'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-600 transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Master-Detail Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Column: Doctor List */}
          <div className="lg:col-span-5 overflow-y-auto p-4 space-y-3 max-h-[50vh] lg:max-h-none">
            {filtered.map(doc => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50/70 border-brand-500 ring-2 ring-brand-500/10 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex gap-3.5 items-start">
                    <div className="relative shrink-0">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                      />
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">{doc.name}</h4>
                        <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {doc.rating}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-brand-700 mt-0.5 truncate">
                        {doc.speciality}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <Navigation className="w-3 h-3" /> {doc.distance || '1.2 km away'}
                        </span>
                        <span>•</span>
                        <span className="truncate">{doc.city}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expertise Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(doc.expertise_tags || []).slice(0, 2).map((exp, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Profile Details (Why Best, Reviews, Degrees) */}
          <div className="lg:col-span-7 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
            {selectedDoc ? (
              <>
                {/* Hero Profile Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <img
                      src={selectedDoc.avatar}
                      alt={selectedDoc.name}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-lg text-slate-900">{selectedDoc.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Verified Specialist
                        </span>
                      </div>
                      <p className="text-xs font-bold text-brand-700 mt-0.5">{selectedDoc.degrees}</p>
                      <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {selectedDoc.hospital} ({selectedDoc.landmark})
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" /> {selectedDoc.distance} ({selectedDoc.travel_time})
                        </span>
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {selectedDoc.experience} Experience
                        </span>
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {selectedDoc.patients_treated} Happy Patients
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {(selectedDoc.trust_badges || []).map((badge, i) => (
                      <span key={i} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Award className="w-3 h-3 text-brand-600" /> {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* WHY PATIENTS LOVE THIS DOCTOR */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Why Patients Trust & Recommend {selectedDoc.name.split(' ')[1] || selectedDoc.name}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {(selectedDoc.why_best || []).map((reason, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PATIENT REVIEWS & TESTIMONIALS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-brand-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">Patient Testimonials & Reviews</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Based on {selectedDoc.review_count} verified reviews
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(selectedDoc.top_reviews || []).map((rev, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800">{rev.patient} ({rev.city})</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(rev.rating)].map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 italic">"{rev.text}"</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{rev.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Consultation Fee
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">{selectedDoc.fee}</span>
                    <span className="text-[11px] text-slate-500 ml-1">(Pay at Clinic)</span>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectDoctor) onSelectDoctor(selectedDoc);
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    Select & Book with {selectedDoc.name.split(' ')[0]}
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select a doctor to view deep clinical background and reviews
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
