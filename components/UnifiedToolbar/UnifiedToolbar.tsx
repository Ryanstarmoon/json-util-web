'use client'

import { Button } from '@/components/ui/button'
import { 
  Minus, 
  CheckCircle2, 
  Copy,
  FileDown,
  FileCode,
  Braces,
  Code,
  AlignLeft,
  Check,
  Search,
  Trash2,
  FileText
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface UnifiedToolbarProps {
  onFormat?: () => void
  onCompress?: () => void
  onValidate?: () => void
  onSelectFormat?: (format: 'json' | 'xml' | 'yaml') => void
  onConvertToJson?: () => void
  onConvertToXml?: () => void
  onConvertToYaml?: () => void
  onLoadExample?: () => void
  onCopy?: () => void
  onClear?: () => void
  onSearch?: () => void
  showCopy?: boolean
  currentFormat?: 'json' | 'xml' | 'yaml'
  error?: string | null
  success?: string | null
}

export default function UnifiedToolbar({
  onFormat,
  onCompress,
  onValidate,
  onSelectFormat,
  onConvertToJson,
  onConvertToXml,
  onConvertToYaml,
  onLoadExample,
  onCopy,
  onClear,
  onSearch,
  showCopy = false,
  currentFormat = 'json',
  error,
  success
}: UnifiedToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-3 p-3 border-b-2 border-border bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:h-16 sm:p-2 sm:px-4 transition-all duration-300">
        <div className="flex items-center gap-2">
          {onSelectFormat && (
            <div className="flex p-1 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentFormat === 'json' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => currentFormat !== 'json' && onConvertToJson?.()}
                    className={cn(
                      "gap-2",
                      currentFormat !== 'json' && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Braces className="w-3.5 h-3.5" />
                    JSON
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentFormat === 'json' ? 'Current: JSON' : 'Convert to JSON'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentFormat === 'xml' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => currentFormat !== 'xml' && onConvertToXml?.()}
                    className={cn(
                      "gap-2",
                      currentFormat !== 'xml' && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    XML
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentFormat === 'xml' ? 'Current: XML' : 'Convert to XML'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentFormat === 'yaml' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => currentFormat !== 'yaml' && onConvertToYaml?.()}
                    className={cn(
                      "gap-2",
                      currentFormat !== 'yaml' && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Code className="w-3.5 h-3.5" />
                    YAML
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentFormat === 'yaml' ? 'Current: YAML' : 'Convert to YAML'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <div className="flex items-center gap-1 pr-2 border-r-2 border-border/50">
            {onFormat && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFormat}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <AlignLeft className="w-4 h-4" />
                    Format
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Format Code</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onCompress && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCompress}
                    disabled={currentFormat !== 'json'}
                    className="gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                    Compress
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compress (JSON only)</p>
                </TooltipContent>
              </Tooltip>
            )}

            {onValidate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onValidate}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Validate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Validate Syntax</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-1 pl-1">
            {onLoadExample && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={onLoadExample}
                     className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                   >
                     <FileText className="w-4 h-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Load Example</p>
                 </TooltipContent>
               </Tooltip>
            )}

            {onSearch && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={onSearch}
                     className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                   >
                     <Search className="w-4 h-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Search</p>
                 </TooltipContent>
               </Tooltip>
            )}

            {onClear && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={onClear}
                     className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:text-destructive"
                   >
                     <Trash2 className="w-4 h-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Clear</p>
                 </TooltipContent>
               </Tooltip>
            )}

            {onCopy && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    disabled={!showCopy}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    {success?.includes('Copied') ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy to Clipboard</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      {(success || error) && (
        <div className={cn(
          "px-4 py-2 text-xs font-medium border-b-2 border-border flex items-center gap-2 transition-all animate-in slide-in-from-top-2",
          success ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
        )}>
          {success ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 rotate-45" />
          )}
          {success || error}
        </div>
      )}
    </TooltipProvider>
  )
}
