'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, Terminal, Github } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  fullScreen?: boolean
}

export default function ToolLayout({ title, description, children, fullScreen = false }: ToolLayoutProps) {
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

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-full flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground overflow-hidden transition-colors duration-300">
        <nav className="flex-none sticky top-0 z-40 w-full bg-background transition-all duration-300 border-b backdrop-blur-sm bg-background/80">
          <div className="flex items-center px-4 h-12">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center text-primary-foreground w-7 h-7 rounded-md bg-primary">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold tracking-tight hidden sm:inline text-sm">
                {title}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a 
                    href="https://github.com/Ryanstarmoon/json-util-web/issues/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Feedback</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8"
                    aria-label="Toggle theme"
                  >
                    {mounted && theme === 'dark' ? (
                      <Sun className="text-yellow-500 h-4 w-4" />
                    ) : (
                      <Moon className="text-foreground h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </nav>

        <main className={cn(
          "flex-1 min-h-0 w-full",
          fullScreen ? "p-0" : "p-4 sm:p-6"
        )}>
           {fullScreen ? (
             <div className="h-full w-full bg-background flex flex-col">
                {children}
             </div>
           ) : (
            <div className="mx-auto h-full w-full max-w-[1600px] flex flex-col gap-4">
              <div className="flex-1 min-h-0 bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border shadow-sm">
                {children}
              </div>
            </div>
           )}
        </main>
      </div>
    </TooltipProvider>
  )
}
