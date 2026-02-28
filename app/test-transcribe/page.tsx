'use client'

import { useState } from 'react'

import { useTranscription } from '@/lib/useTranscription'

export default function TestTranscribe() {
  const [partial, setPartial] = useState('')
  const [sentences, setSentences] = useState<{ text: string; time: string }[]>([])
  const [running, setRunning] = useState(false)

  const { start, stop } = useTranscription(
    (text) => setPartial(text),
    (text) => {
      setPartial('')
      setSentences((prev) => [...prev, { text, time: new Date().toLocaleTimeString() }])
    },
  )

  const handleStart = async () => {
    setRunning(true)
    setSentences([])
    await start()
  }

  const handleStop = () => {
    setRunning(false)
    stop()
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>🎤 Live Transcription Test</h1>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleStart}
          disabled={running}
          style={{ marginRight: 10, padding: '8px 20px' }}
        >
          Start
        </button>
        <button onClick={handleStop} disabled={!running} style={{ padding: '8px 20px' }}>
          Stop
        </button>
      </div>

      <div
        style={{
          minHeight: 40,
          padding: 12,
          background: '#f0f0f0',
          borderRadius: 6,
          marginBottom: 20,
          color: '#666',
        }}
      >
        {partial || '(waiting for speech...)'}
      </div>

      <div>
        {sentences.map((s, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              marginBottom: 8,
              background: '#e8f5e9',
              borderRadius: 6,
            }}
          >
            <span style={{ color: '#999', fontSize: 12 }}>{s.time} </span>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  )
}
