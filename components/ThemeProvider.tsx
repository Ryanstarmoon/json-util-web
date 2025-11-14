'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'light' to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      // Remove all theme classes first
      html.classList.remove('dark', 'light')
      if (newTheme === 'dark') {
        html.classList.add('dark')
        html.style.colorScheme = 'dark'
      } else {
        html.classList.add('light')
        html.style.colorScheme = 'light'
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    // Ensure theme is applied on mount
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

