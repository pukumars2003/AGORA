import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

const LANGUAGES = [
  {
    id: 'en',
    code: 'en-IN',
    nativeName: 'English',
    englishLabel: 'Indian English',
    desc: 'Speak naturally in English'
  },
  {
    id: 'hi',
    code: 'hi-IN',
    nativeName: 'हिन्दी',
    englishLabel: 'Hindi · Hinglish',
    desc: 'हिन्दी और Hinglish दोनों समर्थित'
  },
  {
    id: 'kn',
    code: 'kn-IN',
    nativeName: 'ಕನ್ನಡ',
    englishLabel: 'Kannada',
    desc: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ'
  },
  {
    id: 'te',
    code: 'te-IN',
    nativeName: 'తెలుగు',
    englishLabel: 'Telugu',
    desc: 'తెలుగులో మాట్లాడండి'
  }
];

export default function LanguageSelectScreen({ onSelectLanguage }) {
  const [selected, setSelected] = useState('hi');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-[#0B1B3A]">
      <div className="max-w-4xl w-full flex flex-col items-center text-center">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1B3A]">
            Choose your language
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-500 font-medium">
            भाषा चुनें · ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ · భాష ఎంచుకోండి
          </p>
        </div>

        {/* 4 Cards Grid - Matches Screen 6 from Figma HTML */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-4xl">
          {LANGUAGES.map((lang, index) => {
            const isSelected = selected === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl transition-all duration-300 text-center cursor-pointer relative ${
                  isSelected
                    ? 'border-3 border-[#1D4ED8] bg-[#EFF6FF] shadow-lg shadow-blue-500/10 scale-105'
                    : 'border border-[#BFDBFE] bg-white hover:border-[#3B82F6] hover:shadow-md'
                }`}
                style={{ height: '240px' }}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <span className="text-3xl sm:text-4xl font-extrabold text-[#1D4ED8] tracking-tight">
                  {lang.nativeName}
                </span>
                
                <span className="mt-3 text-sm sm:text-base font-semibold text-slate-700">
                  {lang.englishLabel}
                </span>

                <span className="mt-1 text-xs text-slate-400 font-medium">
                  {lang.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="mt-10">
          <button
            onClick={() => onSelectLanguage(selected)}
            className="px-10 py-4 bg-[#1D4ED8] hover:bg-blue-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
