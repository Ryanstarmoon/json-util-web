'use client'

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-slate-900 dark:text-slate-50 font-[family-name:var(--font-space-grotesk)] tracking-tight">
                JSON TOOL
              </span>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
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

      <main className="h-[calc(100vh-3rem)] px-4 sm:px-6 lg:px-8 py-4 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

