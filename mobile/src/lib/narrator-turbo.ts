/**
 * Advanced Narrator Engine using TurboModule
 *
 * This provides a sophisticated on-device TTS experience with:
 * - Real-time word boundary callbacks for synchronized highlighting
 * - Premium/Neural voice quality (iOS)
 * - Advanced audio session management
 * - Background playback support
 * - Full audio ducking and mixing
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Type definitions for native module
interface NativeWordBoundaryEvent {
  word: string;
  charIndex: number;
  charLength: number;
  wordIndex?: number;
}

interface NativeSpeechEvent {
  utteranceId: string;
}

interface NativeSpeechTurboModule {
  speak: (text: string, options: NarrationOptions) => Promise<string>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  getAvailableVoices: () => Promise<Voice[]>;
  setAudioCategory?: (category: string) => Promise<void>;
  onWordBoundary: (callback: (event: NativeWordBoundaryEvent) => void) => () => void;
  onSpeechStart: (callback: (event: NativeSpeechEvent) => void) => () => void;
  onSpeechEnd: (callback: (event: NativeSpeechEvent) => void) => () => void;
  onSpeechError: (callback: (event: { error: string }) => void) => () => void;
  onSpeechPause: (callback: (event: NativeSpeechEvent) => void) => () => void;
  onSpeechResume: (callback: (event: NativeSpeechEvent) => void) => () => void;
}

// Import the TurboModule (will work after native compilation)
let NativeSpeechTurbo: NativeSpeechTurboModule | null = null;

try {
  // Try to import the native module
  const module = require('../../modules/narrator-turbo/src/index');
  NativeSpeechTurbo = module.NativeSpeechTurbo;
} catch (error) {
  console.warn('NarratorTurboModule not available. Compile native code first.');
}

export interface NarrationOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceIdentifier?: string;
  enableWordTracking?: boolean;
}

export interface WordHighlight {
  word: string;
  charIndex: number;
  charLength: number;
  wordIndex?: number;
}

export interface NarrationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentWord: string;
  currentCharIndex: number;
  utteranceId: string | null;
}

export interface Voice {
  identifier: string;
  name: string;
  language: string;
  quality: 'default' | 'enhanced' | 'premium';
  requiresNetwork?: boolean;
}

/**
 * Advanced narrator hook using TurboModule
 */
export function useNarratorTurbo() {
  const [state, setState] = useState<NarrationState>({
    isPlaying: false,
    isPaused: false,
    currentWord: '',
    currentCharIndex: 0,
    utteranceId: null,
  });

  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const wordCallbackRef = useRef<((word: WordHighlight) => void) | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Check if TurboModule is available
  const isAvailable = NativeSpeechTurbo !== null;

  // Setup event listeners
  useEffect(() => {
    if (!isAvailable) return;

    const cleanups: (() => void)[] = [];

    if (!NativeSpeechTurbo) return;

    // Word boundary listener
    const unsubWordBoundary = NativeSpeechTurbo.onWordBoundary((event) => {
      setState((prev) => ({
        ...prev,
        currentWord: event.word,
        currentCharIndex: event.charIndex,
      }));

      // Call external callback if set
      if (wordCallbackRef.current) {
        wordCallbackRef.current({
          word: event.word,
          charIndex: event.charIndex,
          charLength: event.charLength,
          wordIndex: event.wordIndex,
        });
      }
    });
    cleanups.push(unsubWordBoundary);

    // Speech start listener
    const unsubStart = NativeSpeechTurbo.onSpeechStart((event: any) => {
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        utteranceId: event.utteranceId,
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    cleanups.push(unsubStart);

    // Speech end listener
    const unsubEnd = NativeSpeechTurbo.onSpeechEnd((event: any) => {
      setState({
        isPlaying: false,
        isPaused: false,
        currentWord: '',
        currentCharIndex: 0,
        utteranceId: null,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    cleanups.push(unsubEnd);

    // Speech error listener
    const unsubError = NativeSpeechTurbo.onSpeechError((event: any) => {
      console.error('Speech error:', event.error);
      setState({
        isPlaying: false,
        isPaused: false,
        currentWord: '',
        currentCharIndex: 0,
        utteranceId: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    });
    cleanups.push(unsubError);

    // Pause listener (iOS only)
    if (Platform.OS === 'ios') {
      const unsubPause = NativeSpeechTurbo.onSpeechPause((event: any) => {
        setState((prev) => ({ ...prev, isPaused: true, isPlaying: false }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      });
      cleanups.push(unsubPause);

      const unsubResume = NativeSpeechTurbo.onSpeechResume((event: any) => {
        setState((prev) => ({ ...prev, isPaused: false, isPlaying: true }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });
      cleanups.push(unsubResume);
    }

    cleanupFunctionsRef.current = cleanups;

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [isAvailable]);

  // Load available voices
  const loadVoices = useCallback(async () => {
    if (!isAvailable || !NativeSpeechTurbo) return [];

    try {
      const result = await NativeSpeechTurbo.getAvailableVoices();
      setAvailableVoices(result);
      return result;
    } catch (error) {
      console.error('Failed to load voices:', error);
      return [];
    }
  }, [isAvailable]);

  // Speak text
  const speak = useCallback(
    async (text: string, options: NarrationOptions = {}) => {
      if (!isAvailable || !NativeSpeechTurbo) {
        throw new Error('NarratorTurboModule not available. Compile native code first.');
      }

      try {
        const result = await NativeSpeechTurbo.speak(text, {
          language: options.language || 'en-US',
          pitch: options.pitch || 1.0,
          rate: options.rate || 1.0,
          volume: options.volume || 1.0,
          voiceIdentifier: options.voiceIdentifier,
        });

        return result;
      } catch (error) {
        console.error('Failed to speak:', error);
        throw error;
      }
    },
    [isAvailable]
  );

  // Stop speech
  const stop = useCallback(async () => {
    if (!isAvailable || !NativeSpeechTurbo) return;

    try {
      await NativeSpeechTurbo.stop();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, [isAvailable]);

  // Pause speech (iOS only)
  const pause = useCallback(async () => {
    if (!isAvailable || !NativeSpeechTurbo || Platform.OS !== 'ios') return false;

    try {
      await NativeSpeechTurbo.pause();
      return true;
    } catch (error) {
      console.error('Failed to pause:', error);
      return false;
    }
  }, [isAvailable]);

  // Resume speech (iOS only)
  const resume = useCallback(async () => {
    if (!isAvailable || !NativeSpeechTurbo || Platform.OS !== 'ios') return false;

    try {
      await NativeSpeechTurbo.resume();
      return true;
    } catch (error) {
      console.error('Failed to resume:', error);
      return false;
    }
  }, [isAvailable]);

  // Configure audio session (iOS only)
  const configureAudioSession = useCallback(async () => {
    if (!isAvailable || !NativeSpeechTurbo || Platform.OS !== 'ios' || !NativeSpeechTurbo.setAudioCategory) return;

    try {
      await NativeSpeechTurbo.setAudioCategory('playback');
    } catch (error) {
      console.error('Failed to configure audio session:', error);
    }
  }, [isAvailable]);

  // Set word callback
  const onWordBoundary = useCallback((callback: (word: WordHighlight) => void) => {
    wordCallbackRef.current = callback;
  }, []);

  return {
    // State
    state,
    availableVoices,
    isAvailable,

    // Methods
    speak,
    stop,
    pause,
    resume,
    loadVoices,
    configureAudioSession,
    onWordBoundary,
  };
}

/**
 * Get the best quality voice for a language
 */
export async function getBestVoiceForLanguage(language: string): Promise<Voice | null> {
  if (!NativeSpeechTurbo) return null;

  try {
    const voices = await NativeSpeechTurbo.getAvailableVoices();

    // Filter by language
    const matchingVoices = voices.filter((v) => v.language.startsWith(language));
    if (matchingVoices.length === 0) return null;

    // Prioritize premium > enhanced > default
    const premiumVoice = matchingVoices.find((v) => v.quality === 'premium');
    if (premiumVoice) return premiumVoice;

    const enhancedVoice = matchingVoices.find((v) => v.quality === 'enhanced');
    if (enhancedVoice) return enhancedVoice;

    return matchingVoices[0] || null;
  } catch (error) {
    console.error('Failed to get best voice:', error);
    return null;
  }
}

/**
 * Check if TurboModule is available (after native compilation)
 */
export function isTurboModuleAvailable(): boolean {
  return NativeSpeechTurbo !== null;
}
