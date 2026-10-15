'use client'

import { useState, useEffect } from 'react'

export function CookingTools({ bakeMinutes }: { bakeMinutes?: number | null }) {
  // Wake Lock állapota
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [isScreenKeepAwake, setIsScreenKeepAwake] = useState<boolean>(false)

  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (!isScreenKeepAwake) {
          const lock = await navigator.wakeLock.request('screen')
          setWakeLock(lock)
          setIsScreenKeepAwake(true)
        } else {
          await wakeLock?.release()
          setWakeLock(null)
          setIsScreenKeepAwake(false)
        }
      } catch (err) {
        console.error('Wake Lock hiba:', err)
      }
    } else {
      alert('A böngésződ nem támogatja a képernyő ébren tartását.')
    }
  }

  // Időzítő állapota
  const defaultSeconds = (bakeMinutes || 15) * 60
  const [timerSeconds, setTimerSeconds] = useState<number>(defaultSeconds)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1)
      }, 1000)
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      alert('⏰ Lejárt a sütési idő!')
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timerSeconds])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 print:hidden">
      {/* Képernyő ébren tartás */}
      <div className="bg-sage-50 border border-sage-200 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-ink-400">Konyhai mód</span>
          <span className="text-sm font-medium text-ink-800">Képernyő ébren tartása</span>
        </div>
        <button
          onClick={toggleWakeLock}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
            isScreenKeepAwake 
              ? 'bg-forest-600 text-white ring-2 ring-forest-300' 
              : 'bg-white text-ink-700 border border-sage-300 hover:bg-sage-100'
          }`}
        >
          {isScreenKeepAwake ? '💡 Bekapcsolva' : '💡 Ébren tartás'}
        </button>
      </div>

      {/* Sütési időzítő */}
      <div className="bg-ink-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-ink-300">Időzítő</span>
          <span className="text-xl font-mono font-bold">{formatTime(timerSeconds)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-forest-600 hover:bg-forest-700 text-white'
            }`}
          >
            {isTimerRunning ? 'Pillanatállj' : 'Indítás'}
          </button>
          <button
            onClick={() => {
              setIsTimerRunning(false)
              setTimerSeconds(defaultSeconds)
            }}
            className="px-2.5 py-1.5 bg-ink-800 hover:bg-ink-700 text-ink-300 rounded-xl text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}