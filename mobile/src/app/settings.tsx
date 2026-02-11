import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, useColorScheme, Pressable, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Volume2, Gauge, Languages, Play, Mic2, Clipboard, Globe as GlobeIcon } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useNarratorStore } from '@/lib/narrator-store';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { useTranslations } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/i18n';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const voiceLanguages = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish', value: 'es-ES' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'German', value: 'de-DE' },
  { label: 'Italian', value: 'it-IT' },
  { label: 'Japanese', value: 'ja-JP' },
  { label: 'Korean', value: 'ko-KR' },
];

const appLanguages: { label: string; value: AppLanguage }[] = [
  { label: 'English', value: 'en' },
  { label: 'Français (France)', value: 'fr-FR' },
  { label: 'Français (Canada)', value: 'fr-CA' },
];

const ocrLanguages = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'German', value: 'de' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
];

interface Voice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const voiceSettings = useNarratorStore((s) => s.voiceSettings);
  const setVoiceSettings = useNarratorStore((s) => s.setVoiceSettings);
  const extractionSettings = useNarratorStore((s) => s.extractionSettings);
  const setExtractionSettings = useNarratorStore((s) => s.setExtractionSettings);
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [enhancedVoices, setEnhancedVoices] = useState<Voice[]>([]);

  // Get translations based on app language
  const t = useTranslations(voiceSettings.appLanguage);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      setAvailableVoices(voices);

      // Filter for enhanced quality voices for better narration
      const enhanced = voices.filter(v => v.quality === 'Enhanced');
      setEnhancedVoices(enhanced);

      // Auto-select first enhanced voice if none selected
      if (!voiceSettings.voice && enhanced.length > 0) {
        setVoiceSettings({ voice: enhanced[0].identifier });
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const testVoice = () => {
    Speech.speak(t.testVoiceSample, {
      language: voiceSettings.language,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      volume: voiceSettings.volume,
      voice: voiceSettings.voice,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePitchChange = (value: number) => {
    setVoiceSettings({ pitch: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRateChange = (value: number) => {
    setVoiceSettings({ rate: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVolumeChange = (value: number) => {
    setVoiceSettings({ volume: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectVoice = (identifier: string) => {
    setVoiceSettings({ voice: identifier });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          <View className="mb-8 mt-4">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              className={cn(
                'text-4xl mb-2',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              {t.settings}
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-base',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              {t.customizeNarration}
            </Text>
          </View>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <Languages
                size={24}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
              />
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-lg ml-3',
                  colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                )}
              >
                {t.appLanguage}
              </Text>
            </View>

            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm mb-3',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              {t.appLanguageDescription}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
              style={{ flexGrow: 0 }}
            >
              {appLanguages.map((lang) => (
                <AnimatedButton
                  key={lang.value}
                  title={lang.label}
                  variant={voiceSettings.appLanguage === lang.value ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setVoiceSettings({ appLanguage: lang.value })}
                />
              ))}
            </ScrollView>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <Languages
                size={24}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
              />
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-lg ml-3',
                  colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                )}
              >
                {t.language}
              </Text>
            </View>

            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm mb-3',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              Voice language for narration
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
              style={{ flexGrow: 0 }}
            >
              {voiceLanguages.map((lang) => (
                <AnimatedButton
                  key={lang.value}
                  title={lang.label}
                  variant={voiceSettings.language === lang.value ? 'primary' : 'secondary'}
                  size="sm"
                  onPress={() => setVoiceSettings({ language: lang.value })}
                />
              ))}
            </ScrollView>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Volume2
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <Text
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                  className={cn(
                    'text-lg ml-3',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {t.pitch}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-base',
                  colorScheme === 'dark' ? 'text-white/80' : 'text-slate-700'
                )}
              >
                {voiceSettings.pitch.toFixed(1)}x
              </Text>
            </View>

            <Slider
              value={voiceSettings.pitch}
              onValueChange={handlePitchChange}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              minimumTrackTintColor="#8b5cf6"
              maximumTrackTintColor={colorScheme === 'dark' ? '#333' : '#ddd'}
              thumbTintColor="#8b5cf6"
            />

            <View className="flex-row justify-between mt-2">
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.lower}
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.higher}
              </Text>
            </View>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Gauge
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <Text
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                  className={cn(
                    'text-lg ml-3',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {t.speed}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-base',
                  colorScheme === 'dark' ? 'text-white/80' : 'text-slate-700'
                )}
              >
                {voiceSettings.rate.toFixed(1)}x
              </Text>
            </View>

            <Slider
              value={voiceSettings.rate}
              onValueChange={handleRateChange}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              minimumTrackTintColor="#8b5cf6"
              maximumTrackTintColor={colorScheme === 'dark' ? '#333' : '#ddd'}
              thumbTintColor="#8b5cf6"
            />

            <View className="flex-row justify-between mt-2">
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.slower}
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.faster}
              </Text>
            </View>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Volume2
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <Text
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                  className={cn(
                    'text-lg ml-3',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {t.volume}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-base',
                  colorScheme === 'dark' ? 'text-white/80' : 'text-slate-700'
                )}
              >
                {Math.round(voiceSettings.volume * 100)}%
              </Text>
            </View>

            <Slider
              value={voiceSettings.volume}
              onValueChange={handleVolumeChange}
              minimumValue={0.0}
              maximumValue={1.0}
              step={0.1}
              minimumTrackTintColor="#8b5cf6"
              maximumTrackTintColor={colorScheme === 'dark' ? '#333' : '#ddd'}
              thumbTintColor="#8b5cf6"
            />

            <View className="flex-row justify-between mt-2">
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.quiet}
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                {t.loud}
              </Text>
            </View>
          </GlassCard>

          {enhancedVoices.length > 0 && (
            <GlassCard className="p-6 mb-6">
              <View className="flex-row items-center mb-4">
                <Mic2
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <Text
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                  className={cn(
                    'text-lg ml-3',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {t.voiceSelection}
                </Text>
              </View>

              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-sm mb-3',
                  colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                )}
              >
                {t.enhancedQualityVoices}
              </Text>

              <ScrollView
                style={{ maxHeight: 200 }}
                showsVerticalScrollIndicator={false}
              >
                {enhancedVoices.map((voice) => (
                  <Pressable
                    key={voice.identifier}
                    onPress={() => selectVoice(voice.identifier)}
                    className={cn(
                      'p-3 rounded-xl mb-2',
                      voiceSettings.voice === voice.identifier
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : colorScheme === 'dark'
                        ? 'bg-white/5'
                        : 'bg-black/5'
                    )}
                  >
                    <Text
                      style={{ fontFamily: 'Manrope_600SemiBold' }}
                      className={cn(
                        'text-base mb-1',
                        voiceSettings.voice === voice.identifier
                          ? 'text-purple-400'
                          : colorScheme === 'dark'
                          ? 'text-white'
                          : 'text-slate-900'
                      )}
                    >
                      {voice.name}
                    </Text>
                    <Text
                      style={{ fontFamily: 'Manrope_400Regular' }}
                      className={cn(
                        'text-xs',
                        colorScheme === 'dark' ? 'text-white/50' : 'text-slate-500'
                      )}
                    >
                      {voice.language} • Enhanced Quality
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </GlassCard>
          )}

          <AnimatedButton
            title={t.testVoice}
            icon={<Play size={20} color="#fff" fill="#fff" />}
            onPress={testVoice}
          />

          <View className="my-8">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              className={cn(
                'text-3xl mb-2',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              {t.contentExtraction}
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              {t.configureExtraction}
            </Text>
          </View>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <Clipboard
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <View className="ml-3 flex-1">
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-base',
                      colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {t.clipboardMonitoring}
                  </Text>
                  <Text
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    className={cn(
                      'text-xs mt-0.5',
                      colorScheme === 'dark' ? 'text-white/50' : 'text-slate-500'
                    )}
                  >
                    {t.clipboardDescription}
                  </Text>
                </View>
              </View>
              <Switch
                value={extractionSettings.clipboardMonitoring}
                onValueChange={(value) => {
                  setExtractionSettings({ clipboardMonitoring: value });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{
                  false: colorScheme === 'dark' ? '#333' : '#ddd',
                  true: '#8b5cf6',
                }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <GlobeIcon
                  size={24}
                  color={colorScheme === 'dark' ? '#fff' : '#000'}
                />
                <View className="ml-3 flex-1">
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-base',
                      colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {t.autoFetchURLs}
                  </Text>
                  <Text
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    className={cn(
                      'text-xs mt-0.5',
                      colorScheme === 'dark' ? 'text-white/50' : 'text-slate-500'
                    )}
                  >
                    {t.autoFetchDescription}
                  </Text>
                </View>
              </View>
              <Switch
                value={extractionSettings.autoFetchURL}
                onValueChange={(value) => {
                  setExtractionSettings({ autoFetchURL: value });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{
                  false: colorScheme === 'dark' ? '#333' : '#ddd',
                  true: '#8b5cf6',
                }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          <GlassCard className="p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <Languages
                size={24}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
              />
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-base ml-3',
                  colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                )}
              >
                {t.ocrLanguage}
              </Text>
            </View>

            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm mb-3',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              {t.ocrLanguageDescription}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
              style={{ flexGrow: 0 }}
            >
              {ocrLanguages.map((lang) => (
                <AnimatedButton
                  key={lang.value}
                  title={lang.label}
                  variant={
                    extractionSettings.ocrLanguage === lang.value
                      ? 'primary'
                      : 'secondary'
                  }
                  size="sm"
                  onPress={() => setExtractionSettings({ ocrLanguage: lang.value })}
                />
              ))}
            </ScrollView>
          </GlassCard>

          <View className="mt-8 p-6">
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-xs text-center',
                colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
              )}
            >
              Narrator App v1.0.0
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-xs text-center mt-1',
                colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
              )}
            >
              Built with Expo and React Native
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
