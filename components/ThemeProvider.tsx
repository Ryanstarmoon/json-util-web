'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type Style = 'modern' | 'pixel'

interface ThemeContextType {
  theme: Theme
  style: Style
  toggleTheme: () => void
  toggleStyle: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [style, setStyle] = useState<Style>('pixel')
  const [mounted, setMounted] = useState(false)

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
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

  const applyStyle = (newStyle: Style) => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      html.setAttribute('data-style', newStyle)
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Theme logic
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    applyTheme(initialTheme)

    // Style logic
    const savedStyle = localStorage.getItem('style') as Style | null
    const initialStyle = savedStyle || 'pixel'
    setStyle(initialStyle)
    applyStyle(initialStyle)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
  }

  const toggleStyle = () => {
    const newStyle = style === 'pixel' ? 'modern' : 'pixel'
    setStyle(newStyle)
    if (typeof window !== 'undefined') {
      localStorage.setItem('style', newStyle)
    }
    applyStyle(newStyle)
  }

  return (
    <ThemeContext.Provider value={{ theme, style, toggleTheme, toggleStyle, mounted }}>
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
