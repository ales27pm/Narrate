/**
 * OCR and Advanced Content Extraction Utility
 * Handles image text extraction, PDF parsing, and enhanced web content extraction
 */

import * as FileSystem from 'expo-file-system';

export interface ExtractionResult {
  text: string;
  title?: string;
  metadata?: {
    sourceType: 'image' | 'pdf' | 'web' | 'screenshot' | 'file';
    wordCount: number;
    estimatedReadingTime: number; // in minutes
    language?: string;
    pageCount?: number;
    confidence?: number; // OCR confidence score
  };
}

/**
 * Detects if an image is likely a screenshot based on dimensions
 */
export function isLikelyScreenshot(width: number, height: number): boolean {
  // Common phone screen aspect ratios
  const aspectRatio = width / height;

  // Modern phones: 16:9, 18:9, 19.5:9, 20:9, etc.
  const commonRatios = [
    { min: 0.46, max: 0.48 }, // 9:19.5 portrait
    { min: 0.50, max: 0.52 }, // 9:18 portrait
    { min: 0.56, max: 0.58 }, // 9:16 portrait
    { min: 0.65, max: 0.68 }, // 2:3 portrait
    { min: 1.76, max: 1.80 }, // 16:9 landscape
    { min: 1.96, max: 2.05 }, // 18:9 landscape
  ];

  return commonRatios.some(ratio =>
    aspectRatio >= ratio.min && aspectRatio <= ratio.max
  );
}

/**
 * Detects the language of text (simple heuristic)
 */
export function detectLanguage(text: string): string {
  const sample = text.slice(0, 500);

  // Check for common language patterns
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(sample)) return 'Japanese';
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'Chinese';
  if (/[\uAC00-\uD7AF]/.test(sample)) return 'Korean';
  if (/[\u0600-\u06FF]/.test(sample)) return 'Arabic';
  if (/[\u0400-\u04FF]/.test(sample)) return 'Russian';
  if (/[\u0E00-\u0E7F]/.test(sample)) return 'Thai';

  // European language detection (very basic)
  const words = sample.toLowerCase().split(/\s+/);
  const commonSpanish = ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'los', 'del'];
  const commonFrench = ['le', 'de', 'un', 'et', 'est', 'dans', 'les', 'pour', 'que'];
  const commonGerman = ['der', 'die', 'das', 'und', 'ist', 'in', 'den', 'von', 'zu'];

  const spanishMatches = words.filter(w => commonSpanish.includes(w)).length;
  const frenchMatches = words.filter(w => commonFrench.includes(w)).length;
  const germanMatches = words.filter(w => commonGerman.includes(w)).length;

  if (spanishMatches > 3) return 'Spanish';
  if (frenchMatches > 3) return 'French';
  if (germanMatches > 3) return 'German';

  return 'English';
}

/**
 * Calculate estimated reading time
 */
export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Extract text from image using backend OCR service
 */
export async function extractTextFromImage(
  imageUri: string,
  isScreenshot: boolean = false
): Promise<ExtractionResult> {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      throw new Error('Backend URL not configured');
    }

    // Read image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Send to backend for OCR processing
    const response = await fetch(`${backendUrl}/api/ocr/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        isScreenshot,
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR service error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.data.text;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      text,
      title: isScreenshot ? 'Screenshot Text' : 'Extracted Text',
      metadata: {
        sourceType: isScreenshot ? 'screenshot' : 'image',
        wordCount,
        estimatedReadingTime: calculateReadingTime(wordCount),
        language: detectLanguage(text),
        confidence: result.data.confidence,
      },
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(
      'OCR service unavailable. Please ensure the backend is running and try again.'
    );
  }
}

/**
 * Extract text from PDF using backend PDF parser
 */
export async function extractTextFromPDF(pdfUri: string): Promise<ExtractionResult> {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      throw new Error('Backend URL not configured');
    }

    // Read PDF file as base64
    const base64 = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Send to backend for PDF text extraction
    const response = await fetch(`${backendUrl}/api/pdf/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: base64,
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF extraction error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.data.text;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      text,
      title: result.data.title || 'PDF Document',
      metadata: {
        sourceType: 'pdf',
        wordCount,
        estimatedReadingTime: calculateReadingTime(wordCount),
        language: detectLanguage(text),
        pageCount: result.data.pageCount,
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(
      'PDF extraction service unavailable. Please ensure the backend is running and try again.'
    );
  }
}

/**
 * Enhanced HTML/Web content extraction with readability algorithm
 */
export async function extractTextFromWebEnhanced(url: string): Promise<ExtractionResult> {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      // Fallback to client-side extraction if backend not available
      throw new Error('Backend URL not configured');
    }

    // Use backend for better content extraction with Readability algorithm
    const response = await fetch(`${backendUrl}/api/web/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Web extraction error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.data.text;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      text,
      title: result.data.title || 'Web Article',
      metadata: {
        sourceType: 'web',
        wordCount,
        estimatedReadingTime: calculateReadingTime(wordCount),
        language: detectLanguage(text),
      },
    };
  } catch (error) {
    console.error('Enhanced web extraction error:', error);
    // Return null to trigger fallback to client-side extraction
    throw error;
  }
}

/**
 * Extract content from various sources with platform-specific optimizations
 */
export async function extractContent(
  source: string | { uri: string; type: string },
  sourceType: 'url' | 'image' | 'pdf' | 'file'
): Promise<ExtractionResult> {
  switch (sourceType) {
    case 'image': {
      const uri = typeof source === 'string' ? source : source.uri;
      return extractTextFromImage(uri);
    }

    case 'pdf': {
      const uri = typeof source === 'string' ? source : source.uri;
      return extractTextFromPDF(uri);
    }

    case 'url': {
      const url = typeof source === 'string' ? source : source.uri;
      return extractTextFromWebEnhanced(url);
    }

    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}
