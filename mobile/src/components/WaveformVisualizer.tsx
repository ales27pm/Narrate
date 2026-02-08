import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/cn';

interface WaveformVisualizerProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  isActive,
  barCount = 40,
  className,
}: WaveformVisualizerProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <View className={cn('flex-row items-center justify-center gap-1', className)}>
      {bars.map((i) => (
        <WaveformBar key={i} isActive={isActive} index={i} total={barCount} />
      ))}
    </View>
  );
}

function WaveformBar({
  isActive,
  index,
  total,
}: {
  isActive: boolean;
  index: number;
  total: number;
}) {
  const animation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const delay = (index / total) * 500;
      animation.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: 800 + Math.random() * 400,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        )
      );
    } else {
      animation.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, index, total, animation]);

  const animatedStyle = useAnimatedStyle(() => {
    const minHeight = 4;
    const maxHeight = 32;
    const height = interpolate(animation.value, [0, 1], [minHeight, maxHeight]);

    return {
      height,
      opacity: isActive ? 1 : 0.3,
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="w-1 bg-gradient-to-t from-indigo-400 to-purple-500 rounded-full"
    />
  );
}
