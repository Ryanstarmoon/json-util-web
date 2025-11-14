'use client'

import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Minus, 
  CheckCircle2, 
  RefreshCw,
  Copy,
  FileDown,
  FileCode,
  Braces,
  Code,
  AlignLeft
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  showCopy = false,
  currentFormat = 'json',
  error,
  success
}: UnifiedToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between w-full gap-2">
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

        {/* Format selection buttons */}
        {onSelectFormat && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentFormat === 'json' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (currentFormat === 'json') {
                      return
                    }
                    onConvertToJson?.()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Braces className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{currentFormat === 'json' ? 'Current format: JSON' : 'Convert 2 JSON'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentFormat === 'xml' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (currentFormat === 'xml') {
                      return
                    }
                    onConvertToXml?.()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <FileCode className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{currentFormat === 'xml' ? 'Current format: XML' : 'Convert 2 XML'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentFormat === 'yaml' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    if (currentFormat === 'yaml') {
                      return
                    }
                    onConvertToYaml?.()
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Code className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{currentFormat === 'yaml' ? 'Current format: YAML' : 'Convert 2 YAML'}</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Format button */}
        {onFormat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFormat}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Format {currentFormat === 'xml' ? 'XML' : currentFormat === 'yaml' ? 'YAML' : 'JSON'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Compress button - only enabled for JSON */}
        {onCompress && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCompress}
                disabled={currentFormat !== 'json'}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{currentFormat === 'json' ? 'Compress JSON' : 'Compress only works for JSON format'}</p>
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
                className="h-8 w-8 p-0"
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Validate & Format {currentFormat === 'xml' ? 'XML' : currentFormat === 'yaml' ? 'YAML' : 'JSON'}</p>
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
                className="h-8 w-8 p-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showCopy ? 'Copy' : 'No content to copy'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center transition-colors">
              {success}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 flex items-center transition-colors">
              {error}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

