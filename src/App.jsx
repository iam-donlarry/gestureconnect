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
      <header className="app-header">
        <h1 className="app-header-title">
          GestureEmail Pro
        </h1>
        <p className="app-header-sub">
          Accessible communication for everyone
        </p>
      </header>

      <main className="app-main">
        <aside className="app-aside">
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

      <footer className="app-footer">
        Built for Accessibility • Precision Gesture Control • Real-time Speech Transcription
      </footer>
    </div>
  )
}

export default App
