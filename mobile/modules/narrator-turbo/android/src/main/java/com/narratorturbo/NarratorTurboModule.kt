package com.narratorturbo

import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.*

class NarratorTurboModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var currentUtteranceId: String? = null

    companion object {
        const val NAME = "NarratorTurboModule"
        private const val EVENT_WORD_BOUNDARY = "onWordBoundary"
        private const val EVENT_SPEECH_START = "onSpeechStart"
        private const val EVENT_SPEECH_END = "onSpeechEnd"
        private const val EVENT_SPEECH_ERROR = "onSpeechError"
        private const val EVENT_SPEECH_PAUSE = "onSpeechPause"
        private const val EVENT_SPEECH_RESUME = "onSpeechResume"
    }

    init {
        tts = TextToSpeech(reactContext, this)
        audioManager = reactContext.getSystemService(android.content.Context.AUDIO_SERVICE) as AudioManager
    }

    override fun getName(): String = NAME

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            setupUtteranceProgressListener()
        }
    }

    private fun setupUtteranceProgressListener() {
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {
                sendEvent(EVENT_SPEECH_START, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                })
            }

            override fun onDone(utteranceId: String?) {
                sendEvent(EVENT_SPEECH_END, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                })
                currentUtteranceId = null
                abandonAudioFocus()
            }

            @Deprecated("Deprecated in Java")
            override fun onError(utteranceId: String?) {
                sendEvent(EVENT_SPEECH_ERROR, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                    putString("error", "Speech synthesis error")
                })
                currentUtteranceId = null
                abandonAudioFocus()
            }

            override fun onError(utteranceId: String?, errorCode: Int) {
                sendEvent(EVENT_SPEECH_ERROR, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                    putString("error", getErrorMessage(errorCode))
                    putInt("errorCode", errorCode)
                })
                currentUtteranceId = null
                abandonAudioFocus()
            }

            override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) {
                // Word boundary event
                sendEvent(EVENT_WORD_BOUNDARY, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                    putInt("charIndex", start)
                    putInt("charLength", end - start)
                })
            }

            override fun onStop(utteranceId: String?, interrupted: Boolean) {
                sendEvent(EVENT_SPEECH_END, Arguments.createMap().apply {
                    putString("utteranceId", utteranceId)
                    putBoolean("interrupted", interrupted)
                })
                currentUtteranceId = null
                abandonAudioFocus()
            }
        })
    }

    private fun getErrorMessage(errorCode: Int): String {
        return when (errorCode) {
            TextToSpeech.ERROR_SYNTHESIS -> "Synthesis error"
            TextToSpeech.ERROR_SERVICE -> "Service error"
            TextToSpeech.ERROR_OUTPUT -> "Output error"
            TextToSpeech.ERROR_NETWORK -> "Network error"
            TextToSpeech.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            TextToSpeech.ERROR_INVALID_REQUEST -> "Invalid request"
            TextToSpeech.ERROR_NOT_INSTALLED_YET -> "TTS not installed yet"
            else -> "Unknown error"
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun requestAudioFocus(): Boolean {
        audioManager?.let { am ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()

                audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                    .setAudioAttributes(audioAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener { }
                    .build()

                return am.requestAudioFocus(audioFocusRequest!!) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
            } else {
                @Suppress("DEPRECATION")
                return am.requestAudioFocus(
                    { },
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
                ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
            }
        }
        return false
    }

    private fun abandonAudioFocus() {
        audioManager?.let { am ->
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
            } else {
                @Suppress("DEPRECATION")
                am.abandonAudioFocus { }
            }
        }
    }

    @ReactMethod
    fun speak(
        text: String,
        language: String,
        pitch: Double,
        rate: Double,
        volume: Double,
        voiceIdentifier: String?,
        promise: Promise
    ) {
        if (!isInitialized) {
            promise.reject("NOT_INITIALIZED", "TextToSpeech not initialized")
            return
        }

        try {
            // Stop any ongoing speech
            tts?.stop()

            // Set language
            val locale = Locale.forLanguageTag(language)
            val result = tts?.setLanguage(locale)

            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                promise.reject("LANGUAGE_NOT_SUPPORTED", "Language $language is not supported")
                return
            }

            // Set voice if specified
            if (!voiceIdentifier.isNullOrEmpty()) {
                val voices = tts?.voices
                val voice = voices?.find { it.name == voiceIdentifier }
                if (voice != null) {
                    tts?.voice = voice
                }
            }

            // Set speech parameters
            tts?.setPitch(pitch.toFloat())
            tts?.setSpeechRate(rate.toFloat())

            // Request audio focus
            requestAudioFocus()

            // Generate utterance ID
            val utteranceId = UUID.randomUUID().toString()
            currentUtteranceId = utteranceId

            // Create parameters bundle
            val params = Bundle()
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume.toFloat())

            // Speak with word-level timing if available (Android 8.0+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            } else {
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, params)
            }

            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("utteranceId", utteranceId)
            })
        } catch (e: Exception) {
            promise.reject("SPEAK_ERROR", "Failed to speak: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            tts?.stop()
            currentUtteranceId = null
            abandonAudioFocus()
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
            })
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop: ${e.message}", e)
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        // Android TTS doesn't support pause/resume natively
        // This would require custom implementation with audio queue
        promise.resolve(Arguments.createMap().apply {
            putBoolean("success", false)
            putString("message", "Pause not supported on Android")
        })
    }

    @ReactMethod
    fun resume(promise: Promise) {
        // Android TTS doesn't support pause/resume natively
        promise.resolve(Arguments.createMap().apply {
            putBoolean("success", false)
            putString("message", "Resume not supported on Android")
        })
    }

    @ReactMethod
    fun isSpeaking(promise: Promise) {
        try {
            val speaking = tts?.isSpeaking ?: false
            promise.resolve(Arguments.createMap().apply {
                putBoolean("isSpeaking", speaking)
                putBoolean("isPaused", false)
            })
        } catch (e: Exception) {
            promise.reject("IS_SPEAKING_ERROR", "Failed to check speaking state: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getAvailableVoices(language: String?, promise: Promise) {
        if (!isInitialized) {
            promise.reject("NOT_INITIALIZED", "TextToSpeech not initialized")
            return
        }

        try {
            val voices = tts?.voices ?: emptySet()
            val voicesArray = Arguments.createArray()

            val filteredVoices = if (!language.isNullOrEmpty()) {
                voices.filter { it.locale.language == Locale.forLanguageTag(language).language }
            } else {
                voices
            }

            for (voice in filteredVoices) {
                val voiceMap = Arguments.createMap().apply {
                    putString("identifier", voice.name)
                    putString("name", voice.name)
                    putString("language", voice.locale.toLanguageTag())
                    putString("quality", when (voice.quality) {
                        Voice.QUALITY_VERY_HIGH -> "premium"
                        Voice.QUALITY_HIGH -> "enhanced"
                        else -> "default"
                    })
                    putBoolean("requiresNetwork", voice.isNetworkConnectionRequired)
                }
                voicesArray.pushMap(voiceMap)
            }

            promise.resolve(Arguments.createMap().apply {
                putArray("voices", voicesArray)
            })
        } catch (e: Exception) {
            promise.reject("GET_VOICES_ERROR", "Failed to get voices: ${e.message}", e)
        }
    }

    @ReactMethod
    fun setAudioCategory(
        category: String,
        mode: String,
        options: ReadableArray,
        promise: Promise
    ) {
        // Android handles audio focus differently
        // Audio attributes are set per-utterance in the speak method
        promise.resolve(Arguments.createMap().apply {
            putBoolean("success", true)
            putString("message", "Audio category management handled automatically on Android")
        })
    }

    override fun invalidate() {
        super.invalidate()
        tts?.stop()
        tts?.shutdown()
        abandonAudioFocus()
    }
}
