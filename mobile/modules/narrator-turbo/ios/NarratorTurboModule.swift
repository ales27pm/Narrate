import AVFoundation
import React

@objc(NarratorTurboModule)
class NarratorTurboModule: RCTEventEmitter {

    private let synthesizer = AVSpeechSynthesizer()
    private var currentUtterance: AVSpeechUtterance?
    private var wordBoundaryHandler: ((String, Int, Int) -> Void)?
    private var completionHandler: (() -> Void)?
    private var errorHandler: ((String) -> Void)?

    // Audio session management
    private var audioSession: AVAudioSession {
        return AVAudioSession.sharedInstance()
    }

    override init() {
        super.init()
        synthesizer.delegate = self
        setupAudioSession()
    }

    // MARK: - Audio Session Setup

    private func setupAudioSession() {
        do {
            // Configure for playback with mixing (allows background audio)
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP])
            try audioSession.setActive(true, options: [])
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }

    // MARK: - RCTEventEmitter

    override func supportedEvents() -> [String]! {
        return [
            "onWordBoundary",
            "onSpeechStart",
            "onSpeechEnd",
            "onSpeechError",
            "onSpeechPause",
            "onSpeechResume",
            "onPhoneme"
        ]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // MARK: - Public API

    @objc
    func speak(_ text: String,
               language: String,
               pitch: Double,
               rate: Double,
               volume: Double,
               voiceIdentifier: String?,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            // Stop any ongoing speech
            if self.synthesizer.isSpeaking {
                self.synthesizer.stopSpeaking(at: .immediate)
            }

            let utterance = AVSpeechUtterance(string: text)

            // Voice selection with Neural voices prioritization
            if let voiceId = voiceIdentifier, !voiceId.isEmpty {
                utterance.voice = AVSpeechSynthesisVoice(identifier: voiceId)
            } else {
                // Auto-select best quality voice for language
                let voices = AVSpeechSynthesisVoice.speechVoices()
                let languageVoices = voices.filter { $0.language.hasPrefix(language) }

                // Prioritize Neural/Premium voices
                let neuralVoice = languageVoices.first { $0.quality == .premium || $0.quality == .enhanced }
                utterance.voice = neuralVoice ?? AVSpeechSynthesisVoice(language: language)
            }

            // Speech parameters
            utterance.pitchMultiplier = Float(pitch)
            utterance.rate = Float(rate) * AVSpeechUtteranceDefaultSpeechRate
            utterance.volume = Float(volume)

            // Enable word boundary callbacks
            utterance.preUtteranceSpeechDelay = 0.0
            utterance.postUtteranceSpeechDelay = 0.1

            self.currentUtterance = utterance
            self.synthesizer.speak(utterance)

            resolve([
                "success": true,
                "utteranceId": String(describing: ObjectIdentifier(utterance))
            ])
        }
    }

    @objc
    func stop(_ resolver: @escaping RCTPromiseResolveBlock,
             rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.synthesizer.stopSpeaking(at: .immediate)
            self.currentUtterance = nil
            resolver(["success": true])
        }
    }

    @objc
    func pause(_ resolver: @escaping RCTPromiseResolveBlock,
              rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.synthesizer.isSpeaking {
                self.synthesizer.pauseSpeaking(at: .word)
                resolver(["success": true, "paused": true])
            } else {
                resolver(["success": false, "paused": false])
            }
        }
    }

    @objc
    func resume(_ resolver: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if self.synthesizer.isPaused {
                self.synthesizer.continueSpeaking()
                resolver(["success": true, "resumed": true])
            } else {
                resolver(["success": false, "resumed": false])
            }
        }
    }

    @objc
    func isSpeaking(_ resolver: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            resolver([
                "isSpeaking": self.synthesizer.isSpeaking,
                "isPaused": self.synthesizer.isPaused
            ])
        }
    }

    @objc
    func getAvailableVoices(_ language: String?,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {

        var voices = AVSpeechSynthesisVoice.speechVoices()

        // Filter by language if provided
        if let lang = language, !lang.isEmpty {
            voices = voices.filter { $0.language.hasPrefix(lang) }
        }

        let voicesData = voices.map { voice -> [String: Any] in
            var quality = "default"
            switch voice.quality {
            case .premium:
                quality = "premium"
            case .enhanced:
                quality = "enhanced"
            default:
                quality = "default"
            }

            return [
                "identifier": voice.identifier,
                "name": voice.name,
                "language": voice.language,
                "quality": quality
            ]
        }

        resolve(["voices": voicesData])
    }

    @objc
    func setAudioCategory(_ category: String,
                         mode: String,
                         options: [String],
                         resolver resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {

        do {
            var categoryType: AVAudioSession.Category = .playback
            switch category {
            case "playback":
                categoryType = .playback
            case "ambient":
                categoryType = .ambient
            case "soloAmbient":
                categoryType = .soloAmbient
            default:
                categoryType = .playback
            }

            var modeType: AVAudioSession.Mode = .spokenAudio
            switch mode {
            case "spokenAudio":
                modeType = .spokenAudio
            case "default":
                modeType = .default
            case "moviePlayback":
                modeType = .moviePlayback
            default:
                modeType = .spokenAudio
            }

            var categoryOptions: AVAudioSession.CategoryOptions = []
            for option in options {
                switch option {
                case "duckOthers":
                    categoryOptions.insert(.duckOthers)
                case "mixWithOthers":
                    categoryOptions.insert(.mixWithOthers)
                case "allowBluetooth":
                    categoryOptions.insert(.allowBluetooth)
                case "allowBluetoothA2DP":
                    categoryOptions.insert(.allowBluetoothA2DP)
                case "allowAirPlay":
                    categoryOptions.insert(.allowAirPlay)
                default:
                    break
                }
            }

            try audioSession.setCategory(categoryType, mode: modeType, options: categoryOptions)
            try audioSession.setActive(true)
            resolve(["success": true])
        } catch {
            reject("AUDIO_SESSION_ERROR", "Failed to set audio category: \(error.localizedDescription)", error)
        }
    }
}

// MARK: - AVSpeechSynthesizerDelegate

extension NarratorTurboModule: AVSpeechSynthesizerDelegate {

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        sendEvent(withName: "onSpeechStart", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance))
        ])
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        sendEvent(withName: "onSpeechEnd", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance))
        ])
        currentUtterance = nil
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {
        sendEvent(withName: "onSpeechPause", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance))
        ])
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didContinue utterance: AVSpeechUtterance) {
        sendEvent(withName: "onSpeechResume", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance))
        ])
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        sendEvent(withName: "onSpeechEnd", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance)),
            "cancelled": true
        ])
        currentUtterance = nil
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                          willSpeakRangeOfSpeechString characterRange: NSRange,
                          utterance: AVSpeechUtterance) {

        let text = utterance.speechString
        let nsText = text as NSString

        // Extract the current word being spoken
        var wordRange = characterRange
        var wordStart = characterRange.location
        var wordEnd = characterRange.location + characterRange.length

        // Expand to word boundaries
        let textLength = text.count
        while wordStart > 0 && !CharacterSet.whitespacesAndNewlines.contains(Unicode.Scalar(nsText.character(at: wordStart - 1))!) {
            wordStart -= 1
        }
        while wordEnd < textLength && !CharacterSet.whitespacesAndNewlines.contains(Unicode.Scalar(nsText.character(at: wordEnd))!) {
            wordEnd += 1
        }

        wordRange = NSRange(location: wordStart, length: wordEnd - wordStart)
        let word = nsText.substring(with: wordRange)

        sendEvent(withName: "onWordBoundary", body: [
            "utteranceId": String(describing: ObjectIdentifier(utterance)),
            "word": word.trimmingCharacters(in: .whitespacesAndNewlines),
            "charIndex": characterRange.location,
            "charLength": characterRange.length,
            "wordIndex": wordStart
        ])
    }
}
