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
  language: string;
  pitch: number;
  rate: number;
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
