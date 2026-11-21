import React from 'react';
import { Mic, Volume2, Sparkles, Loader2 } from 'lucide-react';
import { LANGUAGE_CONFIG } from '../services/voiceService';

export default function VoiceVisualizer({ 
  voiceState, 
  onToggleMic, 
  currentLang,
  interimTranscript 
}) {
  const isListening = voiceState === 'LISTENING';
  const isThinking = voiceState === 'THINKING';
  const isSpeaking = voiceState === 'SPEAKING';

  const langInfo = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG.hi;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 p-7 shadow-xs flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
      
      {/* Dynamic Ambient Aura */}
      <div 
        className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none transition-all duration-1000 ${
          isSpeaking 
            ? 'bg-emerald-400 scale-125' 
            : isListening 
            ? 'bg-sky-400 scale-125' 
            : isThinking 
            ? 'bg-purple-400 scale-110' 
            : 'bg-sky-200 scale-90'
        }`} 
      />
      <div 
        className={`absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-1000 ${
          isSpeaking 
            ? 'bg-teal-300 scale-125' 
            : isListening 
            ? 'bg-indigo-300 scale-125' 
            : 'bg-slate-200 scale-90'
        }`} 
      />

      {/* Language & Voice Label */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 mb-6 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>{langInfo.voiceName}</span>
        <span className="text-slate-300">•</span>
        <span className="text-slate-500">{langInfo.label}</span>
      </div>

      {/* Animated Voice Orb & Mic Container */}
      <div className="relative my-4 flex items-center justify-center">
        
        {/* Concentric Audio Wave Rings */}
        {isListening && (
          <>
            <div className="absolute w-36 h-36 rounded-full border border-sky-400/40 animate-ping pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full border border-sky-300/30 animate-pulse pointer-events-none" />
          </>
        )}
        {isSpeaking && (
          <>
            <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" style={{ animationDuration: '2s' }} />
            <div className="absolute w-44 h-44 rounded-full border border-teal-300/30 animate-pulse pointer-events-none" />
          </>
        )}
        {isThinking && (
          <div className="absolute w-36 h-36 rounded-full border border-purple-400/40 animate-spin pointer-events-none" style={{ animationDuration: '4s' }} />
        )}

        {/* Central Responsive Mic Action Button */}
        <button
          onClick={onToggleMic}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl select-none ${
            isListening
              ? 'bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 text-white shadow-sky-500/30 scale-105 ring-4 ring-sky-100'
              : isThinking
              ? 'bg-gradient-to-tr from-indigo-500 via-purple-600 to-violet-600 text-white shadow-purple-500/30 scale-100'
              : isSpeaking
              ? 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-emerald-700 text-white shadow-emerald-500/30 scale-105 ring-4 ring-emerald-100'
              : 'bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white shadow-sky-600/25 hover:scale-105 active:scale-95'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to speak'}
        >
          {isListening ? (
            <>
              <Mic className="w-8 h-8 animate-bounce text-white drop-shadow" />
              <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Listening</span>
            </>
          ) : isThinking ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow" />
              <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Thinking</span>
            </>
          ) : isSpeaking ? (
            <>
              <Volume2 className="w-8 h-8 animate-pulse text-white drop-shadow" />
              <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Speaking</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 text-white drop-shadow transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Tap to Speak</span>
            </>
          )}
        </button>

      </div>

      {/* Fluid Real-time Audio Spectrum Bars */}
      <div className="flex items-center justify-center gap-1.5 h-8 my-3">
        {[25, 45, 75, 95, 60, 85, 40, 100, 55, 80, 35, 65, 30].map((h, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-200 ${
              isSpeaking
                ? 'bg-emerald-500'
                : isListening
                ? 'bg-sky-500'
                : isThinking
                ? 'bg-purple-400'
                : 'bg-slate-200'
            }`}
            style={{
              height: isListening || isSpeaking 
                ? `${Math.max(18, Math.min(100, Math.round(h * (0.4 + Math.random() * 0.6))))}%` 
                : '20%',
              transform: isListening || isSpeaking ? 'scaleY(1.1)' : 'scaleY(1)',
              transitionDelay: `${i * 25}ms`
            }}
          />
        ))}
      </div>

      {/* Real-time Status or Spoken Transcript Preview */}
      <div className="min-h-[2.75rem] flex flex-col items-center justify-center max-w-sm px-2">
        {interimTranscript ? (
          <p className="text-xs font-semibold text-sky-900 bg-sky-50/80 px-3.5 py-1.5 rounded-xl border border-sky-200/60 shadow-2xs">
            "{interimTranscript}"
          </p>
        ) : isListening ? (
          <p className="text-xs text-sky-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            Listening in {langInfo.label}...
          </p>
        ) : isThinking ? (
          <p className="text-xs text-purple-700 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Analyzing symptoms & checking doctor availability...
          </p>
        ) : isSpeaking ? (
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Murf Falcon 2.1 voice active
          </p>
        ) : (
          <p className="text-xs text-slate-400 font-medium">
            Tap the button above to speak in your language
          </p>
        )}
      </div>

    </div>
  );
}
