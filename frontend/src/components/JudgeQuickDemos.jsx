import React from 'react';
import { Play, Sparkles, AlertOctagon, HeartHandshake } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'hindi_headache',
    title: 'Hinglish / Hindi: Headache in Bengaluru',
    lang: 'hi',
    langTag: 'Hinglish',
    color: 'from-amber-500 to-orange-600',
    borderColor: 'hover:border-amber-400',
    description: '"Mujhe kal se sar dard hai, Bengaluru me doctor batao"'
  },
  {
    id: 'kannada_fever',
    title: 'Kannada: Fever in Bengaluru',
    lang: 'kn',
    langTag: 'ಕನ್ನಡ',
    color: 'from-red-600 to-rose-700',
    borderColor: 'hover:border-red-400',
    description: '"Nanage eradu dinadinda jvara ide, doctor beku"'
  },
  {
    id: 'telugu_consult',
    title: 'Telugu: Neurologist in Hyderabad',
    lang: 'te',
    langTag: 'తెలుగు',
    color: 'from-teal-600 to-cyan-700',
    borderColor: 'hover:border-teal-400',
    description: '"Naaku thalanoppiga undi, Hyderabad lo doctor evaru?"'
  },
  {
    id: 'english_checkup',
    title: 'Indian English: General Checkup',
    lang: 'en',
    langTag: 'English',
    color: 'from-blue-600 to-indigo-700',
    borderColor: 'hover:border-blue-400',
    description: '"Need a physician appointment in Bengaluru tomorrow"'
  },
  {
    id: 'emergency_alert',
    title: 'Safety Guardrail: 108 Emergency Alert',
    lang: 'hi',
    langTag: 'Emergency',
    color: 'from-rose-600 to-red-800',
    borderColor: 'hover:border-rose-500',
    description: '"Chhati me dard hai aur saans nahi aa rahi (Chest Pain)"'
  }
];

export default function JudgeQuickDemos({ onRunScenario, isRunning }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-100 text-amber-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              5-Minute Pitch Demo Scenarios (Judge Fast-Track)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Click any scenario to demonstrate full voice conversation, multilingual NLU, tool calling & reminders
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onRunScenario(sc.id, sc.lang)}
            disabled={isRunning}
            className={`text-left p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white ${sc.borderColor} hover:shadow-xs transition duration-200 flex flex-col justify-between group disabled:opacity-50`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition truncate">
                  {sc.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {sc.langTag}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic line-clamp-2">
                {sc.description}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-brand-600 font-bold group-hover:translate-x-0.5 transition-transform">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3 fill-current" />
                Run Live Agentic Flow
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
