import React, { useState } from 'react';
import { 
  X, Camera, FileText, CheckCircle2, Clock, Volume2, 
  Bell, Pill, ShieldCheck, Sparkles, AlertCircle, Play 
} from 'lucide-react';
import { voiceManager } from '../services/voiceService';

export default function PrescriptionScannerModal({ isOpen, onClose, currentLang }) {
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [activeSpeech, setActiveSpeech] = useState(false);

  if (!isOpen) return null;

  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescription/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: currentLang })
      });
      const data = await res.json();
      setPrescription(data.prescription);
    } catch (e) {
      console.error("Scan error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleListenMedication = (medicine) => {
    const text = medicine.voice_instruction[currentLang] || medicine.voice_instruction['en'];
    setActiveSpeech(true);
    voiceManager.speak(
      text,
      currentLang,
      () => setActiveSpeech(true),
      () => setActiveSpeech(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-sky-700 to-brand-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Camera className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                AI Prescription Reader & Medication Reminders
              </h3>
              <p className="text-xs text-sky-100">
                Snap doctor prescription ➔ Extracts tablets ➔ Spoken voice instructions & automated alarms
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Scan Action Card */}
          {!prescription ? (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-100 text-brand-600 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-base">Upload or Scan Doctor's Prescription</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Our medical vision model reads doctor handwriting, identifies tablets, and translates schedules into your native language.
              </p>

              <button
                onClick={handleScan}
                disabled={loading}
                className="mt-5 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Reading Prescription...' : 'Scan Doctor Prescription (AI Vision)'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Prescription Header Info */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-900 text-sm">{prescription.doctor_name}</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                      Ref: {prescription.id}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    Diagnosis: {prescription.diagnosis}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3 Daily Alarms Queued</span>
                </div>
              </div>

              {/* Medicines List */}
              <div className="space-y-3">
                {prescription.medicines.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-brand-300 transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-100 text-brand-600">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{med.name}</h4>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            {med.dosage} • {med.timing} ({med.duration})
                          </span>
                        </div>
                      </div>

                      {/* Listen Voice Instruction Button */}
                      <button
                        onClick={() => handleListenMedication(med)}
                        className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen in {currentLang.toUpperCase()}</span>
                      </button>
                    </div>

                    {/* Alarms Badges */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-600" /> Daily Reminders:
                      </span>
                      {med.reminder_times.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                          🔔 {t}
                        </span>
                      ))}
                    </div>

                    {/* Spoken translation text preview */}
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{med.voice_instruction[currentLang] || med.voice_instruction['en']}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setPrescription(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Scan another prescription
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Confirm & Sync to WhatsApp Alarms
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
