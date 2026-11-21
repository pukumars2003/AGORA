import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle, ArrowRight, Camera, Navigation, Star, MapPin, PhoneCall, X,
  Radio, MicOff, PhoneOff
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
  const [agoraOutboundCall, setAgoraOutboundCall] = useState(null); // 15-second Agora test trigger
  
  // Agora Conversational AI Agent RTC Session
  const [agoraSession, setAgoraSession] = useState({
    connected: false,
    channel: 'swasthya-sahayak-room',
    pipelineId: '5702f40d38094584a3118c1b0460d763',
    voice: 'MiniMax Radiant Girl (speech-2.8-turbo)',
    isMuted: false,
    remoteSpeaking: false,
    connecting: false
  });
  
  const isSubmittingRef = useRef(false);
  const agoraTimerRef = useRef(null);
  
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

  // Speech Recognition ONLY when Agora RTC is inactive (avoids parallel double-processing!)
  useEffect(() => {
    if (!currentUser || !currentLang) return;
    if (agoraSession.connected) {
      voiceManager.stopListening();
      return;
    }
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
  }, [currentUser, currentLang, agoraSession.connected]);

  // --- Agora Conversational AI Agent RTC Integration ---
  const connectAgoraAgent = async () => {
    if (!currentLang) return;
    setAgoraSession(prev => ({ ...prev, connecting: true }));
    try {
      const res = await fetch('/api/agora/start-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_name: 'swasthya-sahayak-room',
          language: currentLang,
          user_uid: 1234,
          pipeline_id: '5702f40d38094584a3118c1b0460d763'
        })
      });
      const data = await res.json();
      if (data.token) {
        const joinRes = await voiceManager.joinAgoraChannel(
          data.app_id,
          data.channel_name,
          data.token,
          data.user_uid,
          (remoteActive) => {
            setAgoraSession(prev => ({ ...prev, remoteSpeaking: remoteActive }));
            if (remoteActive) {
              setVoiceState('SPEAKING');
            } else {
              setVoiceState('IDLE');
            }
          }
        );
        setAgoraSession(prev => ({
          ...prev,
          connected: joinRes.status === 'connected',
          connecting: false,
          channel: data.channel_name,
          voice: 'MiniMax Radiant Girl (speech-2.8-turbo)'
        }));
      }
    } catch (e) {
      console.warn("Agora connect error:", e);
      setAgoraSession(prev => ({ ...prev, connecting: false }));
    }
  };

  const disconnectAgoraAgent = async () => {
    await voiceManager.leaveAgoraChannel();
    setAgoraSession(prev => ({
      ...prev,
      connected: false,
      remoteSpeaking: false,
      connecting: false
    }));
  };

  const toggleAgoraMicMute = () => {
    const isNowMuted = !voiceManager.toggleMicrophone();
    setAgoraSession(prev => ({ ...prev, isMuted: isNowMuted }));
  };

  // Auto-connect to Agora Conversational AI RTC Channel upon language selection
  useEffect(() => {
    if (currentUser && currentLang) {
      connectAgoraAgent();
    }
    return () => {
      voiceManager.leaveAgoraChannel();
    };
  }, [currentUser, currentLang]);

  // In-memory instant greetings for 0ms initial voice playback
  const GREETINGS = {
    hi: "Namaste! Main Swasthya Sahayak hoon, aapka healthcare assistant. Aap mujhe batayein — kya takleef hai ya kis doctor se milna hai? Main aapki madad ke liye yahan hoon!",
    kn: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ವಾಸ್ಥ್ಯ ಸಹಾಯಕ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮಗೆ ಏನು ತೊಂದರೆ ಇದೆ ಎಂದು ಹೇಳಿ. ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ!",
    te: "నమస్కారం! నేను స్వాస్థ్య సహాయక్, మీ హెల్త్‌కేర్ అసిస్టెంట్. మీకు ఏ సమస్య ఉందో చెప్పండి. మీకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను!",
    en: "Hi, thanks for calling Swasthya Sahayak. I can help you find specialists, check clinic hours, or connect you with a doctor. How can I help you today?"
  };

  // Instant agent greeting when language is chosen (zero network lag, radiant voice)
  useEffect(() => {
    if (!currentUser || !currentLang || hasGreeted) return;

    const greeting = GREETINGS[currentLang] || GREETINGS.en;
    setAssistantReply(greeting);
    setHasGreeted(true);

    voiceManager.ensureVoicesLoaded().then(() => {
      setVoiceState('SPEAKING');
      voiceManager.speak(
        greeting,
        currentLang,
        () => setVoiceState('SPEAKING'),
        () => setVoiceState('IDLE')
      );
    });
  }, [currentUser, currentLang, hasGreeted]);

  // Instant zero-lag slot booking when user clicks Confirm Slot
  const handleDirectConfirm = (targetDoc) => {
    voiceManager.stopSpeaking();
    voiceManager.stopListening();
    isSubmittingRef.current = false;

    const chosenDoc = targetDoc || suggestedDoctor || {
      name: "Dr. Ramesh Kumar",
      hospital: "Manipal Clinic, Koramangala",
      degrees: "MBBS, MD (Internal Medicine)",
      speciality: "General Physician",
      landmark: "Near Sony World Junction",
      distance: "1.2 km away",
      travel_time: "5 mins",
      fee: "₹400",
      rating: "4.9"
    };

    const newAppt = {
      id: `APT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      doctor_id: chosenDoc.id || 'doc-001',
      doctor_name: chosenDoc.name,
      degrees: chosenDoc.degrees || chosenDoc.speciality,
      speciality: chosenDoc.speciality,
      hospital: chosenDoc.hospital,
      city: chosenDoc.city || userLocation.city,
      landmark: chosenDoc.landmark || 'Near Sony World Signal',
      distance: chosenDoc.distance || '1.0 km away',
      travel_time: chosenDoc.travel_time || '5 mins',
      fee: chosenDoc.fee || '₹400',
      rating: chosenDoc.rating || '4.9',
      slot: '11:30 AM',
      date: 'Tomorrow',
      patient_name: currentUser?.name || 'Ravi Kumar',
      phone: currentUser?.phone || '+91 98450 12345',
      why_best: chosenDoc.why_best || ['Consistently rated 5 stars for minimal wait times'],
      map_directions: chosenDoc.map_directions || [
        `Head toward ${chosenDoc.hospital} (300 m)`,
        `Turn past ${chosenDoc.landmark || 'main junction'} (400 m)`,
        `OPD Entrance on your left (200 m)`
      ]
    };

    setAppointment(newAppt);
    setSuggestedDoctor(null);
    setSuggestedDoctors([]);
    setAssistantSteps([
      { name: 'search_doctors', label: 'search_doctors', status: 'done' },
      { name: 'get_slots', label: 'get_slots', status: 'done' },
      { name: 'book_appointment', label: 'book_appointment', status: 'done' },
      { name: 'sms_confirmation', label: 'SMS confirmation', status: 'sent' },
      { name: 'reminder_set', label: 'Reminder scheduled', status: 'set' }
    ]);

    const confirmSpeech = currentLang === 'hi'
      ? `Aapka appointment ${chosenDoc.name} ke sath kal subah 11:30 baje confirm ho gaya hai. Clinic route aur directions ready hain.`
      : currentLang === 'kn'
      ? `Nimma appointment ${chosenDoc.name} jothe naale belagge 11:30 AM ge confirm aagide. Clinic route details ready ide.`
      : currentLang === 'te'
      ? `Mee appointment ${chosenDoc.name} garitho repu 11:30 AM ki confirm ayindi. Clinic route details ready ga unnayi.`
      : `Your appointment with ${chosenDoc.name} has been confirmed for tomorrow at 11:30 AM. Clinic route and Google Maps directions are active.`;

    setAssistantReply(confirmSpeech);
    setVoiceState('SPEAKING');
    voiceManager.speak(confirmSpeech, currentLang, () => setVoiceState('SPEAKING'), () => setVoiceState('IDLE'));

    // Start 15-second Agora RTC Outbound Reminder test timer
    if (agoraTimerRef.current) clearTimeout(agoraTimerRef.current);
    agoraTimerRef.current = setTimeout(() => {
      const patientName = currentUser?.name || 'Ravi Kumar';
      const outboundPrompt = currentLang === 'hi'
        ? `Namaste ${patientName}! Yeh Swasthya Sahayak ka Agora Outbound Reminder call hai. Kal subah 11:30 baje ${chosenDoc.name} ke sath aapka consultation confirm hai.`
        : currentLang === 'kn'
        ? `Namaskara ${patientName}! Idu Swasthya Sahayak Agora Outbound Reminder call. Naale belagge 11:30 AM ge ${chosenDoc.name} jothe nimma consultation confirm aagide.`
        : currentLang === 'te'
        ? `Namaskaram ${patientName}! Idi Swasthya Sahayak Agora Outbound Reminder call. Repu 11:30 AM ki ${chosenDoc.name} garitho mee consultation confirm ayindi.`
        : `Hello ${patientName}! This is Alex Morgan with your live Agora outbound appointment reminder. Your consultation is confirmed for tomorrow at 11:30 AM with ${chosenDoc.name}.`;

      setAgoraOutboundCall({
        doctor: chosenDoc.name,
        slot: '11:30 AM',
        patient: patientName,
        message: outboundPrompt
      });
      voiceManager.speak(outboundPrompt, currentLang);
    }, 15000);
  };

  // Handle voice or text message processing with anti-loop echo protection
  const handleVoiceSubmit = async (text) => {
    if (!text || !text.trim()) return;
    if (isSubmittingRef.current || voiceState === 'SPEAKING') return;

    // Reject self-echoes where mic picks up the exact assistant reply
    if (assistantReply && text.trim().toLowerCase() === assistantReply.trim().toLowerCase()) return;

    isSubmittingRef.current = true;
    voiceManager.stopListening();
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

        // Start 15-second Agora RTC Outbound Reminder test timer!
        if (agoraTimerRef.current) clearTimeout(agoraTimerRef.current);
        agoraTimerRef.current = setTimeout(() => {
          const docName = data.appointment.doctor_name || 'the doctor';
          const slotTime = data.appointment.slot || '11:30 AM';
          const patientName = currentUser?.name || 'Ravi Kumar';
          
          const outboundPrompt = currentLang === 'hi'
            ? `Namaste ${patientName}! Yeh Swasthya Sahayak ka Agora Outbound Reminder call hai. Kal subah ${slotTime} baje ${docName} ke sath aapka consultation confirm hai. Clinic route ready hai.`
            : currentLang === 'kn'
            ? `Namaskara ${patientName}! Idu Swasthya Sahayak Agora Outbound Reminder call. Naale belagge ${slotTime} ge ${docName} jothe nimma consultation confirm aagide.`
            : currentLang === 'te'
            ? `Namaskaram ${patientName}! Idi Swasthya Sahayak Agora Outbound Reminder call. Repu ${slotTime} ki ${docName} garitho mee consultation confirm ayindi.`
            : `Hello ${patientName}! This is Alex Morgan with your live Agora outbound appointment reminder. Your consultation is confirmed for tomorrow at ${slotTime} with ${docName}.`;
          
          setAgoraOutboundCall({
            doctor: docName,
            slot: slotTime,
            patient: patientName,
            message: outboundPrompt
          });

          voiceManager.speak(outboundPrompt, currentLang);
        }, 15000);
      }

      setVoiceState('SPEAKING');
      voiceManager.speak(
        data.spoken_text,
        currentLang,
        () => setVoiceState('SPEAKING'),
        () => {
          setVoiceState('IDLE');
          setTimeout(() => {
            isSubmittingRef.current = false;
          }, 800);
        }
      );
    } catch (err) {
      console.error('Submit error:', err);
      setVoiceState('IDLE');
      isSubmittingRef.current = false;
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
    setSuggestedDoctors([]);
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
    disconnectAgoraAgent();
    setCurrentUser(null);
    setCurrentLang(null);
    setSpokenText('');
    setAssistantReply('');
    setAppointment(null);
    setSuggestedDoctor(null);
    setSuggestedDoctors([]);
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
        isAgoraActive={agoraSession.connected}
        userLocation={userLocation}
        onLocationChange={(loc) => setUserLocation(loc)}
      />

      {/* Main Screen 7 Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Agora RTC Conversational AI Agent Live Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-sky-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all ${
              agoraSession.connected 
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/20' 
                : agoraSession.connecting
                ? 'bg-amber-500 text-white animate-spin'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Agora Conversational AI Voice Agent
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  agoraSession.connected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : agoraSession.connecting
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${agoraSession.connected ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {agoraSession.connected ? 'RTC Live Voice Stream Active' : agoraSession.connecting ? 'Connecting...' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Voice: <span className="text-sky-700 font-semibold">MiniMax speech-2.8-turbo (English_radiant_girl)</span> • Channel: <span className="font-mono text-slate-600">{agoraSession.channel}</span>
                {agoraSession.remoteSpeaking && (
                  <span className="ml-2 text-emerald-600 font-bold animate-pulse">
                    [Agent Voice Streaming Live]
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {agoraSession.connected ? (
              <>
                <button
                  onClick={toggleAgoraMicMute}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    agoraSession.isMuted
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={agoraSession.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {agoraSession.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{agoraSession.isMuted ? 'Mic Muted' : 'Mic Active'}</span>
                </button>
                <button
                  onClick={disconnectAgoraAgent}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                onClick={connectAgoraAgent}
                disabled={agoraSession.connecting}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{agoraSession.connecting ? 'Connecting...' : 'Connect Agora Live Agent'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Pills Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#DBEAFE] shadow-2xs">
          <div className="flex items-center gap-2 px-1 sm:px-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-800">
              {currentUser.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {userLocation.area}, {userLocation.city}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPrescriptionModal(true)}
              className="justify-center min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] hover:bg-blue-100 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Prescription AI</span>
            </button>
            <button
              onClick={() => setShowMapModal(true)}
              className="justify-center min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Clinic Map</span>
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="justify-center min-w-0 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* 15-Second Agora RTC Outbound Reminder Active Banner */}
        {agoraOutboundCall && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 animate-pulse">
                <PhoneCall className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    Agora RTC Outbound Reminder (15s Simulation Triggered)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                </div>
                <h3 className="font-extrabold text-base mt-0.5">
                  Live Outbound Voice Call: {agoraOutboundCall.doctor}
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5 max-w-xl">
                  "{agoraOutboundCall.message}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  voiceManager.speak("Thank you for confirming your attendance! See you tomorrow at the clinic.", currentLang);
                  setAgoraOutboundCall(null);
                }}
                className="px-4 py-2 bg-white text-emerald-800 font-extrabold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition"
              >
                Press 1: Confirm Attendance
              </button>
              <button
                onClick={() => {
                  voiceManager.stopSpeaking();
                  setAgoraOutboundCall(null);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                title="Dismiss Call"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
                onConfirmSlot={(doc) => handleDirectConfirm(doc)}
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
        Agora Conversational AI &amp; Murf Falcon 2.1 Healthcare Platform
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
