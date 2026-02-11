import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story, VoiceSettings, NarrationState, RecordingState } from './types';

export interface SharedContentData {
  text: string;
  title?: string;
  url?: string;
  timestamp: number;
}

export interface ContentExtractionSettings {
  ocrLanguage: string;
  clipboardMonitoring: boolean;
  autoFetchURL: boolean;
}

interface NarratorStore {
  stories: Story[];
  currentStory: Story | null;
  voiceSettings: VoiceSettings;
  narrationState: NarrationState;
  recordingState: RecordingState;
  sharedContent: SharedContentData | null;
  extractionSettings: ContentExtractionSettings;

  // Story management
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setCurrentStory: (story: Story | null) => void;

  // Voice settings
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;

  // Narration state
  setNarrationState: (state: Partial<NarrationState>) => void;
  resetNarration: () => void;

  // Recording state
  setRecordingState: (state: Partial<RecordingState>) => void;
  resetRecording: () => void;

  // Shared content
  setSharedContent: (content: SharedContentData | null) => void;
  clearSharedContent: () => void;

  // Extraction settings
  setExtractionSettings: (settings: Partial<ContentExtractionSettings>) => void;

  // Persistence
  loadStories: () => Promise<void>;
  saveStories: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useNarratorStore = create<NarratorStore>((set, get) => ({
  stories: [],
  currentStory: null,
  voiceSettings: {
    language: 'en-US',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    appLanguage: 'en',
    prosody: {
      enabled: true,
      intensity: 0.7,
      pauseMultiplier: 1.0,
      emphasisDetection: true,
      breathingSounds: false,
      naturalPacing: true,
    },
    ttsProvider: 'expo-speech',
    personality: 'professionnel',
  },
  narrationState: {
    isPlaying: false,
    isPaused: false,
    currentWordIndex: 0,
    duration: 0,
    position: 0,
  },
  recordingState: {
    isRecording: false,
    isPaused: false,
    duration: 0,
  },
  sharedContent: null,
  extractionSettings: {
    ocrLanguage: 'en',
    clipboardMonitoring: false,
    autoFetchURL: true,
  },

  addStory: (story) => {
    const newStory: Story = {
      ...story,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ stories: [newStory, ...state.stories] }));
    get().saveStories();
  },

  updateStory: (id, updates) => {
    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ),
    }));
    get().saveStories();
  },

  deleteStory: (id) => {
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== id),
      currentStory: state.currentStory?.id === id ? null : state.currentStory,
    }));
    get().saveStories();
  },

  toggleFavorite: (id) => {
    set((state) => ({
      stories: state.stories.map((s) =>
        s.id === id ? { ...s, isFavorite: !s.isFavorite, updatedAt: Date.now() } : s
      ),
    }));
    get().saveStories();
  },

  setCurrentStory: (story) => set({ currentStory: story }),

  setVoiceSettings: (settings) => {
    set((state) => ({ voiceSettings: { ...state.voiceSettings, ...settings } }));
    get().saveSettings();
  },

  setNarrationState: (state) =>
    set((prev) => ({ narrationState: { ...prev.narrationState, ...state } })),

  resetNarration: () =>
    set({
      narrationState: {
        isPlaying: false,
        isPaused: false,
        currentWordIndex: 0,
        duration: 0,
        position: 0,
      },
    }),

  setRecordingState: (state) =>
    set((prev) => ({ recordingState: { ...prev.recordingState, ...state } })),

  resetRecording: () =>
    set({
      recordingState: {
        isRecording: false,
        isPaused: false,
        duration: 0,
      },
    }),

  setSharedContent: (content) => set({ sharedContent: content }),

  clearSharedContent: () => set({ sharedContent: null }),

  setExtractionSettings: (settings) => {
    set((state) => ({
      extractionSettings: { ...state.extractionSettings, ...settings },
    }));
    get().saveSettings();
  },

  loadStories: async () => {
    try {
      const stored = await AsyncStorage.getItem('narrator-stories');
      if (stored) {
        const stories = JSON.parse(stored);
        set({ stories });
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  },

  saveStories: async () => {
    try {
      const { stories } = get();
      await AsyncStorage.setItem('narrator-stories', JSON.stringify(stories));
    } catch (error) {
      console.error('Failed to save stories:', error);
    }
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem('narrator-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          voiceSettings: settings.voiceSettings || get().voiceSettings,
          extractionSettings: settings.extractionSettings || get().extractionSettings,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const { voiceSettings, extractionSettings } = get();
      await AsyncStorage.setItem(
        'narrator-settings',
        JSON.stringify({ voiceSettings, extractionSettings })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },
}));
