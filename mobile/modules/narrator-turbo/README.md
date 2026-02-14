# Narrator TurboModule

Advanced on-device text-to-speech module using React Native's New Architecture and TurboModules.

## Features

### iOS (AVSpeechSynthesizer)
- ✅ Neural/Premium voices (Apple's high-quality TTS)
- ✅ Real-time word boundary events for word-by-word highlighting
- ✅ Pause/Resume support
- ✅ Audio session management (background playback, audio ducking)
- ✅ Multiple voice qualities (default, enhanced, premium)
- ✅ Bluetooth audio support
- ✅ Full pitch, rate, and volume control

### Android (TextToSpeech)
- ✅ Native Android TTS engine
- ✅ Word boundary events (Android 8.0+)
- ✅ Audio focus management
- ✅ Multiple voice qualities
- ✅ Full pitch, rate, and volume control
- ⚠️ No native pause/resume (Android TTS limitation)

## Installation

### 1. Link the module in your app

Add to your `package.json`:

```json
{
  "dependencies": {
    "narrator-turbo-module": "file:./modules/narrator-turbo"
  }
}
```

Run:
```bash
bun install
```

### 2. iOS Setup

Add the module to your Podfile:

```ruby
pod 'NarratorTurboModule', :path => '../modules/narrator-turbo'
```

Create a Podspec file at `modules/narrator-turbo/narrator-turbo-module.podspec`:

```ruby
require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NarratorTurboModule"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/vibecode/narrator-turbo.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"
  s.swift_version = "5.0"
end
```

Run:
```bash
cd ios && pod install && cd ..
```

### 3. Android Setup

Add to `android/settings.gradle`:

```gradle
include ':narrator-turbo-module'
project(':narrator-turbo-module').projectDir = new File(rootProject.projectDir, '../modules/narrator-turbo/android')
```

Add to `android/app/build.gradle`:

```gradle
dependencies {
    implementation project(':narrator-turbo-module')
}
```

Register the package in `MainApplication.kt`:

```kotlin
import com.narratorturbo.NarratorTurboPackage

override fun getPackages(): List<ReactPackage> {
    return PackageList(this).packages.apply {
        add(NarratorTurboPackage())
    }
}
```

### 4. Enable New Architecture

In `android/gradle.properties`:
```properties
newArchEnabled=true
```

In `ios/Podfile`:
```ruby
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

Rebuild:
```bash
# iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..
```

## Usage

### Basic Usage

```typescript
import { NativeSpeechTurbo } from 'narrator-turbo-module';

// Speak text
await NativeSpeechTurbo.speak('Hello, this is a test', {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
});

// Stop
await NativeSpeechTurbo.stop();

// Pause (iOS only)
await NativeSpeechTurbo.pause();

// Resume (iOS only)
await NativeSpeechTurbo.resume();

// Check if speaking
const status = await NativeSpeechTurbo.isSpeaking();
console.log(status.isSpeaking, status.isPaused);
```

### Real-time Word Highlighting

```typescript
import { NativeSpeechTurbo } from 'narrator-turbo-module';
import { useEffect, useState } from 'react';

function NarratorComponent() {
  const [currentWord, setCurrentWord] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    // Listen for word boundary events
    const unsubscribe = NativeSpeechTurbo.onWordBoundary((event) => {
      setCurrentWord(event.word);
      setCurrentWordIndex(event.charIndex);
      console.log(`Speaking: "${event.word}" at position ${event.charIndex}`);
    });

    return () => unsubscribe();
  }, []);

  const startNarration = async () => {
    await NativeSpeechTurbo.speak('The quick brown fox jumps over the lazy dog', {
      language: 'en-US',
      rate: 1.0,
    });
  };

  return (
    <View>
      <Text>Current word: {currentWord}</Text>
      <Button title="Start" onPress={startNarration} />
    </View>
  );
}
```

### Voice Selection

```typescript
// Get available voices
const { voices } = await NativeSpeechTurbo.getAvailableVoices('en-US');

console.log('Available voices:');
voices.forEach((voice) => {
  console.log(`${voice.name} (${voice.quality})`);
});

// Speak with a specific voice
await NativeSpeechTurbo.speak('Hello with custom voice', {
  voiceIdentifier: voices[0].identifier,
});
```

### Audio Configuration (iOS)

```typescript
// Configure audio session for background playback with ducking
await NativeSpeechTurbo.setAudioCategory({
  category: 'playback',
  mode: 'spokenAudio',
  options: ['duckOthers', 'allowBluetooth', 'allowBluetoothA2DP'],
});
```

### Event Listeners

```typescript
// Speech lifecycle events
const unsubStart = NativeSpeechTurbo.onSpeechStart((event) => {
  console.log('Speech started:', event.utteranceId);
});

const unsubEnd = NativeSpeechTurbo.onSpeechEnd((event) => {
  console.log('Speech ended:', event.utteranceId);
  if (event.cancelled) {
    console.log('Was cancelled');
  }
});

const unsubError = NativeSpeechTurbo.onSpeechError((event) => {
  console.error('Speech error:', event.error);
});

// Clean up
useEffect(() => {
  return () => {
    unsubStart();
    unsubEnd();
    unsubError();
  };
}, []);
```

## API Reference

### Methods

#### `speak(text: string, options?: SpeechOptions): Promise<{ success: boolean; utteranceId: string }>`

Speak text with options.

**Options:**
- `language?: string` - Language code (default: 'en-US')
- `pitch?: number` - Voice pitch 0.5-2.0 (default: 1.0)
- `rate?: number` - Speech rate 0.1-2.0 (default: 1.0)
- `volume?: number` - Volume 0.0-1.0 (default: 1.0)
- `voiceIdentifier?: string` - Specific voice ID from `getAvailableVoices()`

#### `stop(): Promise<{ success: boolean }>`

Stop current speech immediately.

#### `pause(): Promise<{ success: boolean; paused?: boolean }>`

Pause current speech (iOS only).

#### `resume(): Promise<{ success: boolean; resumed?: boolean }>`

Resume paused speech (iOS only).

#### `isSpeaking(): Promise<{ isSpeaking: boolean; isPaused: boolean }>`

Check current speech status.

#### `getAvailableVoices(language?: string): Promise<{ voices: Voice[] }>`

Get available voices, optionally filtered by language.

#### `setAudioCategory(config: AudioCategoryOptions): Promise<{ success: boolean }>`

Configure audio session (iOS only).

### Events

#### `onWordBoundary(callback: (event: WordBoundaryEvent) => void): () => void`

Called when each word starts being spoken.

**Event data:**
- `utteranceId: string`
- `word: string` - Current word
- `charIndex: number` - Character position in text
- `charLength: number` - Length of the word
- `wordIndex?: number` - Word index (iOS only)

#### `onSpeechStart(callback: (event: SpeechEvent) => void): () => void`

Called when speech starts.

#### `onSpeechEnd(callback: (event: SpeechEvent) => void): () => void`

Called when speech ends.

#### `onSpeechError(callback: (event: SpeechEvent) => void): () => void`

Called on speech errors.

#### `onSpeechPause(callback: (event: SpeechEvent) => void): () => void`

Called when speech is paused (iOS only).

#### `onSpeechResume(callback: (event: SpeechEvent) => void): () => void`

Called when speech is resumed (iOS only).

## Comparison: TurboModule vs expo-speech

| Feature | TurboModule | expo-speech |
|---------|-------------|-------------|
| Word-level callbacks | ✅ Real-time | ❌ No |
| Audio session control | ✅ Full control | ⚠️ Limited |
| Voice quality selection | ✅ Premium/Neural | ⚠️ Basic |
| Background playback | ✅ Full support | ⚠️ Limited |
| Pause/Resume | ✅ iOS native | ✅ Both platforms |
| Performance | ⚠️ Requires native compile | ✅ Pre-compiled |
| Setup complexity | ⚠️ High | ✅ Zero config |

## Platform Differences

### iOS
- Uses AVSpeechSynthesizer
- Supports Neural/Premium voices (Siri-quality)
- Full pause/resume support
- Advanced audio session management
- Real-time word boundary callbacks

### Android
- Uses TextToSpeech API
- Supports Google TTS voices
- No native pause/resume (requires custom implementation)
- Basic audio focus management
- Word boundary callbacks on Android 8.0+

## Troubleshooting

### iOS: Module not found
1. Ensure Podfile includes the module
2. Run `pod install` in the ios directory
3. Clean build folder in Xcode

### Android: Compilation errors
1. Check Kotlin version compatibility
2. Ensure `newArchEnabled=true` in gradle.properties
3. Run `./gradlew clean` in android directory

### No word boundary events
- iOS: Should work on all versions
- Android: Requires Android 8.0+ (API level 26)

## License

MIT
