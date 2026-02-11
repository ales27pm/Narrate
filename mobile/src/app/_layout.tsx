import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useNarratorStore } from '@/lib/narrator-store';
import { parseSharedLink, processSharedContent } from '@/lib/share-handler';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="recorder"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom'
          }}
        />
        <Stack.Screen
          name="library"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_right'
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();
  const setSharedContent = useNarratorStore((s) => s.setSharedContent);

  useEffect(() => {
    // Handle initial URL when app is opened from a share action
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const sharedContent = parseSharedLink(initialUrl);
        if (sharedContent) {
          try {
            const processed = await processSharedContent(sharedContent);
            setSharedContent({
              text: processed.text,
              title: processed.title,
              url: sharedContent.url,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error('Failed to process initial shared content:', error);
          }
        }
      }
    };

    handleInitialURL();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', async (event) => {
      const sharedContent = parseSharedLink(event.url);
      if (sharedContent) {
        try {
          const processed = await processSharedContent(sharedContent);
          setSharedContent({
            text: processed.text,
            title: processed.title,
            url: sharedContent.url,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error('Failed to process shared content:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [setSharedContent]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}