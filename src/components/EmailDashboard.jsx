import React, { useState, useEffect } from 'react'
import { Inbox, Send, Trash2, Mail, Plus, X, ChevronRight, CheckCircle2, BrainCircuit } from 'lucide-react'

const MOCK_EMAILS = [
  { id: 1, from: 'Sarah Johnson', subject: 'Project Update', preview: 'The hand gesture project is looking great...', time: '10:24 AM', read: false },
  { id: 2, from: 'Tech Support', subject: 'Welcome to GestureEmail', preview: 'Getting started with your new platform...', time: 'Yesterday', read: true },
  { id: 3, from: 'Alex Rivera', subject: 'Weekend Plans', preview: 'Are we still on for the group meeting?', time: '2 days ago', read: true },
]

function EmailDashboard({ currentGesture, transcription, onTranscriptionChange, onTeach }) {
  const [emails, setEmails] = useState(MOCK_EMAILS)
  const [composing, setComposing] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('inbox')
  const [notification, setNotification] = useState(null)
  const [learningWord, setLearningWord] = useState('')

  // Handle gesture actions
  useEffect(() => {
    if (!currentGesture) return

    switch (currentGesture) {
      case 'thumbs-up':
        if (composing) {
          handleSend()
        } else {
          setComposing(true)
        }
        break
      case 'thumbs-down':
        if (composing) {
          setComposing(false)
        }
        break
      case 'peace':
        setComposing(false)
        break
      default:
        break
    }
  }, [currentGesture])

  const handleSend = () => {
    setNotification('Email sent successfully!')
    setComposing(false)
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="glass email-dashboard" style={{ position: 'relative' }}>
      {/* Sidebar */}
      <nav className="email-sidebar">
        <div 
          onClick={() => setSelectedFolder('inbox')}
          className={`btn ${selectedFolder === 'inbox' ? '' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start' }}
        >
          <Inbox size={18} /> <span className="btn-label">Inbox</span>
        </div>
        <div 
          onClick={() => setSelectedFolder('sent')}
          className={`btn ${selectedFolder === 'sent' ? '' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start' }}
        >
          <Send size={18} /> <span className="btn-label">Sent</span>
        </div>
        <div 
          onClick={() => setSelectedFolder('trash')}
          className={`btn ${selectedFolder === 'trash' ? '' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start' }}
        >
          <Trash2 size={18} /> <span className="btn-label">Trash</span>
        </div>
        <div 
          onClick={() => setSelectedFolder('training')}
          className={`btn ${selectedFolder === 'training' ? '' : 'btn-secondary'}`} 
          style={{ justifyContent: 'flex-start', background: selectedFolder === 'training' ? 'rgba(168, 85, 247, 0.4)' : '' }}
        >
          <BrainCircuit size={18} /> <span className="btn-label">Teach AI</span>
        </div>
        
        <button 
          onClick={() => setComposing(true)}
          className="btn" 
          style={{ marginTop: 'auto', background: 'var(--secondary)' }}
        >
          <Plus size={18} /> <span className="btn-label">New Message</span>
        </button>
      </nav>

      {/* Main List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ padding: '24px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>{selectedFolder}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {emails.length} messages
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {selectedFolder === 'training' ? (
            <div className="animate-fade-in" style={{ padding: '24px' }}>
              <div className="glass" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--primary-low)', textAlign: 'center' }}>
                <BrainCircuit size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>AI Training Center</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Hold a sign to the camera, type the word below, and click "Teach".
                </p>
                
                <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter Word (e.g. HELP)"
                    value={learningWord}
                    onChange={(e) => setLearningWord(e.target.value.toUpperCase())}
                    style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white', padding: '16px', borderRadius: '8px', textAlign: 'center', fontSize: '1.2rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button 
                    onClick={() => {
                      if (learningWord) {
                        onTeach(learningWord)
                        setLearningWord('')
                        setNotification(`AI learned: ${learningWord}`)
                        setTimeout(() => setNotification(null), 3000)
                      }
                    }}
                    className="btn"
                    style={{ background: 'var(--primary)', height: '56px', fontSize: '1.1rem' }}
                  >
                    Teach AI Now
                  </button>
                </div>
              </div>
            </div>
          ) : (
            emails.map(email => (
              <div 
                key={email.id} 
                className="glass" 
                style={{ 
                  margin: '8px', 
                  padding: '16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease',
                  background: email.read ? 'var(--surface)' : 'rgba(255, 255, 255, 0.08)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {email.from[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontWeight: email.read ? 500 : 700 }}>{email.from}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{email.time}</span>
                  </div>
                  <div style={{ fontWeight: email.read ? 400 : 600, fontSize: '0.95rem' }}>{email.subject}</div>
                  <div className="email-preview-text">
                    {email.preview}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {composing && (
        <div className="email-compose-modal-backdrop">
          <div className="glass animate-fade-in email-compose-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>New Message</h3>
              <X cursor="pointer" onClick={() => setComposing(false)} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Recipient</label>
              <input 
                type="text" 
                placeholder="to@example.com" 
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Message (Sign & Voice Dictated)</label>
              <div style={{ minHeight: '150px', maxHeight: '250px', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--surface-border)', color: 'white', padding: '16px', borderRadius: '8px', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: 500, letterSpacing: '0.5px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                {transcription || "Use Sign Language or Speak to dictate..."}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setComposing(false)}>
                <Trash2 size={18} /> Discard 
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> (Thumbs Down)</span>
              </button>
              <button className="btn" onClick={handleSend} style={{ background: 'var(--success)' }}>
                <Send size={18} /> Send 
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> (Thumbs Up)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="glass animate-fade-in" style={{ position: 'absolute', bottom: '24px', right: '24px', padding: '16px 24px', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 20 }}>
          <CheckCircle2 size={20} /> {notification}
        </div>
      )}
    </div>
  )
}

export default EmailDashboard
