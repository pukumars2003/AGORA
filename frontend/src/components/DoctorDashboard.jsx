import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Users, CheckCircle2, Clock, Calendar, 
  FileText, Pill, LogOut, Star, Plus, ShieldCheck, ChevronRight 
} from 'lucide-react';

export default function DoctorDashboard({ currentUser, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('Ravi Kumar');
  const [diagnosisText, setDiagnosisText] = useState('Acute Tension Migraine & Mild Fever');
  const [prescribeSuccess, setPrescribeSuccess] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/queue?doctor_id=doc-001');
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e) {
      console.error("Queue error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePrescription = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/doctor/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: 'doc-001',
          patient_name: selectedPatient,
          diagnosis: diagnosisText,
          medicines: [
            {
              name: "Paracetamol 650mg",
              dosage: "1 tablet",
              frequency: "Twice daily after meals",
              duration: "3 days",
              reminder_times: ["08:30 AM", "09:00 PM"]
            },
            {
              name: "Naproxen 250mg",
              dosage: "1 tablet",
              frequency: "Once daily with food",
              duration: "5 days",
              reminder_times: ["01:30 PM"]
            }
          ]
        })
      });
      if (res.ok) {
        setPrescribeSuccess(true);
        setTimeout(() => {
          setPrescribeSuccess(false);
          setShowPrescribeModal(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Prescribe error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Doctor Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Doctor Clinic Portal: Dr. Ramesh Kumar
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  OPD Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manipal Clinic, Koramangala 4th Block • NIMHANS Fellow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrescribeModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Digital Prescription</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-sky-100 text-brand-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Today's Patient Queue</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{queue.length} Scheduled</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Consultations Completed</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">3 Completed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
              <Star className="w-6 h-6 fill-amber-500" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Patient Satisfaction</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">4.9 ★ (842 reviews)</p>
            </div>
          </div>
        </div>

        {/* Patient Queue Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Today's OPD Patient Queue</h3>
              <p className="text-xs text-slate-500">Live booking feed from Voice AI assistant</p>
            </div>
            <button
              onClick={loadQueue}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Refresh Queue
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {queue.map((pt, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 font-extrabold text-slate-700 flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{pt.patient_name || pt.patient}</h4>
                    <p className="text-slate-500 font-medium">
                      Slot: <strong className="text-brand-700">{pt.slot}</strong> • Phone: {pt.phone}
                    </p>
                    <p className="text-slate-600 mt-0.5">
                      Reported Symptom: <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded">{pt.reason || 'Consultation'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(pt.patient_name || pt.patient);
                      setShowPrescribeModal(true);
                    }}
                    className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-bold rounded-xl flex items-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Prescribe Tablets</span>
                  </button>

                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200">
                    Checked In
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Digital Prescription Modal */}
      {showPrescribeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                Digital Prescription Pad
              </h3>
              <button onClick={() => setShowPrescribeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePrescription} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              {/* Sample medicines included */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 block">Prescribed Medication (Auto-syncs alarms):</span>
                <div className="text-[11px] text-emerald-800 space-y-1">
                  <p>💊 <strong>Paracetamol 650mg:</strong> 1 tab twice daily after meals (08:30 AM, 09:00 PM)</p>
                  <p>💊 <strong>Naproxen 250mg:</strong> 1 tab daily with food (01:30 PM)</p>
                </div>
              </div>

              {prescribeSuccess && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-100 p-2.5 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Prescription dispatched & medication alarms created!
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs"
              >
                Issue Digital Prescription & Schedule Alarms
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
