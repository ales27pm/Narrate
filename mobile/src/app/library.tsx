import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BookOpen, Heart, Search, Trash2, Play, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { useNarratorStore } from '@/lib/narrator-store';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Manrope_400Regular, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import type { Story, StoryCategory } from '@/lib/types';
import { useScans, useDeleteScan, type Scan } from '@/lib/api/scans';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

const categories: { label: string; value: StoryCategory }[] = [
  { label: 'All', value: 'personal' },
  { label: 'Fiction', value: 'fiction' },
  { label: 'Poetry', value: 'poetry' },
  { label: 'Article', value: 'article' },
  { label: 'Other', value: 'other' },
];

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StoryCategory | 'all'>('all');

  // Local storage (fallback)
  const localStories = useNarratorStore((s) => s.stories);
  const loadStories = useNarratorStore((s) => s.loadStories);
  const deleteStory = useNarratorStore((s) => s.deleteStory);
  const toggleFavorite = useNarratorStore((s) => s.toggleFavorite);
  const setCurrentStory = useNarratorStore((s) => s.setCurrentStory);

  // Backend database (primary)
  const { data: scans, isLoading, error, refetch } = useScans();
  const deleteScan = useDeleteScan();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });

  useEffect(() => {
    loadStories(); // Load local stories as fallback
  }, [loadStories]);

  // Convert scans to story format for unified display with extended metadata
  type ExtendedStory = Story & {
    confidence?: number;
    source?: string;
  };

  const scansAsStories: ExtendedStory[] = (scans || []).map((scan) => ({
    id: scan.id.toString(),
    title: scan.metadata?.title || scan.content.slice(0, 50) + '...',
    content: scan.content,
    category: 'personal' as StoryCategory,
    isFavorite: false,
    wordCount: scan.content.split(/\s+/).length,
    createdAt: new Date(scan.createdAt).getTime(),
    updatedAt: new Date(scan.createdAt).getTime(),
    confidence: scan.metadata?.confidence,
    source: scan.type,
  }));

  // Combine backend scans with local stories (backend takes priority)
  const allStories: ExtendedStory[] = [...scansAsStories, ...localStories];

  const filteredStories = allStories.filter((story: ExtendedStory) => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStoryPress = (story: Story) => {
    setCurrentStory(story);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/');
  };

  const handleDelete = (id: string) => {
    // Check if this is a backend scan (numeric ID) or local story
    const isBackendScan = !isNaN(Number(id));

    if (isBackendScan) {
      // Delete from backend
      Alert.alert(
        'Delete Story',
        'Are you sure you want to delete this story? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteScan.mutate(Number(id), {
                onSuccess: () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
                onError: () => {
                  Alert.alert('Error', 'Failed to delete story. Please try again.');
                }
              });
            }
          }
        ]
      );
    } else {
      // Delete from local storage
      deleteStory(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
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
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  style={{ fontFamily: 'PlayfairDisplay_700Bold' }}
                  className={cn(
                    'text-4xl mb-2',
                    colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                  )}
                >
                  Library
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    className={cn(
                      'text-base',
                      colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                    )}
                  >
                    {allStories.length} {allStories.length === 1 ? 'story' : 'stories'} saved
                  </Text>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#8b5cf6' : '#7c3aed'} />
                  ) : null}
                </View>
              </View>
              {error ? (
                <Pressable onPress={() => refetch()} className="p-2">
                  <RefreshCw size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <View className="mt-3 flex-row items-center bg-red-500/20 p-3 rounded-lg">
                <AlertCircle size={16} color="#ef4444" />
                <Text
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  className="text-red-500 text-xs ml-2 flex-1"
                >
                  Failed to load from server. Showing local stories only.
                </Text>
              </View>
            ) : null}
          </View>

          <GlassCard className="p-4 mb-6">
            <View className="flex-row items-center">
              <Search
                size={20}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
                className="mr-2"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search stories..."
                placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
                style={{
                  fontFamily: 'Manrope_400Regular',
                  flex: 1,
                  color: colorScheme === 'dark' ? '#fff' : '#000',
                  fontSize: 16,
                }}
              />
            </View>
          </GlassCard>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 mb-6"
            style={{ flexGrow: 0 }}
          >
            {[{ label: 'All', value: 'all' as const }, ...categories].map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => {
                  setSelectedCategory(cat.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <GlassCard
                  className={cn(
                    'px-6 py-3',
                    selectedCategory === cat.value && 'bg-purple-500/30'
                  )}
                >
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-sm',
                      colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {cat.label}
                  </Text>
                </GlassCard>
              </Pressable>
            ))}
          </ScrollView>

          {filteredStories.length === 0 ? (
            <GlassCard className="p-8 items-center">
              <BookOpen
                size={48}
                color={colorScheme === 'dark' ? '#666' : '#999'}
                strokeWidth={1.5}
              />
              <Text
                style={{ fontFamily: 'Manrope_600SemiBold' }}
                className={cn(
                  'text-lg mt-4 text-center',
                  colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                )}
              >
                No stories yet
              </Text>
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-sm mt-2 text-center',
                  colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                )}
              >
                Create your first story to get started
              </Text>
            </GlassCard>
          ) : (
            <View className="gap-4">
              {filteredStories.map((story, index) => (
                <Animated.View
                  key={story.id}
                  entering={FadeIn.delay(index * 50)}
                  exiting={FadeOut}
                >
                  <GlassCard pressable onPress={() => handleStoryPress(story)} className="p-4">
                    <View className="flex-row items-start">
                      <View className="flex-1">
                        <Text
                          style={{ fontFamily: 'Manrope_600SemiBold' }}
                          className={cn(
                            'text-lg mb-1',
                            colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
                          )}
                          numberOfLines={2}
                        >
                          {story.title}
                        </Text>
                        <Text
                          style={{ fontFamily: 'Manrope_400Regular' }}
                          className={cn(
                            'text-sm mb-2',
                            colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                          )}
                          numberOfLines={2}
                        >
                          {story.content}
                        </Text>
                        <View className="flex-row items-center gap-4 flex-wrap">
                          <Text
                            style={{ fontFamily: 'Manrope_400Regular' }}
                            className={cn(
                              'text-xs',
                              colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                            )}
                          >
                            {story.wordCount} words
                          </Text>

                          {/* Timestamp */}
                          <Text
                            style={{ fontFamily: 'Manrope_400Regular' }}
                            className={cn(
                              'text-xs',
                              colorScheme === 'dark' ? 'text-white/40' : 'text-slate-500'
                            )}
                          >
                            {getRelativeTime(story.createdAt)}
                          </Text>

                          {/* Confidence Score */}
                          {story.confidence ? (
                            <View
                              className={cn(
                                'px-2 py-0.5 rounded-full',
                                story.confidence >= 0.9
                                  ? 'bg-green-500/20'
                                  : story.confidence >= 0.7
                                  ? 'bg-yellow-500/20'
                                  : 'bg-orange-500/20'
                              )}
                            >
                              <Text
                                style={{ fontFamily: 'Manrope_600SemiBold' }}
                                className={cn(
                                  'text-xs',
                                  story.confidence >= 0.9
                                    ? 'text-green-600 dark:text-green-400'
                                    : story.confidence >= 0.7
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-orange-600 dark:text-orange-400'
                                )}
                              >
                                {Math.round(story.confidence * 100)}%
                              </Text>
                            </View>
                          ) : null}

                          {story.audioUri ? (
                            <View className="flex-row items-center">
                              <Play
                                size={12}
                                color={colorScheme === 'dark' ? '#8b5cf6' : '#7c3aed'}
                              />
                              <Text
                                style={{ fontFamily: 'Manrope_400Regular' }}
                                className="text-xs text-purple-500 ml-1"
                              >
                                Audio
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View className="flex-row gap-2 ml-2">
                        <Pressable
                          onPress={() => handleToggleFavorite(story.id)}
                          className="p-2"
                        >
                          <Heart
                            size={20}
                            color={story.isFavorite ? '#ef4444' : colorScheme === 'dark' ? '#fff' : '#000'}
                            fill={story.isFavorite ? '#ef4444' : 'transparent'}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(story.id)}
                          className="p-2"
                        >
                          <Trash2
                            size={20}
                            color={colorScheme === 'dark' ? '#fff' : '#000'}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
