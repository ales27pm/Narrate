import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Mic, Square, Play, Pause, Share2, Save } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { AnimatedButton } from '@/components/AnimatedButton';
import { WaveformVisualizer } from '@/components/WaveformVisualizer';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useNarratorStore } from '@/lib/narrator-store';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function RecorderScreen() {
  const colorScheme = useColorScheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const currentStory = useNarratorStore((s) => s.currentStory);
  const updateStory = useNarratorStore((s) => s.updateStory);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    Audio.requestPermissionsAsync();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withTiming(1.1, { duration: 500 }, () => {
        pulseScale.value = withTiming(1, { duration: 500 });
      });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.isDoneRecording) {
          clearInterval(interval);
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      setRecording(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
          }
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const pausePlayback = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const shareRecording = async () => {
    if (!recordingUri) return;

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(recordingUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to share recording:', error);
    }
  };

  const saveRecording = () => {
    if (!recordingUri || !currentStory) return;

    updateStory(currentStory.id, {
      audioUri: recordingUri,
      duration,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
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
        <View className="flex-1 p-6 justify-center">
          <View className="mb-12">
            <Text
              style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
              className={cn(
                'text-4xl mb-2 text-center',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              Audio Recorder
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-base text-center',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              Record your custom narration
            </Text>
          </View>

          <GlassCard className="p-8 mb-8">
            <View className="items-center">
              <Animated.View style={pulseStyle} className="mb-6">
                <View
                  className={cn(
                    'w-32 h-32 rounded-full items-center justify-center',
                    isRecording ? 'bg-red-500/20' : 'bg-purple-500/20'
                  )}
                >
                  <Mic
                    size={64}
                    color={isRecording ? '#ef4444' : '#8b5cf6'}
                    strokeWidth={1.5}
                  />
                </View>
              </Animated.View>

              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-5xl mb-2',
                  colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                )}
              >
                {formatTime(isRecording ? duration : playbackPosition)}
              </Text>

              {recordingUri && !isRecording ? (
                <Text
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  className={cn(
                    'text-sm',
                    colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                  )}
                >
                  Duration: {formatTime(duration)}
                </Text>
              ) : null}
            </View>

            {isRecording || isPlaying ? (
              <View className="mt-8">
                <WaveformVisualizer isActive={isRecording || isPlaying} />
              </View>
            ) : null}
          </GlassCard>

          <View className="gap-4">
            {!isRecording && !recordingUri ? (
              <AnimatedButton
                title="Start Recording"
                icon={<Mic size={24} color="#fff" />}
                onPress={startRecording}
                size="lg"
              />
            ) : null}

            {isRecording ? (
              <AnimatedButton
                title="Stop Recording"
                icon={<Square size={24} color="#fff" />}
                onPress={stopRecording}
                size="lg"
              />
            ) : null}

            {recordingUri && !isRecording ? (
              <>
                <AnimatedButton
                  title={isPlaying ? 'Pause' : 'Play Recording'}
                  icon={
                    isPlaying ? (
                      <Pause size={24} color="#fff" />
                    ) : (
                      <Play size={24} color="#fff" fill="#fff" />
                    )
                  }
                  onPress={isPlaying ? pausePlayback : playRecording}
                  size="lg"
                />

                <View className="flex-row gap-3">
                  <AnimatedButton
                    title="Share"
                    variant="secondary"
                    icon={<Share2 size={20} color="#fff" />}
                    onPress={shareRecording}
                    className="flex-1"
                  />
                  <AnimatedButton
                    title="Record New"
                    variant="secondary"
                    icon={<Mic size={20} color="#fff" />}
                    onPress={() => {
                      setRecordingUri(null);
                      setDuration(0);
                      setPlaybackPosition(0);
                    }}
                    className="flex-1"
                  />
                </View>

                {currentStory ? (
                  <AnimatedButton
                    title="Save to Story"
                    variant="secondary"
                    icon={<Save size={20} color="#fff" />}
                    onPress={saveRecording}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
