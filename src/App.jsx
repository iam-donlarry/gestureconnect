import React, { useState } from 'react'
import EmailDashboard from './components/EmailDashboard'
import GestureEngine from './components/GestureEngine'
import SpeechModule from './components/SpeechModule'

function App() {
  const [gesture, setGesture] = useState(null)
  const [transcription, setTranscription] = useState("")
  const [learnedSigns, setLearnedSigns] = useState(() => {
    const saved = localStorage.getItem('learnedSignData')
    return saved ? JSON.parse(saved) : []
  })
  const [latestLandmarks, setLatestLandmarks] = useState(null)

  // Handle teaching a new sign
  const handleTeach = (newSign) => {
    const updated = [...learnedSigns, newSign]
    setLearnedSigns(updated)
    localStorage.setItem('learnedSignData', JSON.stringify(updated))
  }

  // Handle gesture as text input
  const handleGesture = (g) => {
    setGesture(g)
    if (!g || g === 'searching') return

    setTranscription(prev => {
      if (g === 'SPACE') return prev + " "
      if (g === 'BACKSPACE') return prev.slice(0, -1)
      if (g === 'SEND') return prev // Action handled in EmailDashboard
      return prev + g
    })
  }

  return (
    <div className="container animate-fade-in">
      <header style={{ padding: '40px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          GestureEmail Pro
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Accessible communication for everyone
        </p>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GestureEngine 
            onGesture={handleGesture} 
            currentText={transcription} 
            learnedSigns={learnedSigns}
            onLandmarks={setLatestLandmarks}
          />
          <SpeechModule onTranscription={setTranscription} />
        </aside>
        
        <section>
          <EmailDashboard 
            currentGesture={gesture} 
            transcription={transcription}
            onTranscriptionChange={setTranscription}
            onTeach={(word) => handleTeach({ word, landmarks: latestLandmarks })}
          />
        </section>
      </main>

      <footer style={{ marginTop: 'auto', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Built for Accessibility • Precision Gesture Control • Real-time Speech Transcription
      </footer>
    </div>
  )
}

export default App
