'use client'

import { useCallback, useRef } from 'react'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

export function useTranscription(
  onPartial: (text: string) => void,
  onSentence: (text: string) => void,
) {
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null)
  const startingRef = useRef(false)

  const stop = useCallback(() => {
    const recognizer = recognizerRef.current
    if (!recognizer) return

    recognizer.stopContinuousRecognitionAsync(
      () => {
        recognizer.close()
        recognizerRef.current = null
      },
      (err) => {
        console.error('[STOP ERROR]', err)
        recognizer.close()
        recognizerRef.current = null
      },
    )
  }, [])

  const start = useCallback(async () => {
    if (startingRef.current) return
    startingRef.current = true

    try {
      stop()

      console.log('[TOKEN] fetching...')
      const res = await fetch('/api/speech-token', { cache: 'no-store' })
      console.log('[TOKEN] response status:', res.status)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error('[TOKEN] error body:', body)
        throw new Error('Failed to fetch speech token')
      }

      const { token, region } = (await res.json()) as { token: string; region: string }
      console.log('[TOKEN] received, region:', region)

      const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region)
      speechConfig.speechRecognitionLanguage = 'en-US'

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
      recognizerRef.current = recognizer

      recognizer.recognizing = (_, e) => onPartial(e.result.text)

      recognizer.recognized = (_, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
          onSentence(e.result.text)
        }
      }

      recognizer.canceled = (_, e) => {
        console.error('[CANCELED]', e.reason, e.errorDetails)
      }

      recognizer.sessionStarted = () => console.log('[SESSION] started')
      recognizer.sessionStopped = () => console.log('[SESSION] stopped')

      await new Promise<void>((resolve, reject) => {
        recognizer.startContinuousRecognitionAsync(resolve, reject)
      })
    } finally {
      startingRef.current = false
    }
  }, [onPartial, onSentence, stop])

  return { start, stop }
}
