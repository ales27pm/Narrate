/**
 * OCR and Advanced Content Extraction Utility
 * Note: OCR and PDF extraction features are not available in the on-device version
 * These features require a backend server for processing
 */

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
 * Extract text from image - NOT AVAILABLE in on-device version
 * This feature requires a backend server for OCR processing
 */
export async function extractTextFromImage(
  imageUri: string,
  isScreenshot: boolean = false
): Promise<ExtractionResult> {
  throw new Error(
    'OCR feature is not available in the on-device version. This feature requires a backend server for image text extraction.'
  );
}

/**
 * Extract text from PDF - NOT AVAILABLE in on-device version
 * This feature requires a backend server for PDF text extraction
 */
export async function extractTextFromPDF(pdfUri: string): Promise<ExtractionResult> {
  throw new Error(
    'PDF extraction is not available in the on-device version. This feature requires a backend server for PDF text extraction. Please use plain text (.txt) files instead.'
  );
}

/**
 * Enhanced HTML/Web content extraction - NOT AVAILABLE in on-device version
 * This feature requires a backend server. Use the basic client-side extraction instead.
 */
export async function extractTextFromWebEnhanced(url: string): Promise<ExtractionResult> {
  throw new Error(
    'Enhanced web extraction is not available. The app will use basic client-side extraction instead.'
  );
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
