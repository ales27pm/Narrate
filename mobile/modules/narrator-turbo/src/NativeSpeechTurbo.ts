import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

export interface Voice {
  identifier: string;
  name: string;
  language: string;
  quality: 'default' | 'enhanced' | 'premium';
  requiresNetwork?: boolean;
}

export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceIdentifier?: string;
}

export interface WordBoundaryEvent {
  utteranceId: string;
  word: string;
  charIndex: number;
  charLength: number;
  wordIndex?: number;
}

export interface SpeechEvent {
  utteranceId: string;
  cancelled?: boolean;
  interrupted?: boolean;
  error?: string;
  errorCode?: number;
}

export interface SpeechStatus {
  isSpeaking: boolean;
  isPaused: boolean;
}

export interface AudioCategoryOptions {
  category?: 'playback' | 'ambient' | 'soloAmbient';
  mode?: 'spokenAudio' | 'default' | 'moviePlayback';
  options?: ('duckOthers' | 'mixWithOthers' | 'allowBluetooth' | 'allowBluetoothA2DP' | 'allowAirPlay')[];
}

type EventCallback<T> = (event: T) => void;

class NarratorTurboModuleWrapper {
  private module: any;
  private eventEmitter: NativeEventEmitter;
  private listeners: Map<string, any> = new Map();

  constructor() {
    this.module = NativeModules.NarratorTurboModule;

    if (!this.module) {
      throw new Error(
        'NarratorTurboModule is not available. Make sure you have compiled the native module.'
      );
    }

    this.eventEmitter = new NativeEventEmitter(this.module);
  }

  /**
   * Speak text with advanced options
   */
  async speak(text: string, options: SpeechOptions = {}): Promise<{ success: boolean; utteranceId: string }> {
    const {
      language = 'en-US',
      pitch = 1.0,
      rate = 1.0,
      volume = 1.0,
      voiceIdentifier = null,
    } = options;

    return this.module.speak(text, language, pitch, rate, volume, voiceIdentifier);
  }

  /**
   * Stop current speech immediately
   */
  async stop(): Promise<{ success: boolean }> {
    return this.module.stop();
  }

  /**
   * Pause current speech (iOS only)
   */
  async pause(): Promise<{ success: boolean; paused?: boolean }> {
    return this.module.pause();
  }

  /**
   * Resume paused speech (iOS only)
   */
  async resume(): Promise<{ success: boolean; resumed?: boolean }> {
    return this.module.resume();
  }

  /**
   * Check if currently speaking
   */
  async isSpeaking(): Promise<SpeechStatus> {
    return this.module.isSpeaking();
  }

  /**
   * Get available voices for a language
   */
  async getAvailableVoices(language?: string): Promise<{ voices: Voice[] }> {
    return this.module.getAvailableVoices(language || null);
  }

  /**
   * Set audio category and mode (iOS only)
   */
  async setAudioCategory(config: AudioCategoryOptions): Promise<{ success: boolean }> {
    const {
      category = 'playback',
      mode = 'spokenAudio',
      options = ['duckOthers', 'allowBluetooth', 'allowBluetoothA2DP'],
    } = config;

    return this.module.setAudioCategory(category, mode, options);
  }

  /**
   * Listen for word boundary events (real-time word highlighting)
   */
  onWordBoundary(callback: EventCallback<WordBoundaryEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onWordBoundary', callback);
    const key = 'onWordBoundary_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Listen for speech start event
   */
  onSpeechStart(callback: EventCallback<SpeechEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onSpeechStart', callback);
    const key = 'onSpeechStart_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Listen for speech end event
   */
  onSpeechEnd(callback: EventCallback<SpeechEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onSpeechEnd', callback);
    const key = 'onSpeechEnd_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Listen for speech error event
   */
  onSpeechError(callback: EventCallback<SpeechEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onSpeechError', callback);
    const key = 'onSpeechError_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Listen for speech pause event (iOS only)
   */
  onSpeechPause(callback: EventCallback<SpeechEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onSpeechPause', callback);
    const key = 'onSpeechPause_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Listen for speech resume event (iOS only)
   */
  onSpeechResume(callback: EventCallback<SpeechEvent>): () => void {
    const subscription = this.eventEmitter.addListener('onSpeechResume', callback);
    const key = 'onSpeechResume_' + Date.now();
    this.listeners.set(key, subscription);

    return () => {
      subscription.remove();
      this.listeners.delete(key);
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach((listener) => {
      listener.remove();
    });
    this.listeners.clear();
  }
}

// Export singleton instance
export const NativeSpeechTurbo = new NarratorTurboModuleWrapper();

// Export types
export type {
  EventCallback,
};
