'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, Terminal, Sparkles, Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function ToolLayout({ title, description, children }: ToolLayoutProps) {
  const { theme, toggleTheme, style, toggleStyle, mounted } = useTheme()

  // Ensure theme is applied to html element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      html.classList.remove('dark', 'light')
      html.classList.add(theme)
      html.style.colorScheme = theme
    }
  }, [theme])

  const isPixel = style === 'pixel'

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-full flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground overflow-hidden transition-colors duration-300">
        <nav className={cn(
          "flex-none sticky top-0 z-40 w-full bg-background transition-all duration-300",
          isPixel ? "border-b-2 border-border" : "border-b backdrop-blur-sm bg-background/80"
        )}>
          <div className={cn(
            "flex items-center px-4 sm:px-6 lg:px-8 h-16"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center text-primary-foreground w-9 h-9",
                isPixel ? "bg-primary pixel-border-sm" : "rounded-md bg-primary text-primary-foreground"
              )}>
                <Terminal className="w-4 h-4" />
              </div>
              <span className={cn(
                "font-bold tracking-tight",
                isPixel ? "text-sm sm:text-base" : "text-lg sm:text-xl"
              )}>
                {title}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleStyle}
                    className="h-9 w-9"
                  >
                    {isPixel ? <Box className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPixel ? "Switch to Modern Mode" : "Switch to Pixel Mode"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-9 w-9"
                    aria-label="Toggle theme"
                  >
                    {mounted && theme === 'dark' ? (
                      <Sun className={cn(
                        "text-yellow-500",
                        "h-4 w-4"
                      )} />
                    ) : (
                      <Moon className={cn(
                        "text-foreground",
                        "h-4 w-4"
                      )} />
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

        <main className="flex-1 min-h-0 w-full p-4 sm:p-6">
          <div className="mx-auto h-full w-full max-w-[1600px] flex flex-col gap-4">
            <div className={cn(
              "flex-1 min-h-0 bg-card text-card-foreground flex flex-col overflow-hidden",
              isPixel ? "pixel-border" : "rounded-xl border shadow-sm"
            )}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
