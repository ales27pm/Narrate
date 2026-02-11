/**
 * Content Fetcher Utility
 * Fetches and extracts text content from URLs
 */

export interface FetchedContent {
  text: string;
  title?: string;
  url: string;
  detectedLanguage?: string;
}

/**
 * Canadian French specific words and patterns
 */
const CANADIAN_FRENCH_INDICATORS = [
  // Common Quebec French words
  'char', 'magasiner', 'blonde', 'chum', 'dépanneur',
  'tabarnouche', 'tabarnak', 'câlisse', 'maudit', 'barnak',
  // Quebec specific terms
  'poutine', 'tuque', 'cabane à sucre', 'érablière',
  // Informal expressions
  'pantoute', 'icitte', 'astheure', 'tantôt',
  // Numbers with spaces (Quebec style)
  /\d\s\d{3}/, // e.g., "1 000" instead of "1000"
];

/**
 * Detects if text contains Canadian French patterns
 */
function hasCanadianFrenchPatterns(text: string): boolean {
  const lowerText = text.toLowerCase();

  for (const indicator of CANADIAN_FRENCH_INDICATORS) {
    if (typeof indicator === 'string') {
      if (lowerText.includes(indicator)) {
        return true;
      }
    } else if (indicator instanceof RegExp) {
      if (indicator.test(text)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects if text is in French (any variant)
 */
function isFrench(text: string): boolean {
  // Common French words and patterns
  const frenchIndicators = [
    'le ', 'la ', 'les ', 'un ', 'une ', 'des ',
    'est ', 'sont ', 'était ', 'être ',
    'que ', 'qui ', 'quoi ', 'dont ',
    'avec ', 'dans ', 'pour ', 'sans ',
    'français', 'française',
  ];

  const lowerText = text.toLowerCase();
  let matches = 0;

  for (const indicator of frenchIndicators) {
    if (lowerText.includes(indicator)) {
      matches++;
    }
  }

  // If we find 3 or more French indicators, it's likely French
  return matches >= 3;
}

/**
 * Detects the language of the text content
 * Returns ISO language code (en-US, fr-FR, fr-CA, etc.)
 */
export function detectLanguage(text: string): string {
  if (!text || text.length < 50) {
    return 'en-US'; // Default to English
  }

  // Check if it's French first
  if (isFrench(text)) {
    // Check if it's Canadian French
    if (hasCanadianFrenchPatterns(text)) {
      return 'fr-CA';
    }
    return 'fr-FR';
  }

  // Default to English for now
  // In a production app, you could use a proper language detection library
  return 'en-US';
}

/**
 * Detects if a string is a URL
 */
export function isURL(text: string): boolean {
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  const startsWithProtocol = /^https?:\/\//i.test(text.trim());
  return startsWithProtocol || urlPattern.test(text.trim());
}

/**
 * Normalizes a URL to ensure it has a protocol
 */
export function normalizeURL(url: string): string {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Strips HTML tags and extracts clean text
 */
function stripHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newline
    .trim();

  return text;
}

/**
 * Extracts title from HTML
 */
function extractTitle(html: string): string | undefined {
  // Try to find title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return stripHtml(titleMatch[1]).trim();
  }

  // Try og:title meta tag
  const ogTitleMatch = html.match(
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
  );
  if (ogTitleMatch && ogTitleMatch[1]) {
    return stripHtml(ogTitleMatch[1]).trim();
  }

  // Try h1 tag
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return stripHtml(h1Match[1]).trim();
  }

  return undefined;
}

/**
 * Extracts main content from HTML
 * Attempts to find article content and remove navigation, ads, etc.
 */
function extractMainContent(html: string): string {
  // Try to find main content areas
  const contentPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const content = stripHtml(match[1]);
      // If we found substantial content, use it
      if (content.length > 200) {
        return content;
      }
    }
  }

  // Fallback: strip entire HTML
  return stripHtml(html);
}

/**
 * Fetches content from a URL and extracts clean text
 */
export async function fetchContentFromURL(url: string): Promise<FetchedContent> {
  const normalizedURL = normalizeURL(url);

  try {
    const response = await fetch(normalizedURL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title and content
    const title = extractTitle(html);
    const text = extractMainContent(html);

    if (!text || text.length < 50) {
      throw new Error('No readable content found on this page');
    }

    // Detect language
    const detectedLanguage = detectLanguage(text);

    return {
      text,
      title,
      url: normalizedURL,
      detectedLanguage,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch content: ${error.message}`);
    }
    throw new Error('Failed to fetch content from URL');
  }
}

/**
 * Validates if a URL is likely to be accessible
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  try {
    const normalized = normalizeURL(url);
    const urlObj = new URL(normalized);

    // Check if protocol is http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }

    // Check if hostname is valid
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return { valid: false, error: 'Invalid URL format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
