import AgoraRTC from 'agora-rtc-sdk-ng';

export const LANGUAGE_CONFIG = {
  hi: {
    code: 'hi-IN',
    label: 'हिन्दी (Hindi)',
    voiceId: 'hi-IN-Kabir',
    voiceName: 'Murf Falcon 2.1 Kabir (hi-IN)'
  },
  kn: {
    code: 'kn-IN',
    label: 'ಕನ್ನಡ (Kannada)',
    voiceId: 'kn-IN-Gagan',
    voiceName: 'Murf Falcon 2.1 Gagan (kn-IN)'
  },
  te: {
    code: 'te-IN',
    label: 'తెలుగు (Telugu)',
    voiceId: 'te-IN-Mohan',
    voiceName: 'Murf Falcon 2.1 Mohan (te-IN)'
  },
  en: {
    code: 'en-IN',
    label: 'English',
    voiceId: 'Rachna',
    voiceName: 'Murf Falcon 2.1 Rachna (en-IN)'
  }
};

class VoiceManager {
  constructor() {
    this.agoraClient = null;
    this.localAudioTrack = null;
    this.speechRecognition = null;
    this.isListening = false;
    this.isSpeaking = false; // Guard flag to prevent speech-recognition echo loop!
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentAudio = null;
    this.voices = [];

    if (this.synth) {
      this.voices = this.synth.getVoices() || [];
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.voices = this.synth.getVoices() || [];
        };
      }
    }
  }

  // Initialize Speech Recognition
  initSpeechRecognition(langCode, onTranscript, onStateChange) {
    if (typeof window === 'undefined') return null;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRec) {
      console.warn("SpeechRecognition not available in this browser");
      return null;
    }

    if (this.speechRecognition) {
      try { 
        this.speechRecognition.onend = null;
        this.speechRecognition.onerror = null;
        this.speechRecognition.abort(); 
      } catch (e) {}
    }

    const recognition = new SpeechRec();
    recognition.continuous = false; // Use turn-based recognition to avoid infinite continuous mic looping!
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = langCode || 'hi-IN';

    recognition.onstart = () => {
      this.isListening = true;
      if (onStateChange) onStateChange('LISTENING');
    };

    recognition.onresult = (event) => {
      // If assistant is speaking or playing audio, completely ignore any mic input to prevent loops!
      if (this.isSpeaking) {
        return;
      }

      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      const text = (final || interim).trim();
      if (text && onTranscript && !this.isSpeaking) {
        onTranscript(text, Boolean(final));
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn("Speech recognition notice:", event.error);
      }
      if (event.error === 'not-allowed') {
        this.isListening = false;
        if (onStateChange) onStateChange('IDLE');
      }
    };

    recognition.onend = () => {
      this.isListening = false;
      if (onStateChange && !this.isSpeaking) onStateChange('IDLE');
    };

    this.speechRecognition = recognition;
    return recognition;
  }

  startListening() {
    if (!this.speechRecognition || this.isSpeaking) {
      return;
    }
    this.stopSpeaking();
    try {
      this.speechRecognition.start();
    } catch (e) {
      // Ignore if already running
    }
  }

  stopListening() {
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  // Speak through Murf Falcon 2.1 Streaming (or natural high-fidelity fallback)
  async speak(text, langKey = 'hi', onStart, onEnd) {
    this.stopSpeaking();
    this.stopListening(); // Critical: pause speech recognition immediately while speaking!
    this.isSpeaking = true;

    if (!text || !text.trim()) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    const cleanText = text.replace(/[*_#`~[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    const langInfo = LANGUAGE_CONFIG[langKey] || LANGUAGE_CONFIG.hi;

    const wrappedOnEnd = () => {
      // Cooldown buffer of 600ms before allowing mic again so speaker echoes die out
      setTimeout(() => {
        this.isSpeaking = false;
      }, 600);
      if (onEnd) onEnd();
    };

    try {
      const response = await fetch('/api/tts/murf-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: langKey,
          voice_id: langInfo.voiceId
        })
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;

        if (onStart) onStart();
        audio.onplay = () => { if (onStart) onStart(); };
        audio.onended = () => {
          wrappedOnEnd();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
        };
        audio.onerror = () => {
          this.speakFallback(cleanText, langKey, onStart, wrappedOnEnd);
        };
        audio.play().catch(() => {
          this.speakFallback(cleanText, langKey, onStart, wrappedOnEnd);
        });
        return;
      }
    } catch (e) {
      console.warn("Murf stream notice, using fallback:", e);
    }

    this.speakFallback(cleanText, langKey, onStart, wrappedOnEnd);
  }

  speakFallback(text, langKey, onStart, onEnd) {
    if (!this.synth) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const allVoices = (this.voices && this.voices.length > 0) ? this.voices : this.synth.getVoices();
    const langInfo = LANGUAGE_CONFIG[langKey] || LANGUAGE_CONFIG.hi;
    const hasIndicScript = /[\u0900-\u097F\u0C80-\u0CFF\u0C00-\u0C7F]/.test(text);

    let chosenVoice = null;
    
    if (langKey === 'hi' && hasIndicScript) {
      chosenVoice = allVoices.find(v => v.lang.startsWith('hi') || v.name.includes('Hindi') || v.name.includes('Kalpana') || v.name.includes('Hemant'));
    } else if (langKey === 'kn' && hasIndicScript) {
      chosenVoice = allVoices.find(v => v.lang.startsWith('kn') || v.name.includes('Kannada'));
    } else if (langKey === 'te' && hasIndicScript) {
      chosenVoice = allVoices.find(v => v.lang.startsWith('te') || v.name.includes('Telugu'));
    }

    if (!chosenVoice) {
      chosenVoice = allVoices.find(v => 
        v.lang === 'en-IN' || 
        v.name.includes('India') || 
        v.name.includes('Heera') || 
        v.name.includes('Ravi') ||
        v.name.includes('Neerja') ||
        v.name.includes('Veena')
      );
    }

    if (!chosenVoice) {
      chosenVoice = allVoices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('en'));
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = langInfo.code;
    }

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { 
      setTimeout(() => { this.isSpeaking = false; }, 600);
      if (onEnd) onEnd(); 
    };
    utterance.onerror = () => { 
      this.isSpeaking = false;
      if (onEnd) onEnd(); 
    };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    this.isSpeaking = false;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  async joinAgoraChannel(appId, channelName, token, uid = 1234) {
    try {
      this.agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      await this.agoraClient.join(appId, channelName, token, uid);
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await this.agoraClient.publish([this.localAudioTrack]);
      return { status: 'connected', client: this.agoraClient };
    } catch (err) {
      return { status: 'fallback', error: err.message };
    }
  }

  async leaveAgoraChannel() {
    if (this.localAudioTrack) {
      try { this.localAudioTrack.close(); } catch (e) {}
      this.localAudioTrack = null;
    }
    if (this.agoraClient) {
      try { await this.agoraClient.leave(); } catch (e) {}
      this.agoraClient = null;
    }
  }
}

export const voiceManager = new VoiceManager();
