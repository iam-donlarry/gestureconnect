import React, { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'

// Note: MediaPipe Hands, Camera, and DrawingUtils are loaded via CDN in index.html

function GestureEngine({ onGesture, currentText, learnedSigns = [], onLandmarks }) {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeGesture, setActiveGesture] = useState(null)
  const lastGestureRef = useRef(null)
  const gestureCountRef = useRef(0)
  const motionBufferRef = useRef([])
  const lastSentGestureRef = useRef(null)
  const cooldownTimerRef = useRef(null)
  
  // Logic refs to avoid stale closures in MediaPipe callback
  const cooldownActiveRef = useRef(false)
  const hasNeutralizedRef = useRef(true) 
  const neutralCountRef = useRef(0)
  
  // State for UI only
  const [cooldownActive, setCooldownActive] = useState(false)
  const [stabilityProgress, setStabilityProgress] = useState(0)

  // Similarity engine: Euclidean distance based comparison
  const calculateSimilarity = (current, learned) => {
    if (!current || !learned || current.length !== learned.length) return 1
    let diff = 0
    for (let i = 0; i < current.length; i++) {
      diff += Math.sqrt(
        Math.pow(current[i].x - learned[i].x, 2) + 
        Math.pow(current[i].y - learned[i].y, 2)
      )
    }
    return diff / current.length 
  }

  useEffect(() => {
    if (!window.Hands) {
      console.error('MediaPipe Hands not loaded from CDN')
      return
    }

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    hands.onResults(onResults)

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new window.Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video?.readyState === 4) { // HAVE_ENOUGH_DATA
            await hands.send({ image: webcamRef.current.video })
          }
        },
        width: 640,
        height: 480
      })
      camera.start()
    }

    setIsLoaded(true)
  }, [])

  const onResults = (results) => {
    if (!canvasRef.current) return
    const canvasCtx = canvasRef.current.getContext('2d')
    if (!canvasCtx) return
    
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0]
      
      // Draw landmarks
      window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 })
      window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 })

      if (onLandmarks) onLandmarks(landmarks)

      const gesture = interpretGesture(landmarks)
      handleGestureState(gesture)
    } else {
      handleGestureState('searching')
    }
    canvasCtx.restore()
  }

  const handleGestureState = (gesture) => {
    // 1. Check Cooldown (Ref based for accuracy)
    if (cooldownActiveRef.current) return

    // 2. Track Neutral State (Release)
    if (gesture === 'searching') {
      neutralCountRef.current += 1
      if (neutralCountRef.current >= 5) {
        hasNeutralizedRef.current = true
      }
    } else {
      neutralCountRef.current = 0
    }

    // 3. Stability Engine
    if (gesture === lastGestureRef.current) {
      gestureCountRef.current += 1
    } else {
      lastGestureRef.current = gesture
      gestureCountRef.current = 0
    }

    // Update stability progress (scale of 0 to 100)
    const threshold = 15 // Frame count for stability
    setStabilityProgress(Math.min((gestureCountRef.current / threshold) * 100, 100))

    // 4. Detection Logic
    if (gestureCountRef.current >= threshold) {
      if (gesture !== 'searching' && gesture !== null) {
        
        // --- REPEAT PREVENTION ---
        // If same character, MUST have neutralized (released) first
        if (gesture === lastSentGestureRef.current && !hasNeutralizedRef.current) {
          return // Ignore repeated hold
        }

        // --- EMIT GESTURE ---
        onGesture(gesture)
        lastSentGestureRef.current = gesture
        hasNeutralizedRef.current = false
        setActiveGesture(gesture)
        
        // --- START COOLDOWN ---
        cooldownActiveRef.current = true
        setCooldownActive(true)
        setStabilityProgress(0)
        
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = setTimeout(() => {
          cooldownActiveRef.current = false
          setCooldownActive(false)
          // Reset active gesture to null to allow it to be re-detected after cooldown
          setActiveGesture(null)
        }, 1200) // 1.2s cooldown
      } else {
        // If searching is stable, just update the active gesture display
        setActiveGesture(gesture)
      }
    }
  }

  const interpretGesture = (landmarks) => {
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]
    
    const indexBase = landmarks[5]
    const middleBase = landmarks[9]
    const ringBase = landmarks[13]
    const pinkyBase = landmarks[17]
    const wrist = landmarks[0]

    const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))

    const isIndexCurled = dist(indexTip, wrist) < dist(indexBase, wrist)
    const isMiddleCurled = dist(middleTip, wrist) < dist(middleBase, wrist)
    const isRingCurled = dist(ringTip, wrist) < dist(ringBase, wrist)
    const isPinkyCurled = dist(pinkyTip, wrist) < dist(pinkyBase, wrist)

    // --- Alphabet signs (A-Z) ---

    // A: Fist, thumb on side
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && thumbTip.x > indexBase.x + 0.02) return 'A'
    
    // B: All fingers up & together
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && !isPinkyCurled && dist(indexTip, middleTip) < 0.03) return 'B'
    
    // C: Curve
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && !isPinkyCurled && dist(thumbTip, indexTip) > 0.08 && thumbTip.x > indexTip.x) return 'C'
    
    // D: Index up
    if (!isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dist(thumbTip, middleTip) < 0.08) return 'D'
    
    // E: All curled
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dist(thumbTip, middleTip) < 0.04) return 'E'
    
    // F: OK sign
    if (dist(thumbTip, indexTip) < 0.05 && !isMiddleCurled && !isRingCurled && !isPinkyCurled) return 'F'
    
    // G: Index/Thumb sideways
    if (!isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && indexTip.x < indexBase.x - 0.05) return 'G'
    
    // H: Index/Middle sideways
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && indexTip.x < indexBase.x - 0.1) return 'H'
    
    // I: Pinky up
    if (isIndexCurled && isMiddleCurled && isRingCurled && !isPinkyCurled) return 'I'
    
    // K: Index/Middle up, thumb between
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && dist(thumbTip, middleBase) < 0.05) return 'K'
    
    // L: Index up, thumb out
    if (!isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && thumbTip.x < indexBase.x - 0.05) return 'L'

    // M: 3 fingers over thumb
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && thumbTip.x < pinkyBase.x) return 'M'

    // N: 2 fingers over thumb
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && thumbTip.x < ringBase.x) return 'N'
    
    // O: O shape
    if (dist(thumbTip, indexTip) < 0.05 && dist(thumbTip, middleTip) < 0.05) return 'O'

    // P: K pointing down
    if (indexTip.y > indexBase.y && middleTip.y > middleBase.y && dist(thumbTip, middleTip) < 0.05) return 'P'

    // Q: G pointing down
    if (indexTip.y > indexBase.y && thumbTip.y > indexBase.y && dist(indexTip, thumbTip) < 0.1) return 'Q'
    
    // R: Crossed
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && indexTip.x > middleTip.x) return 'R'

    // S: Fist, thumb across
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dist(thumbTip, middleTip) < 0.03) return 'S'

    // T: Thumb under index
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dist(thumbTip, indexBase) < 0.03) return 'T'
    
    // U: Touching up
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && dist(indexTip, middleTip) < 0.02) return 'U'
    
    // V: Peace
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && dist(indexTip, middleTip) > 0.04) return 'V'
    
    // W: 3 fingers spread
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && isPinkyCurled && dist(indexTip, middleTip) > 0.05) return 'W'
    
    // X: Index hooked
    if (dist(indexTip, indexBase) < dist(indexTip, wrist) && isMiddleCurled && isRingCurled && isPinkyCurled) return 'X'

    // Y: Thumb/Pinky out
    if (!isPinkyCurled && thumbTip.x < indexBase.x - 0.05 && isIndexCurled && isMiddleCurled && isRingCurled) return 'Y'

    // --- AI Learning Check ---
    if (learnedSigns.length > 0) {
      for (const trained of learnedSigns) {
        const similarity = calculateSimilarity(landmarks, trained.landmarks)
        if (similarity < 0.05) return trained.word
      }
    }

    // --- Whole Word Signs ---
    if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && thumbTip.x < indexBase.x) {
      motionBufferRef.current.push(wrist.y)
      if (motionBufferRef.current.length > 20) motionBufferRef.current.shift()
      const yDelta = Math.max(...motionBufferRef.current) - Math.min(...motionBufferRef.current)
      if (yDelta > 0.08) return 'YES '
    }
    if (!isIndexCurled && !isMiddleCurled && isRingCurled && isPinkyCurled && dist(indexTip, thumbTip) < 0.05) return 'NO '
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && !isPinkyCurled && wrist.y < 0.4 && dist(indexTip, middleTip) < 0.05) return 'HELLO '

    // --- Controls ---
    if (thumbTip.y < indexBase.y - 0.05 && isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) return 'SEND'
    if (thumbTip.y > wrist.y + 0.05 && isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled) return 'BACKSPACE'
    if (!isIndexCurled && !isMiddleCurled && !isRingCurled && !isPinkyCurled && dist(indexTip, middleTip) > 0.08) return 'SPACE'

    return 'searching'
  }

  return (
    <div className="glass animate-fade-in gesture-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Gesture Control</h2>
        <div style={{ background: isLoaded ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: isLoaded ? '#4ade80' : '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
          {isLoaded ? 'AI ACTIVE' : 'LOADING...'}
        </div>
      </div>

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
        <Webcam
          ref={webcamRef}
          mirrored={true}
          style={{ width: '100%', display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />

        <div className="gesture-transcription-overlay">
          <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>Live Transcription</div>
          <div style={{ fontSize: '1rem', color: 'white', fontWeight: 500, wordWrap: 'break-word', overflowWrap: 'break-word' }}>
            {currentText || "Start signing..."}
          </div>
        </div>

        {activeGesture && activeGesture !== 'searching' && (
          <div className="animate-fade-in" style={{ position: 'absolute', top: '16px', right: '16px', background: cooldownActive ? 'var(--text-muted)' : 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
            {activeGesture.replace('-', ' ')} {cooldownActive ? 'SAVED' : 'detected'}
          </div>
        )}

        {/* Stability Progress Bar */}
        {!cooldownActive && stabilityProgress > 0 && (
          <div style={{ position: 'absolute', bottom: '0', left: '0', height: '4px', background: 'var(--accent)', width: `${stabilityProgress}%`, transition: 'width 0.1s linear' }} />
        )}

        {/* Cooldown Overlay */}
        {cooldownActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'grayscale(1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <div className="glass" style={{ padding: '20px', textAlign: 'center', borderColor: 'var(--primary)', color: 'white' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>WAIT...</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Next letter in 1.5s</div>
            </div>
          </div>
        )}
      </div>

      <div className="gesture-info-grid">
        <div className="glass" style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }} />
          A–Z: Full Alphabet
        </div>
        <div className="glass" style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%' }} />
          HELLO, YES, NO: Words
        </div>
        <div className="glass" style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }} />
          Thumbs Down: Backspace
        </div>
        <div className="glass" style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }} />
          Thumbs Up: Send
        </div>
      </div>
    </div>
  )
}

export default GestureEngine
