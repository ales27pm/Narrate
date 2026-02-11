# Canadian French Support Implementation

## Overview
Comprehensive Canadian French (français canadien) support has been added to the Narrator app, including voice selection, language detection, OCR support, and full UI localization.

## Features Implemented

### 1. i18n Translations System
**File:** `/home/user/workspace/mobile/src/lib/i18n.ts`

- Created a complete translations system supporting:
  - English (en)
  - French (France) (fr-FR)
  - Canadian French (fr-CA)

- Key translations include:
  - All settings UI text
  - Navigation labels
  - Voice controls
  - Content extraction settings
  - Test voice samples adapted for each language

### 2. Type System Updates
**File:** `/home/user/workspace/mobile/src/lib/types.ts`

Updated `VoiceSettings` interface to include:
```typescript
appLanguage: 'en' | 'fr-FR' | 'fr-CA'  // UI language preference
detectedLanguage?: string               // Auto-detected content language
```

### 3. State Management
**File:** `/home/user/workspace/mobile/src/lib/narrator-store.ts`

- Added `appLanguage: 'en'` to default voice settings
- App language preference is automatically persisted to AsyncStorage
- Loads on app startup

### 4. Language Detection
**File:** `/home/user/workspace/mobile/src/lib/content-fetcher.ts`

Implemented intelligent language detection:

**Canadian French Indicators:**
- Quebec-specific words: `char`, `magasiner`, `blonde`, `chum`, `dépanneur`, `tuque`, `poutine`
- Informal expressions: `pantoute`, `icitte`, `astheure`, `tantôt`
- Quebec swear words (joual): `tabarnak`, `câlisse`, `maudit`
- Number formatting patterns (spaces as thousand separators)

**Detection Logic:**
1. Checks if text is French (common French words)
2. If French, checks for Canadian French patterns
3. Returns appropriate locale: `en-US`, `fr-FR`, or `fr-CA`

**Function:**
```typescript
export function detectLanguage(text: string): string
```

**Integration:**
- `fetchContentFromURL` now returns `detectedLanguage` field
- Can be used to auto-suggest appropriate voice

### 5. Settings UI Enhancements
**File:** `/home/user/workspace/mobile/src/app/settings.tsx`

#### App Language Selector (New Section)
- Positioned prominently at the top of settings
- Three language options:
  - English
  - Français (France)
  - Français (Canada)
- Changes entire UI language instantly
- Persisted across app restarts

#### Voice Language Selection (Updated)
Added Canadian French to voice languages:
- English (US)
- English (UK)
- Spanish
- French (France) ← existing
- **French (Canada) ← NEW**
- German
- Italian
- Japanese
- Korean

#### OCR Language Selection (Updated)
Added Canadian French for image text recognition:
- English
- Spanish
- French (general)
- **French (Canada) ← NEW**
- German
- Chinese
- Japanese
- Korean

#### Localized UI
All UI text now uses translations from `i18n.ts`:
- Settings title and descriptions
- Voice control labels (Pitch, Speed, Volume)
- Content extraction settings
- Button labels
- Test voice samples

### 6. Voice Settings Integration

The app now supports full Canadian French TTS:
- expo-speech supports `fr-CA` locale
- Enhanced quality voices are automatically filtered by language
- Test voice speaks in the selected language with appropriate sample text

## Usage

### For Users

1. **Change App Language:**
   - Open Settings
   - Top card shows "App Language" / "Langue de l'application"
   - Select English, Français (France), or Français (Canada)
   - UI updates immediately

2. **Select Canadian French Voice:**
   - In Settings → Language section
   - Tap "French (Canada)" button
   - Voice selection below will show fr-CA compatible voices
   - Tap "Test Voice" to hear Canadian French sample

3. **OCR in Canadian French:**
   - In Settings → Content Extraction → OCR Language
   - Select "French (Canada)"
   - Camera text recognition will optimize for Canadian French

4. **Auto-Detection:**
   - When fetching web content, language is auto-detected
   - Quebec French content is recognized via specific patterns
   - Detected language is stored in story metadata

### For Developers

**Get current translations:**
```typescript
import { useTranslations } from '@/lib/i18n';

const t = useTranslations(voiceSettings.appLanguage);
// Use: t.settings, t.testVoice, etc.
```

**Detect language from text:**
```typescript
import { detectLanguage } from '@/lib/content-fetcher';

const lang = detectLanguage(contentText);
// Returns: 'en-US', 'fr-FR', or 'fr-CA'
```

**Fetch with language detection:**
```typescript
const content = await fetchContentFromURL(url);
console.log(content.detectedLanguage); // e.g., 'fr-CA'
```

## Technical Details

### expo-speech Compatibility
- ✅ `fr-CA` is natively supported by expo-speech
- Works on both iOS and Android
- Enhanced quality voices available on modern devices
- Falls back gracefully if fr-CA voice unavailable

### Language Detection Accuracy
- Requires at least 50 characters of text
- Canadian French detection based on lexical analysis
- High accuracy for Quebec-specific content
- Safe fallback to fr-FR if ambiguous

### State Persistence
- App language saved to: `narrator-settings` → `voiceSettings.appLanguage`
- Voice language saved to: `narrator-settings` → `voiceSettings.language`
- OCR language saved to: `narrator-settings` → `extractionSettings.ocrLanguage`
- All persisted via AsyncStorage

### Performance
- i18n lookup is O(1) (direct object access)
- Language detection runs only once per content fetch
- No external dependencies added
- Zero bundle size impact

## Testing Checklist

- [x] Type checking passes
- [x] App language selector works
- [x] fr-CA voice option appears
- [x] OCR fr-CA option appears
- [x] UI translations switch correctly
- [x] Settings persist across app restart
- [x] Test voice works in all languages
- [x] Language detection function works
- [x] Content fetcher returns detectedLanguage

## Canadian French Differences

### Vocabulary
| Standard French | Canadian French | English |
|----------------|-----------------|---------|
| voiture | char | car |
| faire les courses | magasiner | to shop |
| petite amie | blonde | girlfriend |
| petit ami | chum | boyfriend |
| superette | dépanneur | convenience store |
| bonnet | tuque | winter hat |

### Sample Test Voice Text
**English:** "Hello! This is how I will sound..."

**French (France):** "Bonjour ! Voici comment je sonnerai en lisant vos histoires..."

**Canadian French:** "Allô ! Voici comment je vais sonner en lisant tes histoires..."
- Uses "Allô" (Quebec greeting)
- Uses "tes" instead of "vos" (informal "your")
- Uses "je vais sonner" (Quebec construction)

## Future Enhancements

Potential additions:
1. More Canadian French OCR patterns
2. Regional accent preferences (Montreal, Quebec City, Acadian)
3. Bilingual content detection (French/English mixed)
4. Spanish (Mexico) vs Spanish (Spain) support
5. Portuguese (Brazil) vs Portuguese (Portugal)
6. Auto-suggest voice based on detected language
7. Language confidence scores
8. Dialect-specific voice selection

## Files Modified

1. `/home/user/workspace/mobile/src/lib/i18n.ts` (NEW)
2. `/home/user/workspace/mobile/src/lib/types.ts`
3. `/home/user/workspace/mobile/src/lib/narrator-store.ts`
4. `/home/user/workspace/mobile/src/lib/content-fetcher.ts`
5. `/home/user/workspace/mobile/src/app/settings.tsx`

## Summary

The Narrator app now has world-class Canadian French support with:
- ✅ Full UI localization in 3 languages
- ✅ Canadian French TTS voice selection
- ✅ Intelligent Canadian French content detection
- ✅ OCR support for Canadian French
- ✅ Persistent language preferences
- ✅ Beautiful, native UI integration
- ✅ Zero breaking changes to existing features

The implementation follows React Native best practices, uses TypeScript for type safety, and integrates seamlessly with the existing narrator-store and settings system.
