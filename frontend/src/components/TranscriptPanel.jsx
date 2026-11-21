import React, { useRef, useEffect, useState } from 'react';
import { User, Bot, Volume2, AlertTriangle, Send, PhoneCall, ThumbsUp, ThumbsDown } from 'lucide-react';
import { voiceManager } from '../services/voiceService';

export default function TranscriptPanel({ 
  messages, 
  onSendMessage, 
  currentLang, 
  emergencyAlert 
}) {
  const [inputText, setInputText] = useState('');
  const [ratedMessages, setRatedMessages] = useState({});
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, emergencyAlert]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleSpeakText = (text) => {
    const langCode = currentLang === 'hi' ? 'hi-IN' : currentLang === 'kn' ? 'kn-IN' : currentLang === 'te' ? 'te-IN' : 'en-IN';
    voiceManager.speak(text, langCode);
  };

  const handleRateRL = async (msgIndex, rating) => {
    setRatedMessages(prev => ({ ...prev, [msgIndex]: rating }));
    try {
      await fetch('/api/feedback/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: 'groq',
          rating: rating === 'up' ? 5.0 : 1.0,
          latency_ms: 220.0,
          success: rating === 'up'
        })
      });
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs flex flex-col h-[520px] overflow-hidden transition-all duration-300">
      
      {/* Panel Top Bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-100/70 text-sky-700 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-800 tracking-tight">Conversation</h2>
            <p className="text-[10px] text-slate-400">Multilingual Voice & Chat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Emergency Guardrail Banner */}
      {emergencyAlert && (
        <div className="bg-rose-50/90 border-y border-rose-200/80 px-5 py-3.5 flex items-start gap-3 animate-fade-in">
          <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-rose-900 tracking-tight">
                Emergency Alert
              </h4>
              <a
                href="tel:108"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-xs transition"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call 108
              </a>
            </div>
            <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
              {emergencyAlert}
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Ready to assist you</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Tap the voice button or type a health concern in Hindi, Kannada, Telugu, or English.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const userRating = ratedMessages[index];

            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {/* Bot Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200/60 text-sky-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm transition-all ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-100/90 text-slate-800 rounded-tl-xs border border-slate-200/50'
                  }`}
                >
                  <p className="leading-relaxed font-normal whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t border-black/5 text-[11px] opacity-75">
                    <span className="font-medium text-[10px]">
                      {msg.timestamp || 'Just now'}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSpeakText(msg.content)}
                          className="inline-flex items-center gap-1 hover:text-sky-700 font-semibold transition"
                          title="Listen aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> 
                          <span>Listen</span>
                        </button>

                        <div className="flex items-center gap-1 border-l border-slate-300 pl-2">
                          <button
                            onClick={() => handleRateRL(index, 'up')}
                            className={`p-1 rounded transition hover:scale-110 ${
                              userRating === 'up'
                                ? 'text-emerald-700 bg-emerald-100 font-bold'
                                : 'text-slate-400 hover:text-emerald-600'
                            }`}
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRateRL(index, 'down')}
                            className={`p-1 rounded transition hover:scale-110 ${
                              userRating === 'down'
                                ? 'text-rose-700 bg-rose-100 font-bold'
                                : 'text-slate-400 hover:text-rose-600'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Manual Input Footer */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-slate-200/70 bg-slate-50/40 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type message in ${currentLang === 'hi' ? 'Hindi / Hinglish' : currentLang === 'kn' ? 'Kannada' : currentLang === 'te' ? 'Telugu' : 'English'}...`}
          className="flex-1 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 placeholder-slate-400 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
