'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Ellenőrizzük, hogy sötét mód van-e érvényben
    const isDark = document.documentElement.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-sage-200 bg-white text-ink-700 shadow-sm transition hover:bg-sage-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      title="Sötét / világos mód váltása"
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  )
}