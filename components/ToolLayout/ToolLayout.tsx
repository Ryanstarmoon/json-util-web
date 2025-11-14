'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun } from 'lucide-react'

interface ToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const { theme, toggleTheme, mounted } = useTheme()

  // Ensure theme is applied to html element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      html.classList.remove('dark', 'light')
      html.classList.add(theme)
      html.style.colorScheme = theme
    }
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <div 
      className="min-h-screen transition-colors"
      style={{
        backgroundColor: isDark ? '#020617' : '#f8fafc',
      }}
    >
      <nav 
        className="border-b transition-colors shadow-sm"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex items-center">
              <span 
                className="text-xl font-semibold font-[family-name:var(--font-space-grotesk)] tracking-tight"
                style={{
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
              >
                JSON TOOL
              </span>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
                style={{
                  color: isDark ? '#cbd5e1' : '#334155',
                }}
                aria-label="Toggle theme"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main 
        className="h-[calc(100vh-3rem)] px-4 sm:px-6 lg:px-8 py-4 transition-colors"
        style={{
          backgroundColor: isDark ? '#020617' : '#f8fafc',
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

