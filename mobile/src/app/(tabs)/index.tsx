import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Play, Pause, Square, Settings, Bookmark, Mic, Upload, Globe, Camera, Image as ImageIcon } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { ContentPreview } from '@/components/ContentPreview';
import { useNarratorStore } from '@/lib/narrator-store';
import { isURL, fetchContentFromURL, validateURL } from '@/lib/content-fetcher';
import { useClipboardMonitor } from '@/lib/useClipboardMonitor';
import {
  isLikelyScreenshot,
  type ExtractionResult,
} from '@/lib/ocr-extractor';
import { ProsodyEngine, preprocessCanadianFrench } from '@/lib/prosody-engine';
import { applyVoiceProfile, getVoiceProfile } from '@/lib/voice-profiles';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NarratorScreen() {
  const colorScheme = useColorScheme();
  const [text, setText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [originalBrightness, setOriginalBrightness] = useState<number | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isFetchingURL, setIsFetchingURL] = useState(false);
  const [fetchedURLTitle, setFetchedURLTitle] = useState<string | undefined>(undefined);
  const [isLoadingSharedContent, setIsLoadingSharedContent] = useState(false);
  const [extractionPreview, setExtractionPreview] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const words = text.split(/\s+/).filter(Boolean);
  const highlightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const voiceSettings = useNarratorStore((s) => s.voiceSettings);
  const addStory = useNarratorStore((s) => s.addStory);
  const sharedContent = useNarratorStore((s) => s.sharedContent);
  const clearSharedContent = useNarratorStore((s) => s.clearSharedContent);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  const titleOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

  // Clipboard monitoring
  useClipboardMonitor((url) => {
    setText(url);
    fetchURLContent(url);
  });

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
        deactivateKeepAwake();
        if (originalBrightness !== null) {
          Brightness.setBrightnessAsync(originalBrightness);
        }
      }
    };
  }, [isSpeaking, originalBrightness]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  // Load shared content when it becomes available
  useEffect(() => {
    if (sharedContent && sharedContent.text) {
      setIsLoadingSharedContent(true);
      setText(sharedContent.text);
      setFetchedURLTitle(sharedContent.title);

      // Clear the shared content from store after loading
      clearSharedContent();

      // Show success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        setIsLoadingSharedContent(false);
      }, 500);
    }
  }, [sharedContent, clearSharedContent]);

  // Helper to break text into natural speech segments
  const createSpeechSegments = (fullText: string) => {
    // Split by sentence-ending punctuation but keep the punctuation
    const sentencePattern = /([^.!?]+[.!?]+)/g;
    const sentences = fullText.match(sentencePattern) || [fullText];

    const segments: { text: string; wordCount: number; pauseAfter: number }[] = [];

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (!trimmed) return;

      const sentenceWords = trimmed.split(/\s+/);

      // Determine pause duration based on punctuation
      let pauseMs = 0;
      if (trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?')) {
        pauseMs = 400; // Natural pause at sentence end
      } else if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes(':')) {
        pauseMs = 250; // Shorter pause for commas
      }

      segments.push({
        text: trimmed,
        wordCount: sentenceWords.length,
        pauseAfter: pauseMs,
      });
    });

    return segments;
  };

  const startNarration = async () => {
    if (!text.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSpeaking(true);
    setCurrentSentenceIndex(0);
    setHighlightedIndex(0);
    titleOpacity.value = withTiming(0.3, { duration: 300 });

    await activateKeepAwakeAsync();
    const currentBrightness = await Brightness.getBrightnessAsync();
    setOriginalBrightness(currentBrightness);
    await Brightness.setBrightnessAsync(0.8);

    // Preprocess text for Canadian French if needed (only if prosody is enabled)
    const processedText =
      voiceSettings.prosody.enabled && voiceSettings.language === 'fr-CA'
        ? preprocessCanadianFrench(text)
        : text;

    // Initialize prosody engine with current settings (only if enabled)
    let textSegments: any[] = [];
    let prosodyEngine: ProsodyEngine | null = null;

    if (voiceSettings.prosody.enabled) {
      prosodyEngine = new ProsodyEngine(voiceSettings.prosody);
      textSegments = prosodyEngine.analyzeText(processedText);
    } else {
      // Simple sentence splitting without prosody
      const sentencePattern = /([^.!?]+[.!?]+)/g;
      const sentences = processedText.match(sentencePattern) || [processedText];
      textSegments = sentences.map((text, index) => ({
        text: text.trim(),
        startIndex: 0,
        endIndex: text.length,
        sentenceType: 'statement',
        emotionalTone: 'neutral',
        contentType: 'narrative',
        prosodyHints: [],
      }));
    }

    // Apply voice profile settings
    const currentProfile = voiceSettings.personality
      ? getVoiceProfile(voiceSettings.personality)
      : null;

    let baseSettings = {
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      volume: voiceSettings.volume,
    };

    if (currentProfile && voiceSettings.prosody.enabled) {
      baseSettings = applyVoiceProfile(baseSettings, currentProfile);
    }

    const wordsPerMinute = baseSettings.rate * 150;
    const millisecondsPerWord = (60 / wordsPerMinute) * 1000;

    let segmentIndex = 0;

    // Speak segments sequentially with prosody-aware pauses (if enabled)
    const speakNextSegment = () => {
      if (segmentIndex >= textSegments.length) {
        stopNarration();
        return;
      }

      const segment = textSegments[segmentIndex];
      const sentenceWords = segment.text.split(/\s+/).filter(Boolean);
      let wordIndex = 0;

      setCurrentSentenceIndex(segmentIndex);
      setHighlightedIndex(0);

      // Highlight words in current sentence
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
      }

      highlightIntervalRef.current = setInterval(() => {
        if (wordIndex < sentenceWords.length) {
          setHighlightedIndex(wordIndex);
          wordIndex++;
        }
      }, millisecondsPerWord);

      // Apply prosody adjustments to speech settings for this segment (only if enabled)
      const segmentSettings =
        voiceSettings.prosody.enabled && prosodyEngine
          ? prosodyEngine.applyProsodyToSpeech(baseSettings, segment)
          : baseSettings;

      Speech.speak(segment.text, {
        language: voiceSettings.language,
        pitch: segmentSettings.pitch,
        rate: segmentSettings.rate,
        volume: segmentSettings.volume,
        voice: voiceSettings.voice,
        onDone: () => {
          if (highlightIntervalRef.current) {
            clearInterval(highlightIntervalRef.current);
          }

          // Get pauses from prosody hints (if enabled)
          let pauseDuration = 300; // Default pause
          if (voiceSettings.prosody.enabled && prosodyEngine) {
            const pauses = prosodyEngine.getPausesForSegment(segment);
            const endPauses = pauses.filter(p => p.position >= segment.text.length - 5);
            if (endPauses.length > 0) {
              pauseDuration = Math.max(...endPauses.map(p => p.duration));
            }
          }

          segmentIndex++;

          // Add natural pause before next segment
          if (segmentIndex < textSegments.length) {
            setTimeout(speakNextSegment, pauseDuration);
          } else {
            speakNextSegment();
          }
        },
        onError: () => {
          stopNarration();
        },
      });
    };

    speakNextSegment();
  };

  const pauseNarration = () => {
    Speech.pause();
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopNarration = async () => {
    Speech.stop();
    if (highlightIntervalRef.current) {
      clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
    setIsSpeaking(false);
    setHighlightedIndex(-1);
    titleOpacity.value = withSpring(1);
    deactivateKeepAwake();

    if (originalBrightness !== null) {
      await Brightness.setBrightnessAsync(originalBrightness);
      setOriginalBrightness(null);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const saveStory = () => {
    if (!text.trim()) return;

    const wordCount = words.length;
    const title = fetchedURLTitle || text.slice(0, 50) + (text.length > 50 ? '...' : '');

    // Save to local MMKV store (100% on-device)
    addStory({
      title,
      content: text,
      category: 'personal',
      isFavorite: false,
      wordCount,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/library');
  };

  const importDocument = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain'], // Only support .txt files in on-device version
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;

      // Read plain text files directly
      const extractedText = await FileSystem.readAsStringAsync(fileUri);

      if (extractedText.trim()) {
        setText(extractedText.trim());
        setFetchedURLTitle(undefined);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Empty File', 'No text could be extracted from this file.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Document import error:', error);
      Alert.alert('Import Failed', 'Could not import the document. Please try again.', [
        { text: 'OK' },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // OCR feature not available in on-device version
  const importFromCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Feature Not Available',
      'OCR (text extraction from images) is not available in the on-device version. This feature requires a backend server for image processing.\n\nYou can still paste text or import .txt files.',
      [{ text: 'OK' }]
    );
  };

  // OCR feature not available in on-device version
  const importFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Feature Not Available',
      'OCR (text extraction from images) is not available in the on-device version. This feature requires a backend server for image processing.\n\nYou can still paste text or import .txt files.',
      [{ text: 'OK' }]
    );
  };

  const handlePreviewNarrate = () => {
    if (extractionPreview) {
      setText(extractionPreview.text);
      setFetchedURLTitle(extractionPreview.title);
      setExtractionPreview(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePreviewEdit = () => {
    if (extractionPreview) {
      setText(extractionPreview.text);
      setFetchedURLTitle(extractionPreview.title);
      setExtractionPreview(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePreviewCancel = () => {
    setExtractionPreview(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTextChange = async (newText: string) => {
    setText(newText);
    setFetchedURLTitle(undefined);

    // Check if the text looks like a URL
    if (isURL(newText.trim()) && newText.trim().length > 10) {
      // Validate URL format
      const validation = validateURL(newText.trim());
      if (!validation.valid) {
        return;
      }

      // Debounce URL fetching to avoid fetching on every character
      // Only fetch when user has likely finished typing
      const trimmed = newText.trim();
      setTimeout(async () => {
        // Check if text is still the same (user hasn't continued typing)
        if (text.trim() === trimmed && isURL(trimmed)) {
          await fetchURLContent(trimmed);
        }
      }, 1000);
    }
  };

  const fetchURLContent = async (url: string) => {
    try {
      setIsFetchingURL(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Use client-side extraction only (no backend required)
      const content = await fetchContentFromURL(url);

      // Only update if the URL field hasn't changed
      if (text.trim() === url.trim()) {
        setText(content.text);
        setFetchedURLTitle(content.title);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('URL fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not fetch content from this URL';
      Alert.alert('Fetch Failed', errorMessage, [{ text: 'OK' }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsFetchingURL(false);
    }
  };

  const handleFetchURL = async () => {
    const trimmed = text.trim();
    if (!isURL(trimmed)) {
      Alert.alert('Invalid URL', 'Please enter a valid website URL (e.g., https://example.com)', [
        { text: 'OK' },
      ]);
      return;
    }

    const validation = validateURL(trimmed);
    if (!validation.valid) {
      Alert.alert('Invalid URL', validation.error || 'Please enter a valid URL', [
        { text: 'OK' },
      ]);
      return;
    }

    await fetchURLContent(trimmed);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#0f0f1e', '#1a1a2e', '#16213e']
            : ['#e0e7ff', '#ddd6fe', '#fae8ff']
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-6 pb-32"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={titleStyle} className="mb-8 mt-4">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              className={cn(
                'text-5xl mb-2',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              Narrator
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-lg',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              {isLoadingSharedContent ? 'Loading shared content...' : 'Bring your words to life'}
            </Text>
          </Animated.View>

          <Animated.View style={contentStyle}>
            {isExtracting ? (
              <GlassCard className="p-8 mb-6">
                <View className="items-center justify-center">
                  <ActivityIndicator
                    size="large"
                    color={colorScheme === 'dark' ? '#8b5cf6' : '#7c3aed'}
                  />
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-base mt-4',
                      colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    Extracting text...
                  </Text>
                  <Text
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    className={cn(
                      'text-sm mt-2 text-center',
                      colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                    )}
                  >
                    This may take a few seconds
                  </Text>
                </View>
              </GlassCard>
            ) : null}

            {extractionPreview ? (
              <ContentPreview
                extractionResult={extractionPreview}
                onNarrate={handlePreviewNarrate}
                onEdit={handlePreviewEdit}
                onCancel={handlePreviewCancel}
              />
            ) : null}

            <GlassCard className="p-6 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-lg',
                      colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    Your Text
                  </Text>
                  {fetchedURLTitle ? (
                    <Text
                      style={{ fontFamily: 'Manrope_400Regular' }}
                      className={cn(
                        'text-xs mt-1',
                        colorScheme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      )}
                      numberOfLines={1}
                    >
                      From: {fetchedURLTitle}
                    </Text>
                  ) : null}
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => router.push('/settings')}
                    className="p-2"
                  >
                    <Settings
                      size={20}
                      color={colorScheme === 'dark' ? '#fff' : '#000'}
                    />
                  </Pressable>
                  <Pressable onPress={saveStory} className="p-2">
                    <Bookmark
                      size={20}
                      color={colorScheme === 'dark' ? '#fff' : '#000'}
                    />
                  </Pressable>
                </View>
              </View>

              {!isSpeaking ? (
                <>
                  <View className="relative">
                    <TextInput
                      value={text}
                      onChangeText={handleTextChange}
                      placeholder="Enter text or paste a website URL..."
                      placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
                      multiline
                      editable={!isFetchingURL}
                      style={{
                        fontFamily: 'Manrope_400Regular',
                        minHeight: 200,
                        color: colorScheme === 'dark' ? '#fff' : '#000',
                        fontSize: 16,
                        lineHeight: 24,
                        opacity: isFetchingURL ? 0.5 : 1,
                      }}
                      className="mb-4"
                    />
                    {isFetchingURL ? (
                      <View className="absolute inset-0 items-center justify-center">
                        <ActivityIndicator
                          size="large"
                          color={colorScheme === 'dark' ? '#8b5cf6' : '#7c3aed'}
                        />
                        <Text
                          style={{ fontFamily: 'Manrope_400Regular' }}
                          className={cn(
                            'text-sm mt-2',
                            colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                          )}
                        >
                          Fetching content...
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row gap-2 mb-2">
                    <AnimatedButton
                      title="Scan Image"
                      variant="ghost"
                      icon={<Camera size={18} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                      onPress={importFromCamera}
                      size="sm"
                      className="flex-1"
                    />
                    <AnimatedButton
                      title="Choose Image"
                      variant="ghost"
                      icon={<ImageIcon size={18} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                      onPress={importFromGallery}
                      size="sm"
                      className="flex-1"
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <AnimatedButton
                      title="Import Document"
                      variant="ghost"
                      icon={<Upload size={18} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                      onPress={importDocument}
                      size="sm"
                      className="flex-1"
                    />
                    {isURL(text.trim()) && text.trim().length > 10 ? (
                      <AnimatedButton
                        title="Fetch URL"
                        variant="ghost"
                        icon={<Globe size={18} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                        onPress={handleFetchURL}
                        size="sm"
                        className="flex-1"
                        disabled={isFetchingURL}
                      />
                    ) : null}
                  </View>
                </>
              ) : (
                <View className="min-h-[200px] mb-4 justify-center">
                  <Text
                    style={{
                      fontFamily: 'Manrope_400Regular',
                      fontSize: 18,
                      lineHeight: 28,
                      textAlign: 'center',
                    }}
                  >
                    {(() => {
                      const segments = createSpeechSegments(text);
                      if (currentSentenceIndex < segments.length) {
                        const currentSentence = segments[currentSentenceIndex].text;
                        const sentenceWords = currentSentence.split(/\s+/).filter(Boolean);

                        return sentenceWords.map((word, index) => (
                          <Text
                            key={index}
                            style={{
                              color:
                                index === highlightedIndex
                                  ? '#8b5cf6'
                                  : colorScheme === 'dark'
                                  ? '#fff'
                                  : '#000',
                              backgroundColor:
                                index === highlightedIndex
                                  ? 'rgba(139, 92, 246, 0.2)'
                                  : 'transparent',
                              fontFamily: 'Manrope_400Regular',
                            }}
                          >
                            {word}{' '}
                          </Text>
                        ));
                      }
                      return null;
                    })()}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center justify-between">
                <Text
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  className={cn(
                    'text-sm',
                    colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                  )}
                >
                  {words.length} words
                </Text>
                <Text
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  className={cn(
                    'text-sm',
                    colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                  )}
                >
                  {Math.ceil(words.length / voiceSettings.rate / 2)} min read
                </Text>
              </View>
            </GlassCard>

            {isSpeaking ? (
              <GlassCard className="p-6 mb-6">
                <WaveformVisualizer isActive={isSpeaking} className="h-32" />
              </GlassCard>
            ) : null}

            <View className="gap-4">
              {!isSpeaking ? (
                <AnimatedButton
                  title="Start Narration"
                  icon={<Play size={20} color="#fff" fill="#fff" />}
                  onPress={startNarration}
                />
              ) : (
                <View className="flex-row gap-3">
                  <AnimatedButton
                    title="Pause"
                    variant="secondary"
                    icon={<Pause size={20} color="#fff" />}
                    onPress={pauseNarration}
                    className="flex-1"
                  />
                  <AnimatedButton
                    title="Stop"
                    variant="secondary"
                    icon={<Square size={20} color="#fff" />}
                    onPress={stopNarration}
                    className="flex-1"
                  />
                </View>
              )}

              <AnimatedButton
                title="Record Audio"
                variant="secondary"
                icon={<Mic size={20} color="#fff" />}
                onPress={() => router.push('/recorder')}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
