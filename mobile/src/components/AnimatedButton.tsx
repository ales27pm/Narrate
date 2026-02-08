import React from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export function AnimatedButton({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    opacity.value = withSpring(0.8);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }]}
        {...props}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#d946ef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Animated.View
            className={cn(
              'flex-row items-center justify-center',
              sizeClasses[size],
              className
            )}
          >
            {icon}
            <Text
              className={cn(
                'text-white font-semibold',
                textSizeClasses[size],
                icon && 'ml-2'
              )}
            >
              {title}
            </Text>
          </Animated.View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={animatedStyle}
        className={cn(
          'rounded-2xl border border-white/20 bg-white/10 flex-row items-center justify-center',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {icon}
        <Text
          className={cn(
            'text-white font-semibold',
            textSizeClasses[size],
            icon && 'ml-2'
          )}
        >
          {title}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
      className={cn(
        'flex-row items-center justify-center',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon}
      <Text
        className={cn(
          'text-white/80 font-medium',
          textSizeClasses[size],
          icon && 'ml-2'
        )}
      >
        {title}
      </Text>
    </AnimatedPressable>
  );
}
