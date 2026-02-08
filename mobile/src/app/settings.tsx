import React, { useState } from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Volume2, Gauge, Languages, Play } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { useNarratorStore } from '@/lib/narrator-store';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_600SemiBold } from '@expo-google-fonts/manrope';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const languages = [
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Spanish', value: 'es-ES' },
  { label: 'French', value: 'fr-FR' },
  { label: 'German', value: 'de-DE' },
  { label: 'Italian', value: 'it-IT' },
  { label: 'Japanese', value: 'ja-JP' },
  { label: 'Korean', value: 'ko-KR' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const voiceSettings = useNarratorStore((s) => s.voiceSettings);
  const setVoiceSettings = useNarratorStore((s) => s.setVoiceSettings);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  const testVoice = () => {
    Speech.speak('This is a test of the narrator voice settings.', {
      language: voiceSettings.language,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
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
              Settings
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-base',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              Customize your narration experience
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
                Language
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
              style={{ flexGrow: 0 }}
            >
              {languages.map((lang) => (
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
                  Pitch
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
                Lower
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Higher
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
                  Speed
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
                Slower
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Faster
              </Text>
            </View>
          </GlassCard>

          <AnimatedButton
            title="Test Voice"
            icon={<Play size={20} color="#fff" fill="#fff" />}
            onPress={testVoice}
          />

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
