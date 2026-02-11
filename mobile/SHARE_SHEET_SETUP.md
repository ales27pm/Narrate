# Share Sheet Configuration

This document contains the configuration needed to enable Share Sheet functionality for the Narrator app.

## What is Share Sheet?

Share Sheet allows users to share content from other apps (Safari, Chrome, News, Messages, etc.) directly into the Narrator app without copy-pasting. When a user taps "Share" in any app and selects Narrator, the content will automatically load into the text field.

## Implementation Status

✅ Deep linking handler created (`src/lib/share-handler.ts`)
✅ Narrator store updated to handle shared content
✅ Root layout configured to listen for deep links
✅ Narrator screen updated to load shared content automatically

## Required Configuration

### Step 1: Update app.json

Since `app.json` is a protected file, you'll need to manually add the following configuration:

**Replace the entire `app.json` with this updated version:**

```json
{
  "expo": {
    "name": "vibecode",
    "slug": "vibecode",
    "scheme": "vibecode",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.vibecode.app",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["vibecode"],
            "CFBundleURLName": "com.vibecode.app"
          }
        ]
      }
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "package": "com.vibecode.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "vibecode",
              "host": "share"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        },
        {
          "action": "SEND",
          "category": ["DEFAULT"],
          "data": [
            {
              "mimeType": "text/plain"
            }
          ]
        }
      ]
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### Key Changes Explained:

1. **iOS Configuration (`ios` section):**
   - Added `bundleIdentifier` for proper app identification
   - Added `CFBundleURLTypes` to register the custom URL scheme `vibecode://`
   - This allows the app to receive shared content via URLs like `vibecode://share?text=...`

2. **Android Configuration (`android` section):**
   - Added `package` name for app identification
   - Added `intentFilters` to handle:
     - Custom URL scheme (`vibecode://share`)
     - Native Android share intents (SEND action with text/plain MIME type)
   - The `SEND` intent filter makes the app appear in Android's native share menu

## How It Works

### For iOS:
1. User shares text or URL from Safari (or any app)
2. User selects "Narrator" from the share sheet
3. iOS opens the app with a deep link: `vibecode://share?text=...&url=...`
4. The app's root layout catches the deep link
5. Content is processed and loaded into the narrator screen
6. User can immediately start narration

### For Android:
1. User taps "Share" in any app
2. "Narrator" appears in the share menu
3. Android sends an intent with the shared content
4. The app processes the content via the URL scheme handler
5. Content loads into the narrator screen automatically

## Testing the Share Sheet

### On iOS Simulator:
1. Open Safari in the simulator
2. Navigate to any article or website
3. Tap the Share button
4. Look for "Narrator" in the share options
5. Select it and verify content loads

### On Android Emulator:
1. Open Chrome browser
2. Navigate to any article
3. Tap the three-dot menu → Share
4. Look for "Narrator" in the share options
5. Select it and verify content loads

### Fallback Testing (if Share Sheet not available yet):
You can test the deep linking manually by opening URLs in the browser:

```
vibecode://share?text=Hello%20World
vibecode://share?url=https://example.com
vibecode://share?text=My%20article&url=https://example.com&title=Example%20Article
```

## URL Scheme Format

The app accepts deep links in the following format:

```
vibecode://share?text={TEXT}&url={URL}&title={TITLE}
```

**Parameters:**
- `text` - Plain text content to narrate
- `url` - Web URL to fetch and narrate (will be fetched automatically)
- `title` - Optional title for the content

**Examples:**
- Share plain text: `vibecode://share?text=This%20is%20my%20text`
- Share URL: `vibecode://share?url=https://example.com/article`
- Share both: `vibecode://share?text=Check%20this%20out&url=https://example.com&title=Cool%20Article`

## Troubleshooting

### Share Sheet not appearing:
1. Verify `app.json` changes were applied correctly
2. Rebuild the app completely (Expo Go won't support this - needs dev build or production build)
3. Check that bundle identifier/package name is unique

### Content not loading:
1. Check the app logs for errors
2. Verify the deep link format is correct
3. Make sure the URL is accessible from the device

### iOS Share Extension not working:
- Share extensions require a production build with proper provisioning profiles
- They won't work in Expo Go
- Use `eas build` to create a development or production build

### Android Share Intent not working:
- Verify the intent filters in `app.json` are correct
- Rebuild the app after changing `app.json`
- Check Android logcat for intent errors

## Next Steps

After updating `app.json`:

1. **For Development:**
   - Stop the current dev server
   - Clear any caches: `rm -rf node_modules/.cache`
   - Restart the app
   - For native builds, create a new development build with `eas build --profile development`

2. **For Testing:**
   - Test with Safari, Chrome, Messages, News, and other apps
   - Verify both text and URL sharing work correctly
   - Test the automatic URL fetching feature

3. **For Production:**
   - The Share Sheet will work best in production builds
   - Submit the app to app stores with the updated configuration

## Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
