/**
 * Prosody Engine - Advanced text analysis and speech pattern generation
 * for human-realistic Canadian French narration
 */

export type SentenceType = 'statement' | 'question' | 'exclamation' | 'list-item';
export type EmotionalTone = 'neutral' | 'excited' | 'serious' | 'sad' | 'dramatic';
export type ContentType = 'narrative' | 'dialogue' | 'technical' | 'list';

export interface ProsodyHint {
  type: 'pause' | 'emphasis' | 'pitch' | 'rate' | 'volume';
  position: number; // Character position in text
  value: number | string;
  duration?: number; // For pauses (ms)
}

export interface TextSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  sentenceType: SentenceType;
  emotionalTone: EmotionalTone;
  contentType: ContentType;
  prosodyHints: ProsodyHint[];
}

export interface ProsodySettings {
  intensity: number; // 0.0 to 1.0 (subtle to dramatic)
  pauseMultiplier: number; // 0.5x to 2x
  emphasisDetection: boolean;
  breathingSounds: boolean;
  naturalPacing: boolean;
}

export class ProsodyEngine {
  private settings: ProsodySettings;

  constructor(settings: Partial<ProsodySettings> = {}) {
    this.settings = {
      intensity: 0.7,
      pauseMultiplier: 1.0,
      emphasisDetection: true,
      breathingSounds: false,
      naturalPacing: true,
      ...settings,
    };
  }

  /**
   * Analyze text and generate prosody hints for natural speech
   */
  analyzeText(text: string): TextSegment[] {
    const segments: TextSegment[] = [];
    const sentences = this.splitIntoSentences(text);

    let currentIndex = 0;
    for (const sentence of sentences) {
      const segment = this.analyzeSentence(sentence, currentIndex);
      segments.push(segment);
      currentIndex = segment.endIndex;
    }

    return segments;
  }

  /**
   * Split text into sentences while preserving structure
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation, keeping the punctuation
    const sentenceMatches = text.match(/[^.!?\n]+[.!?\n]+/g);
    const sentences: string[] = sentenceMatches ? [...sentenceMatches] : [];

    // Handle text that doesn't end with punctuation
    const lastSentence = text.replace(/[^.!?\n]+[.!?\n]+/g, '').trim();
    if (lastSentence) {
      sentences.push(lastSentence);
    }

    return sentences;
  }

  /**
   * Analyze individual sentence for prosody patterns
   */
  private analyzeSentence(sentence: string, startIndex: number): TextSegment {
    const trimmed = sentence.trim();
    const endIndex = startIndex + trimmed.length;

    const sentenceType = this.detectSentenceType(trimmed);
    const emotionalTone = this.detectEmotionalTone(trimmed);
    const contentType = this.detectContentType(trimmed);
    const prosodyHints = this.generateProsodyHints(trimmed, sentenceType, emotionalTone, contentType);

    return {
      text: trimmed,
      startIndex,
      endIndex,
      sentenceType,
      emotionalTone,
      contentType,
      prosodyHints,
    };
  }

  /**
   * Detect sentence type (question, exclamation, statement, list item)
   */
  private detectSentenceType(sentence: string): SentenceType {
    if (sentence.includes('?')) return 'question';
    if (sentence.includes('!')) return 'exclamation';

    // Detect list items (starts with number, bullet, dash, or letter)
    if (/^[\d\-•·*]|^[a-z]\)/.test(sentence.trim())) return 'list-item';

    return 'statement';
  }

  /**
   * Detect emotional tone through sentiment analysis
   */
  private detectEmotionalTone(sentence: string): EmotionalTone {
    const lowerText = sentence.toLowerCase();

    // Excited words
    const excitedWords = ['génial', 'super', 'incroyable', 'fantastique', 'excellent', 'bravo', 'hourra', 'wow'];
    if (excitedWords.some(word => lowerText.includes(word)) || sentence.includes('!')) {
      return 'excited';
    }

    // Serious/formal words
    const seriousWords = ['important', 'crucial', 'essentiel', 'critique', 'attention', 'grave'];
    if (seriousWords.some(word => lowerText.includes(word))) {
      return 'serious';
    }

    // Sad/negative words
    const sadWords = ['triste', 'malheureux', 'désolé', 'regret', 'peine', 'dommage'];
    if (sadWords.some(word => lowerText.includes(word))) {
      return 'sad';
    }

    // Dramatic indicators
    if (sentence.includes('...') || /[A-Z]{2,}/.test(sentence)) {
      return 'dramatic';
    }

    return 'neutral';
  }

  /**
   * Detect content type (narrative, dialogue, technical, list)
   */
  private detectContentType(sentence: string): ContentType {
    // Dialogue detection (quotes)
    if (sentence.includes('"') || sentence.includes('«') || sentence.includes('»')) {
      return 'dialogue';
    }

    // Technical content (contains numbers, technical terms)
    if (/\d+%|\d+°|°C|°F|\d+km|\d+m/.test(sentence)) {
      return 'technical';
    }

    // List item
    if (/^[\d\-•·*]|^[a-z]\)/.test(sentence.trim())) {
      return 'list';
    }

    return 'narrative';
  }

  /**
   * Generate prosody hints for natural speech patterns
   */
  private generateProsodyHints(
    sentence: string,
    sentenceType: SentenceType,
    emotionalTone: EmotionalTone,
    contentType: ContentType
  ): ProsodyHint[] {
    const hints: ProsodyHint[] = [];

    // Add comma pauses
    const commaMatches = [...sentence.matchAll(/,/g)];
    for (const match of commaMatches) {
      if (match.index !== undefined) {
        hints.push({
          type: 'pause',
          position: match.index,
          value: 200 * this.settings.pauseMultiplier,
          duration: 200 * this.settings.pauseMultiplier,
        });
      }
    }

    // Add sentence-ending pauses
    if (sentence.match(/[.!?]$/)) {
      hints.push({
        type: 'pause',
        position: sentence.length - 1,
        value: 400 * this.settings.pauseMultiplier,
        duration: 400 * this.settings.pauseMultiplier,
      });
    }

    // Add ellipsis dramatic pauses
    const ellipsisMatches = [...sentence.matchAll(/\.\.\./g)];
    for (const match of ellipsisMatches) {
      if (match.index !== undefined) {
        hints.push({
          type: 'pause',
          position: match.index,
          value: 600 * this.settings.pauseMultiplier,
          duration: 600 * this.settings.pauseMultiplier,
        });
      }
    }

    // Question intonation - rising pitch at end
    if (sentenceType === 'question') {
      hints.push({
        type: 'pitch',
        position: sentence.length - 5,
        value: '+10%',
      });
    }

    // Exclamation emphasis
    if (sentenceType === 'exclamation') {
      hints.push({
        type: 'emphasis',
        position: 0,
        value: 'strong',
      });
      hints.push({
        type: 'volume',
        position: 0,
        value: 1.1,
      });
    }

    // Emphasis detection for capitalized words and important terms
    if (this.settings.emphasisDetection) {
      // Detect ALL CAPS words
      const capsMatches = [...sentence.matchAll(/\b[A-Z]{2,}\b/g)];
      for (const match of capsMatches) {
        if (match.index !== undefined) {
          hints.push({
            type: 'emphasis',
            position: match.index,
            value: 'strong',
          });
        }
      }

      // Detect bold/italic markers (simplified)
      const emphasisWords = ['très', 'vraiment', 'absolument', 'jamais', 'toujours', 'extrêmement'];
      for (const word of emphasisWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = [...sentence.matchAll(regex)];
        for (const match of matches) {
          if (match.index !== undefined) {
            hints.push({
              type: 'emphasis',
              position: match.index,
              value: 'moderate',
            });
          }
        }
      }
    }

    // Emotional tone adjustments
    if (emotionalTone === 'excited') {
      hints.push({
        type: 'rate',
        position: 0,
        value: 1.15, // Speed up slightly
      });
      hints.push({
        type: 'pitch',
        position: 0,
        value: '+5%',
      });
    } else if (emotionalTone === 'serious') {
      hints.push({
        type: 'rate',
        position: 0,
        value: 0.9, // Slow down
      });
      hints.push({
        type: 'pitch',
        position: 0,
        value: '-3%',
      });
    } else if (emotionalTone === 'sad') {
      hints.push({
        type: 'rate',
        position: 0,
        value: 0.85, // Slow down more
      });
      hints.push({
        type: 'pitch',
        position: 0,
        value: '-5%',
      });
    } else if (emotionalTone === 'dramatic') {
      hints.push({
        type: 'pause',
        position: 0,
        value: 300 * this.settings.pauseMultiplier,
        duration: 300 * this.settings.pauseMultiplier,
      });
    }

    // Content-type specific adjustments
    if (contentType === 'technical') {
      hints.push({
        type: 'rate',
        position: 0,
        value: 0.85, // Slow down for technical content
      });
    } else if (contentType === 'dialogue') {
      hints.push({
        type: 'rate',
        position: 0,
        value: 1.1, // Speed up slightly for dialogue
      });
    } else if (contentType === 'list') {
      hints.push({
        type: 'pause',
        position: sentence.length,
        value: 300 * this.settings.pauseMultiplier,
        duration: 300 * this.settings.pauseMultiplier,
      });
    }

    // Natural breathing pauses every 2-3 sentences (add to longer sentences)
    if (this.settings.naturalPacing && sentence.split(' ').length > 20) {
      const midPoint = Math.floor(sentence.length / 2);
      hints.push({
        type: 'pause',
        position: midPoint,
        value: 250 * this.settings.pauseMultiplier,
        duration: 250 * this.settings.pauseMultiplier,
      });
    }

    return hints;
  }

  /**
   * Generate SSML markup for premium TTS services
   */
  generateSSML(segments: TextSegment[]): string {
    let ssml = '<speak>';

    for (const segment of segments) {
      let segmentSSML = segment.text;

      // Apply prosody hints
      const pitchHints = segment.prosodyHints.filter(h => h.type === 'pitch');
      const rateHints = segment.prosodyHints.filter(h => h.type === 'rate');
      const volumeHints = segment.prosodyHints.filter(h => h.type === 'volume');
      const emphasisHints = segment.prosodyHints.filter(h => h.type === 'emphasis');
      const pauseHints = segment.prosodyHints.filter(h => h.type === 'pause');

      // Wrap in prosody tags if needed
      let prosodyAttrs = '';
      if (pitchHints.length > 0) {
        prosodyAttrs += ` pitch="${pitchHints[0].value}"`;
      }
      if (rateHints.length > 0) {
        prosodyAttrs += ` rate="${typeof rateHints[0].value === 'number' ? rateHints[0].value + 'x' : rateHints[0].value}"`;
      }
      if (volumeHints.length > 0) {
        prosodyAttrs += ` volume="${typeof volumeHints[0].value === 'number' ? Math.round(volumeHints[0].value * 100) + '%' : volumeHints[0].value}"`;
      }

      if (prosodyAttrs) {
        segmentSSML = `<prosody${prosodyAttrs}>${segmentSSML}</prosody>`;
      }

      // Add emphasis tags
      if (emphasisHints.length > 0 && this.settings.emphasisDetection) {
        // Simplified: wrap entire segment if it has emphasis
        segmentSSML = `<emphasis level="${emphasisHints[0].value}">${segmentSSML}</emphasis>`;
      }

      ssml += segmentSSML;

      // Add pauses at end of segment
      const endPauses = pauseHints.filter(h => h.position >= segment.text.length - 2);
      if (endPauses.length > 0) {
        const longestPause = Math.max(...endPauses.map(p => p.duration || 0));
        ssml += `<break time="${longestPause}ms"/>`;
      }
    }

    ssml += '</speak>';
    return ssml;
  }

  /**
   * Apply prosody adjustments to base speech settings
   */
  applyProsodyToSpeech(
    baseSettings: { pitch: number; rate: number; volume: number },
    segment: TextSegment
  ): { pitch: number; rate: number; volume: number } {
    const adjusted = { ...baseSettings };

    // Apply prosody hints
    for (const hint of segment.prosodyHints) {
      if (hint.type === 'pitch' && typeof hint.value === 'string') {
        const percentMatch = hint.value.match(/([+-]?\d+)%/);
        if (percentMatch) {
          const percent = parseInt(percentMatch[1]);
          adjusted.pitch = Math.max(0.5, Math.min(2.0, adjusted.pitch * (1 + percent / 100)));
        }
      }

      if (hint.type === 'rate' && typeof hint.value === 'number') {
        adjusted.rate = Math.max(0.5, Math.min(2.0, adjusted.rate * hint.value));
      }

      if (hint.type === 'volume' && typeof hint.value === 'number') {
        adjusted.volume = Math.max(0, Math.min(1, adjusted.volume * hint.value));
      }
    }

    // Apply intensity scaling
    const neutral = baseSettings;
    const intensity = this.settings.intensity;
    adjusted.pitch = neutral.pitch + (adjusted.pitch - neutral.pitch) * intensity;
    adjusted.rate = neutral.rate + (adjusted.rate - neutral.rate) * intensity;
    adjusted.volume = neutral.volume + (adjusted.volume - neutral.volume) * intensity;

    return adjusted;
  }

  /**
   * Get pauses that should be inserted during narration
   */
  getPausesForSegment(segment: TextSegment): Array<{ position: number; duration: number }> {
    return segment.prosodyHints
      .filter(h => h.type === 'pause' && h.duration)
      .map(h => ({ position: h.position, duration: h.duration! }))
      .sort((a, b) => a.position - b.position);
  }
}

/**
 * Preprocess text for Canadian French TTS
 */
export function preprocessCanadianFrench(text: string): string {
  let processed = text;

  // Expand abbreviations
  processed = processed.replace(/\bM\.\s/g, 'Monsieur ');
  processed = processed.replace(/\bMme\.\s/g, 'Madame ');
  processed = processed.replace(/\bMlle\.\s/g, 'Mademoiselle ');
  processed = processed.replace(/\bDr\.\s/g, 'Docteur ');
  processed = processed.replace(/\bSte\.\s/g, 'Sainte ');
  processed = processed.replace(/\bSt\.\s/g, 'Saint ');

  // Handle Canadian French currency (informal: piastre)
  // processed = processed.replace(/(\d+)\$\s?CAD/g, '$1 piastres');
  processed = processed.replace(/(\d+)\$/g, '$1 dollars');

  // Numbers in Canadian French format
  processed = processed.replace(/\b90\b/g, 'quatre-vingt-dix');
  processed = processed.replace(/\b91\b/g, 'quatre-vingt-onze');
  processed = processed.replace(/\b92\b/g, 'quatre-vingt-douze');
  processed = processed.replace(/\b93\b/g, 'quatre-vingt-treize');
  processed = processed.replace(/\b94\b/g, 'quatre-vingt-quatorze');
  processed = processed.replace(/\b95\b/g, 'quatre-vingt-quinze');
  processed = processed.replace(/\b96\b/g, 'quatre-vingt-seize');
  processed = processed.replace(/\b97\b/g, 'quatre-vingt-dix-sept');
  processed = processed.replace(/\b98\b/g, 'quatre-vingt-dix-huit');
  processed = processed.replace(/\b99\b/g, 'quatre-vingt-dix-neuf');

  // Clean up web artifacts
  processed = processed.replace(/\s+/g, ' '); // Multiple spaces
  processed = processed.replace(/\n{3,}/g, '\n\n'); // Too many newlines

  return processed.trim();
}
