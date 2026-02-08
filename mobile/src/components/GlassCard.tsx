import React from 'react';
import { View, Pressable, type ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/cn';
import { useColorScheme } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  onPress?: () => void;
  pressable?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  intensity = 20,
  onPress,
  pressable = false,
  className,
  ...props
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (pressable || onPress) {
      scale.value = withSpring(0.98);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (pressable || onPress) {
      scale.value = withSpring(1);
    }
  };

  const content = (
    <BlurView
      intensity={intensity}
      tint={colorScheme === 'dark' ? 'dark' : 'light'}
      className={cn(
        'rounded-3xl overflow-hidden border border-white/10',
        colorScheme === 'dark' ? 'bg-white/5' : 'bg-white/60',
        className
      )}
      {...props}
    >
      {children}
    </BlurView>
  );

  if (pressable || onPress) {
    return (
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View {...props}>{content}</View>;
}
