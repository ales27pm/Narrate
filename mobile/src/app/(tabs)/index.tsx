import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { Play, Pause, Square, Settings, Bookmark, Mic } from 'lucide-react-native';
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

    // Calculate word timing for smooth highlighting
    const wordsPerMinute = voiceSettings.rate * 150; // Average speaking rate
    const millisecondsPerWord = (60 / wordsPerMinute) * 1000;

    // Start speaking the entire text
    Speech.speak(text, {
      language: voiceSettings.language,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      onDone: () => {
        stopNarration();
      },
      onError: () => {
        stopNarration();
      },
    });

    // Highlight words as speech progresses
    let currentIndex = 0;
    highlightIntervalRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        setHighlightedIndex(currentIndex);
        currentIndex++;
      } else {
        if (highlightIntervalRef.current) {
          clearInterval(highlightIntervalRef.current);
        }
      }
    }, millisecondsPerWord);
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
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Enter your text here..."
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
