import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import LanguageSelectScreen from './components/LanguageSelectScreen';
import DoctorDashboard from './components/DoctorDashboard';
import Header from './components/Header';
import AppointmentCard from './components/AppointmentCard';
import NearbyDoctorRecommendation from './components/NearbyDoctorRecommendation';
import DoctorDirectoryModal from './components/DoctorDirectoryModal';
import AdminModelModal from './components/AdminModelModal';
import PrescriptionScannerModal from './components/PrescriptionScannerModal';
import ClinicMapModal from './components/ClinicMapModal';
import FeedbackModal from './components/FeedbackModal';
import { voiceManager, LANGUAGE_CONFIG } from './services/voiceService';
import { 
  Mic, Volume2, Sparkles, Loader2, Send, 
  CheckCircle, ArrowRight, Camera, Navigation, Star, MapPin
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLang, setCurrentLang] = useState(null); // Step 2: Language Selection!
  const [voiceState, setVoiceState] = useState('IDLE');
  const [spokenText, setSpokenText] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [suggestedDoctor, setSuggestedDoctor] = useState(null);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [hasGreeted, setHasGreeted] = useState(false);
  
  // What the assistant did step tracker (from Screen 7)
  const [assistantSteps, setAssistantSteps] = useState([]);

  // Modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // User Location
  const [userLocation, setUserLocation] = useState({
    area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245
  });

  // GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = 'Bengaluru', area = 'Koramangala';
        if (latitude > 27 && latitude < 30) { city = 'Delhi'; area = 'Okhla'; }
        else if (latitude > 18 && latitude < 20) { city = 'Mumbai'; area = 'Vile Parle'; }
        else if (latitude > 16 && latitude < 18) { city = 'Hyderabad'; area = 'Jubilee Hills'; }
        setUserLocation({ area, city, lat: latitude, lng: longitude });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  // Initialize Speech Recognition when user selects language
  useEffect(() => {
    if (!currentUser || !currentLang) return;
    const langInfo = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG.hi;

    voiceManager.initSpeechRecognition(
      langInfo.code,
      (transcript, isFinal) => {
        setSpokenText(transcript);
        if (isFinal && transcript.trim()) {
          handleVoiceSubmit(transcript.trim());
        }
      },
      (state) => {
        setVoiceState(state);
      }
    );
  }, [currentUser, currentLang]);

  // Agent speaks initial greeting when language is chosen
  useEffect(() => {
    if (!currentUser || !currentLang || hasGreeted) return;

    const greetUser = async () => {
      try {
        const res = await fetch(`/api/agent/greet?language=${currentLang}`);
        if (!res.ok) return;
        const data = await res.json();
        const greeting = data.greeting;

        setAssistantReply(greeting);
        setHasGreeted(true);

        setVoiceState('SPEAKING');
        voiceManager.speak(
          greeting,
          currentLang,
          () => setVoiceState('SPEAKING'),
          () => setVoiceState('IDLE')
        );
      } catch (e) {
        console.error('Greeting error:', e);
      }
    };
    greetUser();
  }, [currentUser, currentLang, hasGreeted]);

  // Handle voice or text message processing
  const handleVoiceSubmit = async (text) => {
    if (!text.trim()) return;

    setSpokenText(text);
    setVoiceState('THINKING');

    // Add step: understanding
    setAssistantSteps([
      { name: 'interpret_intent', label: 'Interpret patient intent', status: 'done' },
      { name: 'search_doctors', label: 'search_doctors', status: 'running' }
    ]);

    try {
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: currentLang,
          history: assistantReply ? [{ role: 'assistant', content: assistantReply }] : [],
          patient_lat: userLocation.lat,
          patient_lng: userLocation.lng
        })
      });

      if (!res.ok) throw new Error('API interaction failed');
      const data = await res.json();

      setAssistantReply(data.spoken_text);

      if (data.emergency) {
        setEmergencyAlert(data.spoken_text);
      } else {
        setEmergencyAlert(null);
      }

      if (data.suggested_doctor) {
        setSuggestedDoctor(data.suggested_doctor);
        setSuggestedDoctors(data.suggested_doctors || [data.suggested_doctor]);
        setAssistantSteps([
          { name: 'search_doctors', label: 'search_doctors', status: 'done' },
          { name: 'get_slots', label: 'get_slots', status: 'done' }
        ]);
      }

      if (data.appointment) {
        setAppointment(data.appointment);
        setSuggestedDoctor(null);
        setSuggestedDoctors([]);
        setAssistantSteps([
          { name: 'search_doctors', label: 'search_doctors', status: 'done' },
          { name: 'get_slots', label: 'get_slots', status: 'done' },
          { name: 'book_appointment', label: 'book_appointment', status: 'done' },
          { name: 'sms_confirmation', label: 'SMS confirmation', status: 'sent' },
          { name: 'reminder_set', label: 'Reminder scheduled', status: 'set' }
        ]);
      }

      setVoiceState('SPEAKING');
      voiceManager.speak(
        data.spoken_text,
        currentLang,
        () => setVoiceState('SPEAKING'),
        () => setVoiceState('IDLE')
      );
    } catch (err) {
      console.error('Submit error:', err);
      setVoiceState('IDLE');
    }
  };

  const handleToggleMic = () => {
    if (voiceState === 'LISTENING') {
      voiceManager.stopListening();
      setVoiceState('IDLE');
    } else {
      voiceManager.stopSpeaking();
      voiceManager.startListening();
      setVoiceState('LISTENING');
    }
  };

  const handleReset = async () => {
    voiceManager.stopSpeaking();
    voiceManager.stopListening();
    setSpokenText('');
    setAssistantReply('');
    setAppointment(null);
    setSuggestedDoctor(null);
    setEmergencyAlert(null);
    setAssistantSteps([]);
    setVoiceState('IDLE');
    setHasGreeted(false);
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {}
  };

  const handleLogout = () => {
    voiceManager.stopSpeaking();
    voiceManager.stopListening();
    setCurrentUser(null);
    setCurrentLang(null);
    setSpokenText('');
    setAssistantReply('');
    setAppointment(null);
    setSuggestedDoctor(null);
    setEmergencyAlert(null);
    setAssistantSteps([]);
    setVoiceState('IDLE');
    setHasGreeted(false);
  };

  // STEP 1: LOGIN SCREEN
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // DOCTOR DASHBOARD (Screen 9)
  if (currentUser.role === 'doctor') {
    return <DoctorDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // STEP 2: LANGUAGE SELECTION SCREEN (Screen 6)
  if (!currentLang) {
    return <LanguageSelectScreen onSelectLanguage={(lang) => setCurrentLang(lang)} />;
  }

  // STEP 3: CLEAN VOICE ASSISTANT & PATIENT DASHBOARD (Screens 7 & 8)
  const isListening = voiceState === 'LISTENING';
  const isSpeaking = voiceState === 'SPEAKING';
  const isThinking = voiceState === 'THINKING';
  const langInfo = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG.hi;

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0B1B3A] flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        currentLang={currentLang}
        onSelectLang={(lang) => {
          setCurrentLang(lang);
          voiceManager.stopSpeaking();
        }}
        onReset={handleReset}
        onOpenDoctors={() => setShowDoctorModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenLogin={handleLogout}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAgoraActive={true}
        userLocation={userLocation}
        onLocationChange={(loc) => setUserLocation(loc)}
      />

      {/* Main Screen 7 Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Action Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#DBEAFE] shadow-2xs">
          <div className="flex items-center gap-2 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              {currentUser.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {userLocation.area}, {userLocation.city}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Prescription AI</span>
            </button>
            <button
              onClick={() => setShowMapModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Clinic Map</span>
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Voice Interaction Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: The Animated Voice Assistant Orb (Screen 7 exact design) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DBEAFE] p-6 sm:p-8 shadow-xs flex flex-col items-center text-center">
            
            <div className="w-full flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B1B3A] tracking-tight">
                Talk to your assistant
              </h1>
              <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-xs font-bold border border-[#BFDBFE]">
                {langInfo.label}
              </span>
            </div>

            {/* Central Animated Orb */}
            <div className="relative my-8 flex items-center justify-center">
              
              {/* Concentric Figma Sound Rings */}
              <div 
                className={`absolute w-44 h-44 rounded-full border-2 border-[#3B82F6] transition-all duration-700 pointer-events-none ${
                  isListening || isSpeaking ? 'scale-125 opacity-40 animate-ping' : 'opacity-20'
                }`}
                style={{ animationDuration: '3s' }}
              />
              <div 
                className={`absolute w-56 h-56 rounded-full border border-[#BFDBFE] transition-all duration-700 pointer-events-none ${
                  isSpeaking ? 'scale-110 opacity-30 animate-pulse' : 'opacity-10'
                }`}
              />

              {/* Central Glowing Sphere Button */}
              <button
                onClick={handleToggleMic}
                className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-xl select-none ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] scale-105 shadow-blue-500/40 ring-4 ring-blue-100'
                    : isSpeaking
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-700 scale-105 shadow-emerald-500/40 ring-4 ring-emerald-100'
                    : isThinking
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-700 shadow-purple-500/30'
                    : 'bg-gradient-to-tr from-[#3B82F6] to-[#1D4ED8] hover:scale-105 shadow-blue-500/30'
                }`}
              >
                {/* 4 Animated Vertical Audio Bars inside orb */}
                <div className="flex items-center gap-1.5 h-12">
                  <div className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isListening || isSpeaking ? 'h-8 animate-pulse' : 'h-4'}`} />
                  <div className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isListening || isSpeaking ? 'h-12 animate-pulse' : 'h-6'}`} style={{ animationDelay: '0.2s' }} />
                  <div className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isListening || isSpeaking ? 'h-10 animate-pulse' : 'h-5'}`} style={{ animationDelay: '0.4s' }} />
                  <div className={`w-1.5 rounded-full bg-white transition-all duration-200 ${isListening || isSpeaking ? 'h-7 animate-pulse' : 'h-3'}`} style={{ animationDelay: '0.6s' }} />
                </div>

                <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                  {isListening ? 'Listening…' : isThinking ? 'Thinking…' : isSpeaking ? 'Speaking…' : 'Tap to Talk'}
                </span>
              </button>
            </div>

            {/* Status Indicator */}
            <p className="text-sm font-semibold text-[#475569] mb-4">
              {isListening 
                ? 'Listening to your symptoms… speak naturally in your language' 
                : isSpeaking 
                ? 'Assistant is speaking…' 
                : isThinking 
                ? 'Finding available doctors…'
                : 'Tap circle to speak or type below'}
            </p>

            {/* Live Spoken Input Preview (Speech to text feedback) */}
            {spokenText && (
              <div className="w-full bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 text-left mb-4">
                <span className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider block mb-1">
                  You said:
                </span>
                <p className="text-sm font-semibold text-[#0B1B3A]">
                  "{spokenText}"
                </p>
              </div>
            )}

            {/* Assistant Spoken Response Display */}
            {assistantReply && (
              <div className="w-full bg-white border border-[#DBEAFE] rounded-2xl p-4 text-left shadow-2xs mb-4">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Assistant replied:
                </span>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {assistantReply}
                </p>
                <button
                  onClick={() => voiceManager.speak(assistantReply, currentLang)}
                  className="mt-2 text-xs font-bold text-[#1D4ED8] hover:underline flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen again</span>
                </button>
              </div>
            )}

            {/* Manual Text Fallback Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.manualText.value;
                if (val.trim()) {
                  handleVoiceSubmit(val.trim());
                  e.target.reset();
                }
              }}
              className="w-full flex gap-2"
            >
              <input
                name="manualText"
                type="text"
                placeholder={`Type in ${langInfo.label}... e.g. Mujhe kal se sar dard hai`}
                className="flex-1 text-sm bg-white border border-[#BFDBFE] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1D4ED8]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

          {/* Right: "What the assistant did" Step Log & Confirmed Booking Card (Screen 7 & 8) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* What the assistant did Panel */}
            <div className="bg-white rounded-3xl border border-[#DBEAFE] p-6 shadow-xs">
              <h2 className="text-base font-extrabold text-[#0B1B3A] mb-4">
                What the assistant did
              </h2>

              <div className="space-y-3">
                {assistantSteps.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-2">
                    Action pipeline will activate when you speak.
                  </p>
                ) : (
                  assistantSteps.map((step, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-[#EFF6FF] text-xs font-semibold"
                    >
                      <span className="font-mono text-slate-700">{step.label}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        step.status === 'done' || step.status === 'sent' || step.status === 'set'
                          ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                          : 'bg-amber-50 text-amber-700 animate-pulse'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Doctor Recommendations or Confirmed Booking */}
            {(suggestedDoctors.length > 0 || suggestedDoctor) && !appointment && (
              <NearbyDoctorRecommendation
                doctors={suggestedDoctors}
                doctor={suggestedDoctor}
                onConfirmSlot={(doc) => {
                  const targetDoc = doc || suggestedDoctor;
                  handleVoiceSubmit(
                    currentLang === 'hi' 
                      ? `Haan, ${targetDoc?.name || 'doctor'} ka slot book kar do`
                      : currentLang === 'kn'
                      ? `Haudu, ${targetDoc?.name || 'doctor'} appointment book maadi`
                      : currentLang === 'te'
                      ? `Avunu, ${targetDoc?.name || 'doctor'} appointment confirm cheyandi`
                      : `Yes, please confirm the appointment with ${targetDoc?.name || 'the doctor'}`
                  );
                }}
              />
            )}

            {appointment && (
              <AppointmentCard appointment={appointment} />
            )}

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#DBEAFE] bg-white py-3 text-center text-xs text-slate-400 font-medium mt-auto">
        Swasthya Sahayak (स्वास्थ्य सहायक) • Agora Conversational AI & Murf Falcon 2.1 TTS
      </footer>

      {/* Modals */}
      <DoctorDirectoryModal isOpen={showDoctorModal} onClose={() => setShowDoctorModal(false)} onSelectDoctor={(doc) => setSuggestedDoctor(doc)} />
      <AdminModelModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <PrescriptionScannerModal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} currentLang={currentLang} />
      <ClinicMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)}
        doctor={appointment || suggestedDoctor || { name: "Dr. Ramesh Kumar", hospital: "Manipal Clinic, Koramangala", landmark: "Near Sony World Junction", city: "Bengaluru", distance: "1.2 km away", travel_time: "5 mins" }} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} doctor={appointment || suggestedDoctor} />

    </div>
  );
}
