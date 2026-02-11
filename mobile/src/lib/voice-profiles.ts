/**
 * Canadian French Voice Profiles
 * Different voice personalities for narration
 */

import type { VoicePersonality, ProsodySettings } from './types';

export interface VoiceProfile {
  id: VoicePersonality;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  icon: string;
  prosodySettings: ProsodySettings;
  voiceSettings: {
    pitchAdjustment: number; // Multiplier for base pitch
    rateAdjustment: number; // Multiplier for base rate
    volumeAdjustment: number; // Multiplier for base volume
  };
  examples: string[];
  sampleText: string;
}

export const canadianFrenchVoiceProfiles: VoiceProfile[] = [
  {
    id: 'professionnel',
    name: 'Professional',
    nameFr: 'Professionnel',
    description: 'Clear, formal, news anchor style',
    descriptionFr: 'Voix claire et formelle, style présentateur de nouvelles',
    icon: 'briefcase',
    prosodySettings: {
      enabled: true,
      intensity: 0.5, // Subtle prosody
      pauseMultiplier: 1.1, // Slightly longer pauses for clarity
      emphasisDetection: true,
      breathingSounds: false,
      naturalPacing: true,
    },
    voiceSettings: {
      pitchAdjustment: 1.0,
      rateAdjustment: 0.95, // Slightly slower for clarity
      volumeAdjustment: 1.0,
    },
    examples: [
      'Idéal pour les articles de presse',
      'Parfait pour les documents professionnels',
      'Excellent pour les rapports et analyses',
    ],
    sampleText: 'Bienvenue à Radio-Canada. Voici les nouvelles du jour. Le gouvernement a annoncé de nouvelles mesures économiques visant à soutenir les familles canadiennes.',
  },
  {
    id: 'conversationnel',
    name: 'Conversational',
    nameFr: 'Conversationnel',
    description: 'Warm, friendly, podcast host style',
    descriptionFr: 'Voix chaleureuse et amicale, style animateur de balado',
    icon: 'message-circle',
    prosodySettings: {
      enabled: true,
      intensity: 0.7, // Moderate prosody
      pauseMultiplier: 1.0, // Natural pauses
      emphasisDetection: true,
      breathingSounds: false,
      naturalPacing: true,
    },
    voiceSettings: {
      pitchAdjustment: 1.05, // Slightly higher for friendliness
      rateAdjustment: 1.0, // Normal pace
      volumeAdjustment: 1.0,
    },
    examples: [
      'Parfait pour les blogues et articles personnels',
      'Idéal pour les podcasts et discussions',
      'Excellent pour le contenu conversationnel',
    ],
    sampleText: 'Salut! Bienvenue sur mon balado. Aujourd\'hui, on va parler d\'un sujet super intéressant. Installez-vous confortablement et profitez de l\'émission!',
  },
  {
    id: 'dramatique',
    name: 'Dramatic',
    nameFr: 'Dramatique',
    description: 'Expressive, audiobook narrator style',
    descriptionFr: 'Voix expressive et théâtrale, style narrateur de livre audio',
    icon: 'book-open',
    prosodySettings: {
      enabled: true,
      intensity: 0.9, // High prosody for dramatic effect
      pauseMultiplier: 1.3, // Longer pauses for drama
      emphasisDetection: true,
      breathingSounds: true,
      naturalPacing: true,
    },
    voiceSettings: {
      pitchAdjustment: 1.0,
      rateAdjustment: 0.9, // Slower for dramatic effect
      volumeAdjustment: 1.05,
    },
    examples: [
      'Parfait pour les romans et la fiction',
      'Idéal pour la poésie et les textes littéraires',
      'Excellent pour les histoires captivantes',
    ],
    sampleText: 'Il était une fois... dans une contrée lointaine... un héros qui allait changer le destin de son peuple. Son voyage commençait maintenant.',
  },
  {
    id: 'decontracte',
    name: 'Casual',
    nameFr: 'Décontracté',
    description: 'Casual, Quebec colloquial style',
    descriptionFr: 'Voix décontractée, style québécois familier',
    icon: 'smile',
    prosodySettings: {
      enabled: true,
      intensity: 0.6,
      pauseMultiplier: 0.9, // Shorter pauses for casual flow
      emphasisDetection: true,
      breathingSounds: false,
      naturalPacing: true,
    },
    voiceSettings: {
      pitchAdjustment: 1.1, // Higher for casual tone
      rateAdjustment: 1.1, // Faster for casual conversation
      volumeAdjustment: 1.0,
    },
    examples: [
      'Idéal pour le contenu informel et léger',
      'Parfait pour les messages personnels',
      'Excellent pour un ton détendu et amical',
    ],
    sampleText: 'Hey! Ça va bien? J\'ai une histoire vraiment cool à te raconter. Tu vas adorer ça, c\'est ben l\'fun!',
  },
];

/**
 * Get voice profile by ID
 */
export function getVoiceProfile(id: VoicePersonality): VoiceProfile | undefined {
  return canadianFrenchVoiceProfiles.find(profile => profile.id === id);
}

/**
 * Get all voice profiles
 */
export function getAllVoiceProfiles(): VoiceProfile[] {
  return canadianFrenchVoiceProfiles;
}

/**
 * Get recommended voice profile based on text content
 */
export function getRecommendedProfile(text: string): VoicePersonality {
  const lowerText = text.toLowerCase();

  // Check for formal/professional indicators
  const formalWords = ['gouvernement', 'économie', 'politique', 'rapport', 'analyse', 'étude', 'recherche'];
  const formalCount = formalWords.filter(word => lowerText.includes(word)).length;

  // Check for casual indicators
  const casualWords = ['hey', 'salut', 'cool', 'fun', 'ben', 'icitte', 'là'];
  const casualCount = casualWords.filter(word => lowerText.includes(word)).length;

  // Check for dramatic indicators
  const dramaticWords = ['histoire', 'fois', 'héros', 'destin', 'voyage', 'mystère', 'aventure'];
  const dramaticCount = dramaticWords.filter(word => lowerText.includes(word)).length;

  // Determine profile
  if (formalCount >= 2) return 'professionnel';
  if (casualCount >= 2) return 'decontracte';
  if (dramaticCount >= 2) return 'dramatique';

  // Check for questions (conversational)
  if ((text.match(/\?/g) || []).length >= 2) return 'conversationnel';

  // Default to conversational for most content
  return 'conversationnel';
}

/**
 * Apply voice profile settings to base voice settings
 */
export function applyVoiceProfile(
  baseSettings: { pitch: number; rate: number; volume: number },
  profile: VoiceProfile
): { pitch: number; rate: number; volume: number } {
  return {
    pitch: Math.max(0.5, Math.min(2.0, baseSettings.pitch * profile.voiceSettings.pitchAdjustment)),
    rate: Math.max(0.5, Math.min(2.0, baseSettings.rate * profile.voiceSettings.rateAdjustment)),
    volume: Math.max(0, Math.min(1, baseSettings.volume * profile.voiceSettings.volumeAdjustment)),
  };
}
