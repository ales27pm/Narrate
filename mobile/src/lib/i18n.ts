/**
 * i18n Translations
 * Simple internationalization for English, French (France), and Canadian French
 */

export type AppLanguage = 'en' | 'fr-FR' | 'fr-CA';

export interface Translations {
  // App Title
  appName: string;

  // Settings Screen
  settings: string;
  customizeNarration: string;
  language: string;
  pitch: string;
  speed: string;
  volume: string;
  lower: string;
  higher: string;
  slower: string;
  faster: string;
  quiet: string;
  loud: string;
  voiceSelection: string;
  enhancedQualityVoices: string;
  testVoice: string;
  contentExtraction: string;
  configureExtraction: string;
  clipboardMonitoring: string;
  clipboardDescription: string;
  autoFetchURLs: string;
  autoFetchDescription: string;
  ocrLanguage: string;
  ocrLanguageDescription: string;
  appLanguage: string;
  appLanguageDescription: string;

  // Languages
  english: string;
  englishUS: string;
  englishUK: string;
  frenchFrance: string;
  frenchCanadian: string;
  spanish: string;
  german: string;
  italian: string;
  japanese: string;
  korean: string;
  chinese: string;

  // Test voice sample
  testVoiceSample: string;

  // Categories
  personal: string;
  fiction: string;
  poetry: string;
  article: string;
  other: string;

  // Common actions
  start: string;
  stop: string;
  pause: string;
  resume: string;
  save: string;
  delete: string;
  cancel: string;

  // Story list
  stories: string;
  noStories: string;
  addStory: string;

  // Narration
  narrator: string;
  startNarration: string;
  stopNarration: string;
  pauseNarration: string;
  resumeNarration: string;
}

export const translations: Record<AppLanguage, Translations> = {
  en: {
    appName: 'Narrator',
    settings: 'Settings',
    customizeNarration: 'Customize your narration experience',
    language: 'Language',
    pitch: 'Pitch',
    speed: 'Speed',
    volume: 'Volume',
    lower: 'Lower',
    higher: 'Higher',
    slower: 'Slower',
    faster: 'Faster',
    quiet: 'Quiet',
    loud: 'Loud',
    voiceSelection: 'Voice Selection',
    enhancedQualityVoices: 'Enhanced quality voices for natural narration',
    testVoice: 'Test Voice',
    contentExtraction: 'Content Extraction',
    configureExtraction: 'Configure how content is extracted',
    clipboardMonitoring: 'Clipboard Monitoring',
    clipboardDescription: 'Auto-detect URLs copied to clipboard',
    autoFetchURLs: 'Auto-Fetch URLs',
    autoFetchDescription: 'Automatically fetch content when URL detected',
    ocrLanguage: 'OCR Language',
    ocrLanguageDescription: 'Select language for image text recognition',
    appLanguage: 'App Language',
    appLanguageDescription: 'Choose your preferred language',
    english: 'English',
    englishUS: 'English (US)',
    englishUK: 'English (UK)',
    frenchFrance: 'French (France)',
    frenchCanadian: 'French (Canada)',
    spanish: 'Spanish',
    german: 'German',
    italian: 'Italian',
    japanese: 'Japanese',
    korean: 'Korean',
    chinese: 'Chinese',
    testVoiceSample: 'Hello! This is how I will sound when reading your stories. The narrator uses natural pauses and intonation for a more human-like experience.',
    personal: 'Personal',
    fiction: 'Fiction',
    poetry: 'Poetry',
    article: 'Article',
    other: 'Other',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    stories: 'Stories',
    noStories: 'No stories yet',
    addStory: 'Add Story',
    narrator: 'Narrator',
    startNarration: 'Start Narration',
    stopNarration: 'Stop Narration',
    pauseNarration: 'Pause Narration',
    resumeNarration: 'Resume Narration',
  },
  'fr-FR': {
    appName: 'Narrateur',
    settings: 'Paramètres',
    customizeNarration: 'Personnalisez votre expérience de narration',
    language: 'Langue',
    pitch: 'Tonalité',
    speed: 'Vitesse',
    volume: 'Volume',
    lower: 'Plus grave',
    higher: 'Plus aigu',
    slower: 'Plus lent',
    faster: 'Plus rapide',
    quiet: 'Silencieux',
    loud: 'Fort',
    voiceSelection: 'Sélection de la voix',
    enhancedQualityVoices: 'Voix de qualité supérieure pour une narration naturelle',
    testVoice: 'Tester la voix',
    contentExtraction: 'Extraction de contenu',
    configureExtraction: 'Configurer comment le contenu est extrait',
    clipboardMonitoring: 'Surveillance du presse-papiers',
    clipboardDescription: 'Détecter automatiquement les URL copiées dans le presse-papiers',
    autoFetchURLs: 'Récupération automatique des URL',
    autoFetchDescription: 'Récupérer automatiquement le contenu lorsque l\'URL est détectée',
    ocrLanguage: 'Langue OCR',
    ocrLanguageDescription: 'Sélectionner la langue pour la reconnaissance de texte dans les images',
    appLanguage: 'Langue de l\'application',
    appLanguageDescription: 'Choisissez votre langue préférée',
    english: 'Anglais',
    englishUS: 'Anglais (États-Unis)',
    englishUK: 'Anglais (Royaume-Uni)',
    frenchFrance: 'Français (France)',
    frenchCanadian: 'Français (Canada)',
    spanish: 'Espagnol',
    german: 'Allemand',
    italian: 'Italien',
    japanese: 'Japonais',
    korean: 'Coréen',
    chinese: 'Chinois',
    testVoiceSample: 'Bonjour ! Voici comment je sonnerai en lisant vos histoires. Le narrateur utilise des pauses naturelles et une intonation pour une expérience plus humaine.',
    personal: 'Personnel',
    fiction: 'Fiction',
    poetry: 'Poésie',
    article: 'Article',
    other: 'Autre',
    start: 'Démarrer',
    stop: 'Arrêter',
    pause: 'Pause',
    resume: 'Reprendre',
    save: 'Enregistrer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    stories: 'Histoires',
    noStories: 'Aucune histoire pour le moment',
    addStory: 'Ajouter une histoire',
    narrator: 'Narrateur',
    startNarration: 'Démarrer la narration',
    stopNarration: 'Arrêter la narration',
    pauseNarration: 'Mettre en pause la narration',
    resumeNarration: 'Reprendre la narration',
  },
  'fr-CA': {
    appName: 'Narrateur',
    settings: 'Paramètres',
    customizeNarration: 'Personnalisez votre expérience de narration',
    language: 'Langue',
    pitch: 'Tonalité',
    speed: 'Vitesse',
    volume: 'Volume',
    lower: 'Plus grave',
    higher: 'Plus aigu',
    slower: 'Plus lent',
    faster: 'Plus rapide',
    quiet: 'Silencieux',
    loud: 'Fort',
    voiceSelection: 'Sélection de la voix',
    enhancedQualityVoices: 'Voix de qualité supérieure pour une narration naturelle',
    testVoice: 'Tester la voix',
    contentExtraction: 'Extraction de contenu',
    configureExtraction: 'Configurer comment le contenu est extrait',
    clipboardMonitoring: 'Surveillance du presse-papiers',
    clipboardDescription: 'Détecter automatiquement les URL copiés dans le presse-papiers',
    autoFetchURLs: 'Récupération automatique des URL',
    autoFetchDescription: 'Récupérer automatiquement le contenu lorsque l\'URL est détecté',
    ocrLanguage: 'Langue OCR',
    ocrLanguageDescription: 'Sélectionner la langue pour la reconnaissance de texte dans les images',
    appLanguage: 'Langue de l\'application',
    appLanguageDescription: 'Choisissez votre langue préférée',
    english: 'Anglais',
    englishUS: 'Anglais (États-Unis)',
    englishUK: 'Anglais (Royaume-Uni)',
    frenchFrance: 'Français (France)',
    frenchCanadian: 'Français (Canada)',
    spanish: 'Espagnol',
    german: 'Allemand',
    italian: 'Italien',
    japanese: 'Japonais',
    korean: 'Coréen',
    chinese: 'Chinois',
    testVoiceSample: 'Allô ! Voici comment je vais sonner en lisant tes histoires. Le narrateur utilise des pauses naturelles et une intonation pour une expérience plus humaine.',
    personal: 'Personnel',
    fiction: 'Fiction',
    poetry: 'Poésie',
    article: 'Article',
    other: 'Autre',
    start: 'Démarrer',
    stop: 'Arrêter',
    pause: 'Pause',
    resume: 'Reprendre',
    save: 'Enregistrer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    stories: 'Histoires',
    noStories: 'Aucune histoire pour l\'instant',
    addStory: 'Ajouter une histoire',
    narrator: 'Narrateur',
    startNarration: 'Démarrer la narration',
    stopNarration: 'Arrêter la narration',
    pauseNarration: 'Mettre en pause la narration',
    resumeNarration: 'Reprendre la narration',
  },
};

/**
 * Get translations for a specific language
 */
export function getTranslations(language: AppLanguage): Translations {
  return translations[language] || translations.en;
}

/**
 * Hook to use translations in components
 */
export function useTranslations(language: AppLanguage) {
  return getTranslations(language);
}
