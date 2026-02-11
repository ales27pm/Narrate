/**
 * TTS Provider Abstraction Layer
 * Supports multiple text-to-speech services for premium Canadian French voices
 */

import * as Speech from 'expo-speech';
import type { TextSegment } from './prosody-engine';

export type TTSProvider = 'expo-speech' | 'google-cloud' | 'elevenlabs' | 'azure';

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
 * Google Cloud TTS Provider (Premium - Requires API Key)
 */
export class GoogleCloudTTSProvider implements TTSProviderInterface {
  private audioElement: HTMLAudioElement | null = null;

  async speak(text: string, config: TTSConfig, onProgress?: (progress: number) => void): Promise<void> {
    if (!config.apiKey) {
      throw new Error('Google Cloud TTS requires an API key');
    }

    try {
      // Note: This is a simplified implementation
      // In production, you'd call the backend API which proxies to Google Cloud
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/tts/google-cloud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: config.voiceId || 'fr-CA-Neural2-A',
          language: config.language,
          pitch: config.pitch,
          rate: config.rate,
          volume: config.volume,
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Cloud TTS failed: ${response.statusText}`);
      }

      // For web: play audio
      // For React Native: this would need expo-av
      console.log('Google Cloud TTS response received');
      // Implementation would stream or play audio here
    } catch (error) {
      console.error('Google Cloud TTS error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  async pause(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  async resume(): Promise<void> {
    if (this.audioElement) {
      this.audioElement.play();
    }
  }

  async getAvailableVoices(language?: string): Promise<VoiceInfo[]> {
    // Canadian French voices from Google Cloud
    const voices: VoiceInfo[] = [
      {
        id: 'fr-CA-Neural2-A',
        name: 'Neural2 A (Féminin)',
        language: 'fr-CA',
        gender: 'female',
        quality: 'neural',
        provider: 'google-cloud',
        personality: 'Voix professionnelle et claire, idéale pour la narration',
        sampleText: 'Bonjour! Je suis une voix canadienne française de haute qualité.',
      },
      {
        id: 'fr-CA-Neural2-B',
        name: 'Neural2 B (Masculin)',
        language: 'fr-CA',
        gender: 'male',
        quality: 'neural',
        provider: 'google-cloud',
        personality: 'Voix masculine chaleureuse, parfaite pour les livres audio',
        sampleText: 'Salut! Ma voix est naturelle et expressive.',
      },
      {
        id: 'fr-CA-Neural2-C',
        name: 'Neural2 C (Féminin)',
        language: 'fr-CA',
        gender: 'female',
        quality: 'neural',
        provider: 'google-cloud',
        personality: 'Voix douce et rassurante, excellente pour les histoires',
        sampleText: 'Je parle avec douceur et clarté.',
      },
      {
        id: 'fr-CA-Neural2-D',
        name: 'Neural2 D (Masculin)',
        language: 'fr-CA',
        gender: 'male',
        quality: 'neural',
        provider: 'google-cloud',
        personality: 'Voix énergique et dynamique, style radio',
        sampleText: 'Ma voix est dynamique et captivante!',
      },
    ];

    if (language) {
      return voices.filter(v => v.language.startsWith(language));
    }
    return voices;
  }

  supportsSSML(): boolean {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    // Check if backend endpoint is available
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      if (!baseUrl) return false;

      const response = await fetch(`${baseUrl}/api/health`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * ElevenLabs TTS Provider (Ultra-Premium - Requires API Key)
 */
export class ElevenLabsTTSProvider implements TTSProviderInterface {
  async speak(text: string, config: TTSConfig, onProgress?: (progress: number) => void): Promise<void> {
    if (!config.apiKey) {
      throw new Error('ElevenLabs requires an API key');
    }

    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${baseUrl}/api/tts/elevenlabs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: config.voiceId || 'fr-CA-premium',
          language: config.language,
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS failed: ${response.statusText}`);
      }

      console.log('ElevenLabs TTS response received');
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Implementation
  }

  async pause(): Promise<void> {
    // Implementation
  }

  async resume(): Promise<void> {
    // Implementation
  }

  async getAvailableVoices(language?: string): Promise<VoiceInfo[]> {
    // Note: Would fetch from ElevenLabs API in production
    const voices: VoiceInfo[] = [
      {
        id: 'fr-ca-premium-1',
        name: 'Marie (Ultra-réaliste)',
        language: 'fr-CA',
        gender: 'female',
        quality: 'premium',
        provider: 'elevenlabs',
        personality: 'Voix ultra-réaliste et expressive, comme une vraie personne',
        sampleText: 'Ma voix sonne comme si je parlais vraiment avec vous.',
      },
      {
        id: 'fr-ca-premium-2',
        name: 'Jean (Ultra-réaliste)',
        language: 'fr-CA',
        gender: 'male',
        quality: 'premium',
        provider: 'elevenlabs',
        personality: 'Voix masculine naturelle avec des émotions authentiques',
        sampleText: 'Je parle de façon naturelle, comme dans une conversation.',
      },
    ];

    if (language) {
      return voices.filter(v => v.language.startsWith(language));
    }
    return voices;
  }

  supportsSSML(): boolean {
    return true;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      if (!baseUrl) return false;

      const response = await fetch(`${baseUrl}/api/health`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
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
      ['google-cloud', new GoogleCloudTTSProvider()],
      ['elevenlabs', new ElevenLabsTTSProvider()],
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
