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
    code: 'en-US',
    label: 'English',
    voiceId: 'Rachna',
    voiceName: 'Agora Conversational AI / Murf Falcon 2.1 (Rachna)'
  }
};

class VoiceManager {
  constructor() {
    this.agoraClient = null;
    this.localAudioTrack = null;
    this.speechRecognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentAudio = null;
    this.hasRemoteStream = false;
    this.isAgoraConnected = false;
    this.isMuted = false;
    this.onRemoteAudioChange = null;
  }

  // Initialize Speech Recognition (only active when not using Agora direct RTC stream)
  initSpeechRecognition(langCode, onTranscript, onStateChange) {
    if (typeof window === 'undefined') return null;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRec) {
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
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = langCode || 'en-US';

    recognition.onstart = () => {
      this.isListening = true;
      if (onStateChange) onStateChange('LISTENING');
    };

    recognition.onresult = (event) => {
      if (this.isSpeaking || this.hasRemoteStream) return;

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
    if (!this.speechRecognition || this.isSpeaking) return;
    this.stopSpeaking();
    try {
      this.speechRecognition.start();
    } catch (e) {}
  }

  stopListening() {
    if (this.speechRecognition) {
      try { this.speechRecognition.stop(); } catch (e) {}
      this.isListening = false;
    }
  }

  // Primary speech output:
  // 1. Agora RTC Agent Stream (Primary)
  // 2. Murf AI Falcon 2.1 Stream (Secondary fallback via /api/tts/murf-stream)
  // ZERO Windows SpeechSynthesis! Windows synthesis is completely eliminated.
  async speak(text, langKey = 'en', onStart, onEnd) {
    if (!text || !text.trim()) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    // 1. If Agora RTC remote agent audio is active, Agora's voice plays over RTC!
    if (this.hasRemoteStream) {
      this.isSpeaking = true;
      if (onStart) onStart();
      setTimeout(() => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      }, 1200);
      return;
    }

    // 2. Fallback: Murf AI Falcon 2.1 Streaming Audio
    await this.playMurfAudio(text, langKey, onStart, onEnd);
  }

  async playMurfAudio(text, langKey = 'en', onStart, onEnd) {
    try {
      this.stopSpeaking();
      const res = await fetch('/api/tts/murf-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: langKey || 'en'
        })
      });

      if (!res.ok) {
        if (onEnd) onEnd();
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        // Murf API returned status or key not configured
        if (onEnd) onEnd();
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        if (onEnd) onEnd();
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      this.isSpeaking = true;
      if (onStart) onStart();

      audio.onended = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = () => {
        this.isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      await audio.play();
    } catch (err) {
      console.warn('Murf audio play error:', err);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
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
  }

  // --- Agora RTC Full Integration ---
  async joinAgoraChannel(appId, channelName, token, uid = 1234, onRemoteAudioChange = null) {
    try {
      if (this.agoraClient) {
        await this.leaveAgoraChannel();
      }

      this.onRemoteAudioChange = onRemoteAudioChange;
      this.agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Subscribe to remote audio stream from Agora Conversational AI Agent (MiniMax Radiant Girl)
      this.agoraClient.on('user-published', async (user, mediaType) => {
        try {
          await this.agoraClient.subscribe(user, mediaType);
          if (mediaType === 'audio') {
            this.hasRemoteStream = true;
            if (this.onRemoteAudioChange) this.onRemoteAudioChange(true);
            user.audioTrack.play();
          }
        } catch (subErr) {
          console.warn('Agora remote audio subscribe error:', subErr);
        }
      });

      this.agoraClient.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'audio') {
          this.hasRemoteStream = false;
          if (this.onRemoteAudioChange) this.onRemoteAudioChange(false);
        }
      });

      await this.agoraClient.join(appId, channelName, token, uid);
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'high_quality_stereo',
        AEC: true,
        ANS: true,
        AGC: true
      });

      await this.agoraClient.publish([this.localAudioTrack]);
      this.isAgoraConnected = true;
      this.isMuted = false;
      return { status: 'connected', client: this.agoraClient };
    } catch (err) {
      console.warn('Agora RTC join error:', err.message);
      this.isAgoraConnected = false;
      return { status: 'fallback', error: err.message };
    }
  }

  toggleMicrophone() {
    if (!this.localAudioTrack) return false;
    this.isMuted = !this.isMuted;
    this.localAudioTrack.setEnabled(!this.isMuted);
    return !this.isMuted;
  }

  async leaveAgoraChannel() {
    if (this.localAudioTrack) {
      try { 
        this.localAudioTrack.stop();
        this.localAudioTrack.close(); 
      } catch (e) {}
      this.localAudioTrack = null;
    }
    if (this.agoraClient) {
      try { await this.agoraClient.leave(); } catch (e) {}
      this.agoraClient = null;
    }
    this.isAgoraConnected = false;
    this.hasRemoteStream = false;
    this.isMuted = false;
    if (this.onRemoteAudioChange) this.onRemoteAudioChange(false);
  }
}

export const voiceManager = new VoiceManager();
