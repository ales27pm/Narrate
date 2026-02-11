/**
 * TTS Provider Abstraction Layer
 * On-device version: Uses only expo-speech for text-to-speech
 */

import * as Speech from 'expo-speech';
import type { TextSegment } from './prosody-engine';

export type TTSProvider = 'expo-speech';

export interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  voiceId?: string;
  language: string;
  pitch: number;
  rate: number;
  volume: number;
}

export interface TTSProviderInterface {
  speak(text: string, config: TTSConfig, onProgress?: (progress: number) => void): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getAvailableVoices(language?: string): Promise<VoiceInfo[]>;
  supportsSSML(): boolean;
  isAvailable(): Promise<boolean>;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  quality: 'standard' | 'enhanced' | 'premium' | 'neural';
  provider: TTSProvider;
  personality?: string; // Description of voice personality
  sampleText?: string;
}

/**
 * Expo Speech TTS Provider (Default - Always Available)
 */
export class ExpoSpeechProvider implements TTSProviderInterface {
  private isSpeaking = false;

  async speak(text: string, config: TTSConfig, onProgress?: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isSpeaking = true;

      Speech.speak(text, {
        language: config.language,
        pitch: config.pitch,
        rate: config.rate,
        volume: config.volume,
        voice: config.voiceId,
        onDone: () => {
          this.isSpeaking = false;
          resolve();
        },
        onError: (error) => {
          this.isSpeaking = false;
          reject(error);
        },
        onStopped: () => {
          this.isSpeaking = false;
          resolve();
        },
      });
    });
  }

  async stop(): Promise<void> {
    Speech.stop();
    this.isSpeaking = false;
  }

  async pause(): Promise<void> {
    Speech.pause();
  }

  async resume(): Promise<void> {
    Speech.resume();
  }

  async getAvailableVoices(language?: string): Promise<VoiceInfo[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices
        .filter(v => !language || v.language.startsWith(language))
        .map(v => ({
          id: v.identifier,
          name: v.name,
          language: v.language,
          quality: v.quality === 'Enhanced' ? 'enhanced' : 'standard',
          provider: 'expo-speech' as TTSProvider,
        }));
    } catch (error) {
      console.error('Failed to get voices:', error);
      return [];
    }
  }

  supportsSSML(): boolean {
    return false;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }
}

/**
 * TTS Manager - Factory for TTS providers
 */
export class TTSManager {
  private providers: Map<TTSProvider, TTSProviderInterface>;
  private currentProvider: TTSProviderInterface;

  constructor() {
    this.providers = new Map([
      ['expo-speech', new ExpoSpeechProvider()],
    ]);

    this.currentProvider = this.providers.get('expo-speech')!;
  }

  async setProvider(provider: TTSProvider): Promise<boolean> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      console.warn(`Provider ${provider} not found`);
      return false;
    }

    const isAvailable = await providerInstance.isAvailable();
    if (!isAvailable) {
      console.warn(`Provider ${provider} is not available`);
      return false;
    }

    this.currentProvider = providerInstance;
    return true;
  }

  getProvider(): TTSProviderInterface {
    return this.currentProvider;
  }

  async getAllAvailableVoices(language?: string): Promise<VoiceInfo[]> {
    const allVoices: VoiceInfo[] = [];

    for (const [providerName, provider] of this.providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          const voices = await provider.getAvailableVoices(language);
          allVoices.push(...voices);
        }
      } catch (error) {
        console.error(`Failed to get voices from ${providerName}:`, error);
      }
    }

    return allVoices;
  }
}

// Singleton instance
export const ttsManager = new TTSManager();
