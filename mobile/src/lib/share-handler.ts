/**
 * Share Handler Utility
 * Handles incoming shared content from iOS Share Sheet and Android Share Intents
 */

import * as Linking from 'expo-linking';
import { fetchContentFromURL, isURL } from './content-fetcher';

export interface SharedContent {
  type: 'text' | 'url';
  content: string;
  url?: string;
  title?: string;
}

/**
 * Parses a deep link URL to extract shared content
 */
export function parseSharedLink(url: string): SharedContent | null {
  try {
    const parsed = Linking.parse(url);

    // Handle URL scheme: vibecode://share?text=...&url=...
    if (parsed.path === 'share' && parsed.queryParams) {
      const { text, url, title } = parsed.queryParams;

      // If a URL was shared
      if (url && typeof url === 'string') {
        return {
          type: 'url',
          content: url,
          url: url,
          title: typeof title === 'string' ? title : undefined,
        };
      }

      // If text was shared
      if (text && typeof text === 'string') {
        return {
          type: 'text',
          content: text,
          url: undefined,
          title: typeof title === 'string' ? title : undefined,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to parse shared link:', error);
    return null;
  }
}

/**
 * Processes shared content and fetches URL content if needed
 */
export async function processSharedContent(
  sharedContent: SharedContent
): Promise<{ text: string; title?: string }> {
  try {
    // If it's a URL, fetch the content
    if (sharedContent.type === 'url' && sharedContent.url) {
      const fetchedContent = await fetchContentFromURL(sharedContent.url);
      return {
        text: fetchedContent.text,
        title: fetchedContent.title || sharedContent.title,
      };
    }

    // If the text content is a URL, fetch it
    if (isURL(sharedContent.content)) {
      const fetchedContent = await fetchContentFromURL(sharedContent.content);
      return {
        text: fetchedContent.text,
        title: fetchedContent.title || sharedContent.title,
      };
    }

    // Otherwise, return the text as-is
    return {
      text: sharedContent.content,
      title: sharedContent.title,
    };
  } catch (error) {
    console.error('Failed to process shared content:', error);
    // Fallback to original content if fetching fails
    return {
      text: sharedContent.content,
      title: sharedContent.title,
    };
  }
}

/**
 * Creates a shareable deep link URL
 */
export function createShareLink(text: string, url?: string, title?: string): string {
  const params: Record<string, string> = {};

  if (url) {
    params.url = url;
  }
  if (text) {
    params.text = text;
  }
  if (title) {
    params.title = title;
  }

  return Linking.createURL('share', { queryParams: params });
}
