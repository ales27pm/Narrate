import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Play, Pause, Square, Settings, Bookmark, Mic, Upload } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { useNarratorStore } from '@/lib/narrator-store';
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
  const words = text.split(/\s+/).filter(Boolean);
  const highlightIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const voiceSettings = useNarratorStore((s) => s.voiceSettings);
  const addStory = useNarratorStore((s) => s.addStory);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  const titleOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);

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

  // Helper to break text into natural speech segments
  const createSpeechSegments = (fullText: string) => {
    // Split by sentence-ending punctuation but keep the punctuation
    const sentencePattern = /([^.!?]+[.!?]+)/g;
    const sentences = fullText.match(sentencePattern) || [fullText];

    const segments: Array<{ text: string; wordCount: number; pauseAfter: number }> = [];

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
    titleOpacity.value = withTiming(0.3, { duration: 300 });

    await activateKeepAwakeAsync();
    const currentBrightness = await Brightness.getBrightnessAsync();
    setOriginalBrightness(currentBrightness);
    await Brightness.setBrightnessAsync(0.8);

    const segments = createSpeechSegments(text);
    const wordsPerMinute = voiceSettings.rate * 150;
    const millisecondsPerWord = (60 / wordsPerMinute) * 1000;

    let currentWordIndex = 0;
    let segmentIndex = 0;

    // Start highlighting words
    highlightIntervalRef.current = setInterval(() => {
      if (currentWordIndex < words.length) {
        setHighlightedIndex(currentWordIndex);
        currentWordIndex++;
      } else {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
        }
      }
    }, millisecondsPerWord);

    // Speak segments sequentially with natural pauses
    const speakNextSegment = () => {
      if (segmentIndex >= segments.length) {
        stopNarration();
        return;
      }

      const segment = segments[segmentIndex];

      Speech.speak(segment.text, {
        language: voiceSettings.language,
        pitch: voiceSettings.pitch,
        rate: voiceSettings.rate,
        volume: voiceSettings.volume,
        voice: voiceSettings.voice,
        // Enhanced voice quality options
        onDone: () => {
          segmentIndex++;
          // Add natural pause before next segment
          if (segment.pauseAfter > 0 && segmentIndex < segments.length) {
            setTimeout(speakNextSegment, segment.pauseAfter);
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
    addStory({
      title: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
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
        type: [
          'text/plain', // .txt
          'application/pdf', // .pdf
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/rtf', // .rtf
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const fileUri = file.uri;
      const mimeType = file.mimeType;

      // Extract text based on file type
      let extractedText = '';

      if (mimeType === 'text/plain' || file.name.endsWith('.txt')) {
        // Read plain text files directly
        extractedText = await FileSystem.readAsStringAsync(fileUri);
      } else if (mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, show info message
        Alert.alert(
          'PDF Import',
          'PDF text extraction requires additional setup. For now, please copy and paste text from your PDF, or convert it to a TXT file first.\n\nFull PDF support coming soon!',
          [{ text: 'OK' }]
        );
        return;
      } else if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.doc') ||
        file.name.endsWith('.docx')
      ) {
        // For Word docs, show info message
        Alert.alert(
          'Word Document Import',
          'Word document import requires additional setup. For now, please copy and paste text from your document, or save it as a TXT file first.\n\nFull DOC/DOCX support coming soon!',
          [{ text: 'OK' }]
        );
        return;
      } else if (mimeType === 'application/rtf' || file.name.endsWith('.rtf')) {
        // Try reading RTF as plain text (basic support)
        const content = await FileSystem.readAsStringAsync(fileUri);
        // Basic RTF stripping (removes most RTF formatting)
        extractedText = content
          .replace(/\\[a-z]+\d*\s?/gi, '') // Remove RTF commands
          .replace(/[{}]/g, '') // Remove braces
          .replace(/\\\\/g, '\\') // Handle escaped backslashes
          .trim();
      } else {
        // Try reading as plain text for other formats
        try {
          extractedText = await FileSystem.readAsStringAsync(fileUri);
        } catch (error) {
          Alert.alert(
            'Unsupported Format',
            'This file format is not supported. Please use TXT files for best results.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      if (extractedText.trim()) {
        setText(extractedText.trim());
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
              Bring your words to life
            </Text>
          </Animated.View>

          <Animated.View style={contentStyle}>
            <GlassCard className="p-6 mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                  className={cn(
                    'text-lg',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  Your Text
                </Text>
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
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Enter your text here or import a document..."
                    placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
                    multiline
                    style={{
                      fontFamily: 'Manrope_400Regular',
                      minHeight: 200,
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                    className="mb-4"
                  />

                  <AnimatedButton
                    title="Import Document"
                    variant="ghost"
                    icon={<Upload size={18} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                    onPress={importDocument}
                    size="sm"
                  />
                </>
              ) : (
                <View className="min-h-[200px] mb-4">
                  <Text
                    style={{
                      fontFamily: 'Manrope_400Regular',
                      fontSize: 16,
                      lineHeight: 24,
                    }}
                  >
                    {words.map((word, index) => (
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
                    ))}
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

            {isSpeaking && (
              <GlassCard className="p-6 mb-6">
                <WaveformVisualizer isActive={isSpeaking} className="h-32" />
              </GlassCard>
            )}

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
