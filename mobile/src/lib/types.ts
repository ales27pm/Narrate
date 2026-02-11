export type StoryCategory = 'personal' | 'fiction' | 'poetry' | 'article' | 'other';

export interface Story {
  id: string;
  title: string;
  content: string;
  category: StoryCategory;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  audioUri?: string;
  duration?: number;
}

export type VoicePersonality = 'professionnel' | 'conversationnel' | 'dramatique' | 'decontracte';
export type TTSProvider = 'expo-speech' | 'google-cloud' | 'elevenlabs' | 'azure';

export interface ProsodySettings {
  enabled: boolean; // Master toggle for prosody features
  intensity: number; // 0.0 to 1.0 (subtle to dramatic)
  pauseMultiplier: number; // 0.5x to 2x
  emphasisDetection: boolean;
  breathingSounds: boolean;
  naturalPacing: boolean;
}

export interface VoiceSettings {
  language: string; // Voice language (e.g., en-US, fr-FR, fr-CA)
  pitch: number;
  rate: number;
  volume: number;
  voice?: string; // Voice identifier for native voice selection
  appLanguage: 'en' | 'fr-FR' | 'fr-CA'; // App UI language
  detectedLanguage?: string; // Last detected content language

  // Advanced prosody settings
  prosody: ProsodySettings;
  personality?: VoicePersonality;
  ttsProvider: TTSProvider;
  premiumVoiceId?: string; // For premium TTS providers
  apiKey?: string; // For future premium TTS providers (not used in on-device version)
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri?: string;
}

export interface NarrationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWordIndex: number;
  duration: number;
  position: number;
}
