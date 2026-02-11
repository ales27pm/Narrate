/**
 * Clipboard Monitoring Hook
 * Monitors clipboard for URLs and offers to fetch content
 */

import { useEffect, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import { isURL } from './content-fetcher';
import { useNarratorStore } from './narrator-store';

export function useClipboardMonitor(onURLDetected: (url: string) => void) {
  const extractionSettings = useNarratorStore((s) => s.extractionSettings);
  const lastClipboardValue = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!extractionSettings.clipboardMonitoring) {
      // Clear interval if monitoring is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check clipboard every 2 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const hasString = await Clipboard.hasStringAsync();
        if (!hasString) return;

        const clipboardContent = await Clipboard.getStringAsync();

        // Check if clipboard content has changed and is a URL
        if (
          clipboardContent &&
          clipboardContent !== lastClipboardValue.current &&
          isURL(clipboardContent.trim())
        ) {
          lastClipboardValue.current = clipboardContent;

          // Notify about detected URL
          Alert.alert(
            'URL Detected',
            `Would you like to fetch content from:\n${clipboardContent.slice(0, 60)}${clipboardContent.length > 60 ? '...' : ''}`,
            [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => onURLDetected(clipboardContent.trim()),
              },
            ]
          );
        }
      } catch (error) {
        console.error('Clipboard monitoring error:', error);
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [extractionSettings.clipboardMonitoring, onURLDetected]);
}
