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

export interface VoiceSettings {
  language: string; // Voice language (e.g., en-US, fr-FR, fr-CA)
  pitch: number;
  rate: number;
  volume: number;
  voice?: string; // Voice identifier for native voice selection
  appLanguage: 'en' | 'fr-FR' | 'fr-CA'; // App UI language
  detectedLanguage?: string; // Last detected content language
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
