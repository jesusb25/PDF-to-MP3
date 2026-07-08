import { useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY)
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolve(theme) {
  return theme === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : theme
}

function apply(theme) {
  document.documentElement.classList.toggle('dark', resolve(theme) === 'dark')
}

/**
 * Persisted light/dark/auto theme, applied via Tailwind's `dark` class.
 * Mirrors the behavior of the original Bootstrap color-mode toggle.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => getStoredTheme() || 'auto')

  useEffect(() => {
    apply(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if ((getStoredTheme() || 'auto') === 'auto') apply('auto')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return { theme, setTheme }
}
