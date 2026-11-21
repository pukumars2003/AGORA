import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import DoctorDashboard from './components/DoctorDashboard';
import Header from './components/Header';
import VoiceVisualizer from './components/VoiceVisualizer';
import TranscriptPanel from './components/TranscriptPanel';
import AppointmentCard from './components/AppointmentCard';
import DoctorDirectoryModal from './components/DoctorDirectoryModal';
import NearbyDoctorRecommendation from './components/NearbyDoctorRecommendation';
import AdminModelModal from './components/AdminModelModal';
import PrescriptionScannerModal from './components/PrescriptionScannerModal';
import ClinicMapModal from './components/ClinicMapModal';
import FeedbackModal from './components/FeedbackModal';
import { voiceManager, LANGUAGE_CONFIG } from './services/voiceService';
import { Camera, Navigation, Star } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLang, setCurrentLang] = useState('hi');
  const [messages, setMessages] = useState([]);
  const [voiceState, setVoiceState] = useState('IDLE');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [suggestedDoctor, setSuggestedDoctor] = useState(null);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [isAgoraActive, setIsAgoraActive] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  // User Location
  const [userLocation, setUserLocation] = useState({
    area: 'Koramangala', city: 'Bengaluru', lat: 12.9352, lng: 77.6245
  });

  // Clean Modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // GPS Geolocation
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

  // Agent speaks first greeting
  useEffect(() => {
    if (!currentUser || hasGreeted) return;

    const greetUser = async () => {
      try {
        const res = await fetch(`/api/agent/greet?language=${currentLang}`);
        if (!res.ok) return;
        const data = await res.json();
        const greeting = data.greeting;

        const botMsg = {
          role: 'assistant',
          content: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([botMsg]);
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
  }, [currentUser, hasGreeted, currentLang]);

  // Check appointments poll
  useEffect(() => {
    if (!currentUser) return;
    const fetchAppointments = async () => {
      try {
        const apptRes = await fetch('/api/appointments');
        if (apptRes.ok) {
          const apptData = await apptRes.json();
          if (apptData.appointments && apptData.appointments.length > 0) {
            setAppointment(apptData.appointments[0]);
          }
        }
      } catch (e) {}
    };
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Speech Recognition
  useEffect(() => {
    if (!currentUser) return;
    const langInfo = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG.hi;
    voiceManager.initSpeechRecognition(
      langInfo.code,
      (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal && transcript.trim()) {
          handleSendMessage(transcript.trim());
          setInterimTranscript('');
        }
      },
      (state) => setVoiceState(state)
    );
  }, [currentLang, currentUser]);

  // Process message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      role: 'user',
      content: text,
      timestamp: timeStr
    };
    setMessages((prev) => [...prev, userMsg]);
    setVoiceState('THINKING');

    try {
      const historyPayload = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/voice/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: currentLang,
          history: historyPayload,
          patient_lat: userLocation.lat,
          patient_lng: userLocation.lng
        })
      });

      if (!res.ok) throw new Error('API interaction failed');
      const data = await res.json();

      if (data.emergency) {
        setEmergencyAlert(data.spoken_text);
      } else {
        setEmergencyAlert(null);
      }

      if (data.suggested_doctor) setSuggestedDoctor(data.suggested_doctor);
      if (data.appointment) {
        setAppointment(data.appointment);
        setSuggestedDoctor(null);
      }

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMsg = { role: 'assistant', content: data.spoken_text, timestamp: botTime };
      setMessages((prev) => [...prev, botMsg]);

      setVoiceState('SPEAKING');
      voiceManager.speak(
        data.spoken_text, currentLang,
        () => setVoiceState('SPEAKING'),
        () => setVoiceState('IDLE')
      );
    } catch (err) {
      console.error('Interaction error:', err);
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
    setMessages([]);
    setAppointment(null);
    setSuggestedDoctor(null);
    setEmergencyAlert(null);
    setVoiceState('IDLE');
    setInterimTranscript('');
    setHasGreeted(false);
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {}
  };

  const handleLogout = () => {
    voiceManager.stopSpeaking();
    voiceManager.stopListening();
    setCurrentUser(null);
    setMessages([]);
    setHasGreeted(false);
    setAppointment(null);
    setSuggestedDoctor(null);
    setEmergencyAlert(null);
    setVoiceState('IDLE');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  if (currentUser.role === 'doctor') {
    return <DoctorDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-800 antialiased font-sans">
      <Header
        currentLang={currentLang}
        onSelectLang={(lang) => { setCurrentLang(lang); voiceManager.stopSpeaking(); }}
        onReset={handleReset}
        onOpenDoctors={() => setShowDoctorModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenLogin={handleLogout}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAgoraActive={isAgoraActive}
        userLocation={userLocation}
        onLocationChange={(loc) => setUserLocation(loc)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Clean Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-xs transition-all">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-800">
              Welcome, {currentUser.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {userLocation.area}, {userLocation.city}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowPrescriptionModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 text-slate-700 hover:text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Prescription AI</span>
            </button>

            <button 
              onClick={() => setShowMapModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clinic Route</span>
            </button>

            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-slate-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Primary Interaction Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Orb & Booking Card */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceVisualizer
              voiceState={voiceState}
              onToggleMic={handleToggleMic}
              currentLang={currentLang}
              interimTranscript={interimTranscript}
            />

            {suggestedDoctor && (
              <NearbyDoctorRecommendation
                doctor={suggestedDoctor}
                onConfirmSlot={() => {
                  handleSendMessage(
                    currentLang === 'hi' ? 'Haan, kal subah 11:30 baje ka slot book kar dijiye'
                    : currentLang === 'kn' ? 'Haudu, 11:30 gantege appointment book maadi'
                    : currentLang === 'te' ? 'Avunu, repu 11:30 ki slot confirm cheyandi'
                    : 'Yes, please confirm the 11:30 AM appointment'
                  );
                }}
              />
            )}

            <AppointmentCard appointment={appointment} />
          </div>

          {/* Right Column: Clean Conversation Panel */}
          <div className="lg:col-span-7">
            <TranscriptPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              currentLang={currentLang}
              emergencyAlert={emergencyAlert}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-4 text-center text-xs text-slate-400 font-medium mt-auto">
        <p>Swasthya Sahayak (स्वास्थ्य सहायक) • Agora Conversational AI & Murf Falcon 2.1 TTS</p>
      </footer>

      <DoctorDirectoryModal isOpen={showDoctorModal} onClose={() => setShowDoctorModal(false)} onSelectDoctor={(doc) => setSuggestedDoctor(doc)} />
      <AdminModelModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
      <PrescriptionScannerModal isOpen={showPrescriptionModal} onClose={() => setShowPrescriptionModal(false)} currentLang={currentLang} />
      <ClinicMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)}
        doctor={appointment || suggestedDoctor || { name: "Dr. Ramesh Kumar", hospital: "Manipal Clinic, Koramangala", landmark: "Near Sony World Junction", city: "Bengaluru", distance: "1.2 km away", travel_time: "5 mins" }} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} doctor={appointment || suggestedDoctor} />
    </div>
  );
}
