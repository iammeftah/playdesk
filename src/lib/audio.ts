let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function beep(freq = 880, duration = 0.2, volume = 0.3) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch (e) {
    console.warn('Audio error:', e)
  }
}

export function beepWarning() {
  // Two medium beeps — 5 min warning
  beep(660, 0.25, 0.4)
  setTimeout(() => beep(660, 0.25, 0.4), 350)
  setTimeout(() => beep(880, 0.3, 0.5), 700)
}

export function beepEnd() {
  // Descending triple beep — session expired
  beep(880, 0.3, 0.5)
  setTimeout(() => beep(660, 0.3, 0.5), 400)
  setTimeout(() => beep(440, 0.6, 0.6), 800)
}

export function beepLong() {
  // Long single tone — 3h threshold
  beep(440, 1.5, 0.5)
}
