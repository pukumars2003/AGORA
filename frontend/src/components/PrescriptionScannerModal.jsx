import React, { useState, useRef } from 'react';
import { 
  X, Camera, FileText, CheckCircle2, Clock, Volume2, 
  Pill, Sparkles, Upload, ArrowRight, Image as ImageIcon, HeartPulse
} from 'lucide-react';
import { voiceManager } from '../services/voiceService';

export default function PrescriptionScannerModal({ isOpen, onClose, currentLang, onSyncReminders }) {
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleScanOrUpload = async (fileObj = null) => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescription/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language: currentLang || 'en',
          image_url: fileObj ? fileObj.name : 'media_1795245496764_7f4aa78b.png'
        })
      });
      const data = await res.json();
      setPrescription(data.prescription);
      if (onSyncReminders) {
        onSyncReminders(data.prescription);
      }
    } catch (e) {
      console.error("Scan error:", e);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      handleScanOrUpload(file);
    }
  };

  const handleListenMedication = (medicine) => {
    const lang = currentLang || 'en';
    const text = medicine.voice_instruction[lang] || medicine.voice_instruction['en'];
    voiceManager.speak(text, lang);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-blue-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Camera className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Prescription AI & Medication Reminders
              </h3>
              <p className="text-xs text-sky-100">
                Snap or upload doctor prescription ➔ Detects tablets ➔ Auto-sets reminders
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Upload / Scan Card */}
          {!prescription ? (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">Upload or Scan Doctor's Prescription</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                AI Vision reads doctor handwriting and printed prescriptions, extracts tablets, dosages, and schedules alarms in your preferred language.
              </p>

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="image/*,.pdf" 
                className="hidden" 
              />

              <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:border-blue-600 text-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-2xs transition"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Choose Photo / PDF</span>
                </button>

                <button
                  onClick={() => handleScanOrUpload()}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Analyzing Prescription...' : 'Scan Sample Prescription'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Prescription Header Info */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-950 text-sm">{prescription.doctor_name}</span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                      Ref: {prescription.id}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    Diagnosis: {prescription.diagnosis}
                  </p>
                  {prescription.advice && (
                    <p className="text-[11px] text-amber-800 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      Advice: {prescription.advice}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{prescription.medicines?.length || 4} Alarms Synced</span>
                </div>
              </div>

              {/* Medicines List with Voice Instructions */}
              <div className="space-y-3">
                {prescription.medicines.map((med, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-100 text-blue-600">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{med.name}</h4>
                          <span className="text-xs text-slate-500 font-semibold">
                            {med.dosage} ({med.duration})
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleListenMedication(med)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen Aloud</span>
                      </button>
                    </div>

                    {/* Alarm Timings */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" /> Scheduled Times:
                      </span>
                      {med.reminder_times.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 font-mono font-bold text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Native Instruction */}
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{med.voice_instruction[currentLang || 'en'] || med.voice_instruction['en']}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setPrescription(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Upload another file
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  Save & Return to Dashboard
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}