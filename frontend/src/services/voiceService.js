import AgoraRTC from 'agora-rtc-sdk-ng';

// Language codes mapping for Speech Recognition & Synthesis
export const LANGUAGE_CONFIG = {
  hi: {
    code: 'hi-IN',
    label: 'हिन्दी (Hindi)',
    flag: '🇮🇳',
    voiceId: 'hi-IN-Kabir',
    voiceName: 'Murf Falcon 2.1 Kabir (hi-IN)',
    subtext: 'Code-mixed Hinglish supported'
  },
  kn: {
    code: 'kn-IN',
    label: 'ಕನ್ನಡ (Kannada)',
    flag: '🇮🇳',
    voiceId: 'kn-IN-Gagan',
    voiceName: 'Murf Falcon 2.1 Gagan (kn-IN)',
    subtext: 'Kannada + English supported'
  },
  te: {
    code: 'te-IN',
    label: 'తెలుగు (Telugu)',
    flag: '🇮🇳',
    voiceId: 'te-IN-Mohan',
    voiceName: 'Murf Falcon 2.1 Mohan (te-IN)',
    subtext: 'Telugu + English supported'
  },
  en: {
    code: 'en-IN',
    label: 'English (Bharat)',
    flag: '🌐',
    voiceId: 'en-IN-Aarav',
    voiceName: 'Murf Falcon 2.1 Aarav (en-IN)',
    subtext: 'Indian English'
  }
};

class VoiceManager {
  constructor() {
    this.agoraClient = null;
    this.localAudioTrack = null;
    this.speechRecognition = null;
    this.isListening = false;
    this.synth = window.speechSynthesis;
    this.currentAudio = null;
  }

  // Initialize Speech Recognition (Web Speech API)
  initSpeechRecognition(langCode, onTranscript, onStateChange) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser");
      return null;
    }

    if (this.speechRecognition) {
      try { this.speechRecognition.abort(); } catch (e) { }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langCode;

    recognition.onstart = () => {
      this.isListening = true;
      if (onStateChange) onStateChange('LISTENING');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (onTranscript) {
        onTranscript(final || interim, Boolean(final));
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      this.isListening = false;
      if (onStateChange) onStateChange('IDLE');
    };

    recognition.onend = () => {
      this.isListening = false;
      if (onStateChange) onStateChange('IDLE');
    };

    this.speechRecognition = recognition;
    return recognition;
  }

  startListening() {
    if (this.speechRecognition && !this.isListening) {
      try {
        this.speechRecognition.start();
      } catch (e) {
        console.warn("Could not start recognition:", e);
      }
    }
  }

  stopListening() {
    if (this.speechRecognition && this.isListening) {
      try {
        this.speechRecognition.stop();
      } catch (e) { }
      this.isListening = false;
    }
  }

  // Real Murf AI Falcon 2.1 Streaming Speech (with neural browser fallback)
  async speak(text, langKey = 'hi', onStart, onEnd) {
    this.stopSpeaking();

    const langInfo = LANGUAGE_CONFIG[langKey] || LANGUAGE_CONFIG.hi;

    // Try Murf Falcon 2.1 streaming endpoint first
    try {
      const response = await fetch('/api/tts/murf-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
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
          if (onEnd) onEnd();
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
        };
        audio.onerror = () => {
          this.speakFallback(text, langInfo.code, onStart, onEnd);
        };
        audio.play();
        return;
      }
    } catch (e) {
      console.warn("Murf Falcon stream unavailable, using neural browser engine:", e);
    }

    // Fallback to high-quality browser speech synthesis
    this.speakFallback(text, langInfo.code, onStart, onEnd);
  }

  speakFallback(text, langCode, onStart, onEnd) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.substring(0, 2)));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = () => { if (onEnd) onEnd(); };

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) { }
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Join Live Agora RTC Channel using App ID & Token
  async joinAgoraChannel(appId, channelName, token, uid = 1234) {
    try {
      this.agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Join channel
      await this.agoraClient.join(appId, channelName, token, uid);

      // Create and publish local mic audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await this.agoraClient.publish([this.localAudioTrack]);

      return { status: 'connected', client: this.agoraClient };
    } catch (err) {
      console.warn("Agora RTC connection status:", err);
      return { status: 'fallback', error: err.message };
    }
  }

  async leaveAgoraChannel() {
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.close();
      } catch (e) { }
      this.localAudioTrack = null;
    }
    if (this.agoraClient) {
      try {
        await this.agoraClient.leave();
      } catch (e) { }
      this.agoraClient = null;
    }
  }
}

export const voiceManager = new VoiceManager();
