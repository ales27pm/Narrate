import React from 'react';
import { View, Text, useColorScheme, Pressable } from 'react-native';
import { GlassCard } from './GlassCard';
import { FileText, Globe, Image, FileType, Clock, Hash, Languages, CheckCircle } from 'lucide-react-native';
import type { ExtractionResult } from '@/lib/ocr-extractor';

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ContentPreviewProps {
  extractionResult: ExtractionResult;
  onEdit?: () => void;
  onNarrate?: () => void;
  onCancel?: () => void;
}

export function ContentPreview({
  extractionResult,
  onEdit,
  onNarrate,
  onCancel,
}: ContentPreviewProps) {
  const colorScheme = useColorScheme();
  const { text, title, metadata } = extractionResult;

  const getSourceIcon = () => {
    const iconColor = colorScheme === 'dark' ? '#8b5cf6' : '#7c3aed';
    const size = 24;

    switch (metadata?.sourceType) {
      case 'image':
        return <Image size={size} color={iconColor} />;
      case 'screenshot':
        return <Image size={size} color={iconColor} />;
      case 'pdf':
        return <FileType size={size} color={iconColor} />;
      case 'web':
        return <Globe size={size} color={iconColor} />;
      default:
        return <FileText size={size} color={iconColor} />;
    }
  };

  const getSourceLabel = () => {
    switch (metadata?.sourceType) {
      case 'image':
        return 'Image Text';
      case 'screenshot':
        return 'Screenshot';
      case 'pdf':
        return 'PDF Document';
      case 'web':
        return 'Web Article';
      case 'file':
        return 'Text File';
      default:
        return 'Content';
    }
  };

  return (
    <GlassCard className="p-6 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          {getSourceIcon()}
          <View className="ml-3 flex-1">
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className={cn(
                'text-base',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
              numberOfLines={1}
            >
              {title || 'Extracted Content'}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-xs',
                  colorScheme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                )}
              >
                {getSourceLabel()}
              </Text>
              {metadata?.confidence ? (
                <View
                  className={cn(
                    'ml-2 px-2 py-0.5 rounded-full',
                    metadata.confidence >= 0.9
                      ? 'bg-green-500/20'
                      : metadata.confidence >= 0.7
                      ? 'bg-yellow-500/20'
                      : 'bg-orange-500/20'
                  )}
                >
                  <Text
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                    className={cn(
                      'text-xs',
                      metadata.confidence >= 0.9
                        ? 'text-green-600 dark:text-green-400'
                        : metadata.confidence >= 0.7
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-orange-600 dark:text-orange-400'
                    )}
                  >
                    {Math.round(metadata.confidence * 100)}% Accurate
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        {metadata?.confidence && metadata.confidence > 0.8 ? (
          <CheckCircle size={20} color="#10b981" />
        ) : null}
      </View>

      <View className="mb-4 space-y-2">
        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center">
            <Hash
              size={16}
              color={colorScheme === 'dark' ? '#fff' : '#000'}
              opacity={0.6}
            />
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm ml-2',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              Word Count
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'Manrope_600SemiBold' }}
            className={cn(
              'text-sm',
              colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
            )}
          >
            {metadata?.wordCount.toLocaleString() || 0}
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-2">
          <View className="flex-row items-center">
            <Clock
              size={16}
              color={colorScheme === 'dark' ? '#fff' : '#000'}
              opacity={0.6}
            />
            <Text
              style={{ fontFamily: 'Manrope_400Regular' }}
              className={cn(
                'text-sm ml-2',
                colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
              )}
            >
              Reading Time
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'Manrope_600SemiBold' }}
            className={cn(
              'text-sm',
              colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
            )}
          >
            {metadata?.estimatedReadingTime || 0} min
          </Text>
        </View>

        {metadata?.language ? (
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Languages
                size={16}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
                opacity={0.6}
              />
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-sm ml-2',
                  colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                )}
              >
                Language
              </Text>
            </View>
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className={cn(
                'text-sm',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              {metadata.language}
            </Text>
          </View>
        ) : null}

        {metadata?.pageCount ? (
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <FileText
                size={16}
                color={colorScheme === 'dark' ? '#fff' : '#000'}
                opacity={0.6}
              />
              <Text
                style={{ fontFamily: 'Manrope_400Regular' }}
                className={cn(
                  'text-sm ml-2',
                  colorScheme === 'dark' ? 'text-white/60' : 'text-slate-600'
                )}
              >
                Pages
              </Text>
            </View>
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className={cn(
                'text-sm',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              {metadata.pageCount}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className={cn(
          'p-3 rounded-lg mb-4',
          colorScheme === 'dark' ? 'bg-white/5' : 'bg-black/5'
        )}
      >
        <Text
          style={{ fontFamily: 'Manrope_400Regular' }}
          className={cn(
            'text-sm',
            colorScheme === 'dark' ? 'text-white/80' : 'text-slate-700'
          )}
          numberOfLines={4}
        >
          {text.slice(0, 200)}
          {text.length > 200 ? '...' : ''}
        </Text>
      </View>

      <View className="flex-row gap-2">
        {Boolean(onCancel) && (
          <Pressable
            onPress={onCancel}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl',
              colorScheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className={cn(
                'text-center text-sm',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              Cancel
            </Text>
          </Pressable>
        )}

        {Boolean(onEdit) && (
          <Pressable
            onPress={onEdit}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl',
              colorScheme === 'dark' ? 'bg-white/10' : 'bg-black/10'
            )}
          >
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className={cn(
                'text-center text-sm',
                colorScheme === 'dark' ? 'text-white' : 'text-slate-900'
              )}
            >
              Edit
            </Text>
          </Pressable>
        )}

        {Boolean(onNarrate) && (
          <Pressable
            onPress={onNarrate}
            className="flex-1 py-3 px-4 rounded-xl bg-purple-500"
          >
            <Text
              style={{ fontFamily: 'Manrope_600SemiBold' }}
              className="text-center text-sm text-white"
            >
              Narrate
            </Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}
