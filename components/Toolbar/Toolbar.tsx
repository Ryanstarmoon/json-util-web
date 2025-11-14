'use client'

import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Minus, 
  CheckCircle2, 
  RefreshCw, 
  Search,
  Copy,
  Download,
  FileDown
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ToolbarButton {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  disabled?: boolean
}

interface ToolbarProps {
  buttons: ToolbarButton[]
  onLoadExample?: () => void
  onCopy?: () => void
  showCopy?: boolean
}

export default function Toolbar({ buttons, onLoadExample, onCopy, showCopy = false }: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {onLoadExample && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadExample}
                className="h-8 w-8 p-0"
              >
                <FileDown className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load Example</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {buttons.map((button, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant={button.variant || 'ghost'}
                size="sm"
                onClick={button.onClick}
                disabled={button.disabled}
                className="h-8 w-8 p-0"
              >
                {button.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{button.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {showCopy && onCopy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-8 w-8 p-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

