'use client'

import { useState } from 'react'
import ToolLayout from '@/components/ToolLayout/ToolLayout'
import ResizableJsonEditor from '@/components/ResizableJsonEditor/ResizableJsonEditor'
import UnifiedToolbar from '@/components/UnifiedToolbar/UnifiedToolbar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatJson, formatXml, formatYaml, compressJson, validateJson, convertFormat, detectFormat } from '@/lib/json-utils'

const exampleJson = '{"name":"John","age":30,"city":"New York","hobbies":["reading","swimming"],"address":{"street":"123 Main St","zipcode":"10001"}}'

export default function Home() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentFormat, setCurrentFormat] = useState<'json' | 'xml' | 'yaml'>('json')
  const [detectedFormat, setDetectedFormat] = useState<'json' | 'xml' | 'yaml' | null>(null)

  const loadExample = () => {
    // Load example and auto-format
    const result = formatJson(exampleJson)
    if (result.success && result.result) {
      setInput(result.result)
      setError(null)
      setCurrentFormat('json')
      setDetectedFormat('json')
    } else {
      setInput(exampleJson)
      setError(null)
      setCurrentFormat('json')
      setDetectedFormat('json')
    }
  }

  const handleFormat = () => {
    const contentToFormat = input.trim()
    
    // If content is empty, set to empty
    if (!contentToFormat) {
      setInput('')
      setError(null)
      setSuccess('Format successful')
      setDetectedFormat(null)
      setTimeout(() => setSuccess(null), 2000)
      return
    }

    // Format based on current format type
    let formatResult: { success: boolean; result?: string; error?: string }
    
    if (currentFormat === 'xml') {
      formatResult = formatXml(input)
    } else if (currentFormat === 'yaml') {
      formatResult = formatYaml(input)
    } else {
      formatResult = formatJson(input)
    }

    if (formatResult.success && formatResult.result) {
      setInput(formatResult.result)
      setError(null)
      setSuccess(`${currentFormat === 'xml' ? 'XML' : currentFormat === 'yaml' ? 'YAML' : 'JSON'} format successful`)
      setDetectedFormat(currentFormat)
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(formatResult.error || 'Format failed')
      setSuccess(null)
    }
  }

  const handleCompress = () => {
    if (!input.trim()) {
      setError('Please enter data')
      setSuccess(null)
      return
    }

    // Compress only works for JSON format
    if (currentFormat !== 'json') {
      setError('Compress only works for JSON format')
      setSuccess(null)
      return
    }

    const result = compressJson(input)
    if (result.success && result.result) {
      setInput(result.result)
      setError(null)
      setSuccess('Compress successful')
      setDetectedFormat('json')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result.error || 'Compress failed')
      setSuccess(null)
    }
  }

  const handleValidate = () => {
    const contentToFormat = input.trim()
    
    // If content is empty, set to empty
    if (!contentToFormat) {
      setInput('')
      setError(null)
      setSuccess('Format successful')
      setDetectedFormat(null)
      setTimeout(() => setSuccess(null), 2000)
      return
    }

    // Format based on current format type (includes validation)
    let formatResult: { success: boolean; result?: string; error?: string }
    
    if (currentFormat === 'xml') {
      formatResult = formatXml(input)
    } else if (currentFormat === 'yaml') {
      formatResult = formatYaml(input)
    } else {
      // Default to JSON format
      formatResult = formatJson(input)
    }

    if (formatResult.success && formatResult.result) {
      setInput(formatResult.result)
      setError(null)
      setSuccess(`${currentFormat === 'xml' ? 'XML' : currentFormat === 'yaml' ? 'YAML' : 'JSON'} format is valid`)
      setDetectedFormat(currentFormat)
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(formatResult.error || 'Format validation failed')
      setSuccess(null)
    }
  }

  const handleSelectFormat = (format: 'json' | 'xml' | 'yaml') => {
    setCurrentFormat(format)
    setDetectedFormat(format)
  }

  const handleConvertToXml = () => {
    const contentToConvert = input.trim()
    
    // If content is empty, set to empty and mark as XML format
    if (!contentToConvert) {
      setInput('')
      setError(null)
      setSuccess('Convert to XML successful')
      setCurrentFormat('xml')
      setDetectedFormat('xml')
      setTimeout(() => setSuccess(null), 2000)
      return
    }

    const result = convertFormat(contentToConvert, currentFormat, 'xml')
    if (result.success && result.result) {
      setInput(result.result)
      setError(null)
      setSuccess('Convert to XML successful')
      setCurrentFormat('xml')
      setDetectedFormat('xml')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result.error || 'Convert failed')
      setSuccess(null)
    }
  }

  const handleConvertToYaml = () => {
    const contentToConvert = input.trim()
    
    // If content is empty, set to empty and mark as YAML format
    if (!contentToConvert) {
      setInput('')
      setError(null)
      setSuccess('Convert to YAML successful')
      setCurrentFormat('yaml')
      setDetectedFormat('yaml')
      setTimeout(() => setSuccess(null), 2000)
      return
    }

    const result = convertFormat(contentToConvert, currentFormat, 'yaml')
    if (result.success && result.result) {
      setInput(result.result)
      setError(null)
      setSuccess('Convert to YAML successful')
      setCurrentFormat('yaml')
      setDetectedFormat('yaml')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result.error || 'Convert failed')
      setSuccess(null)
    }
  }

  const handleConvertToJson = () => {
    const contentToConvert = input.trim()
    
    // If content is empty, set to empty and mark as JSON format
    if (!contentToConvert) {
      setInput('')
      setError(null)
      setSuccess('Convert to JSON successful')
      setCurrentFormat('json')
      setDetectedFormat('json')
      setTimeout(() => setSuccess(null), 2000)
      return
    }

    const result = convertFormat(contentToConvert, currentFormat, 'json')
    if (result.success && result.result) {
      setInput(result.result)
      setError(null)
      setSuccess('Convert to JSON successful')
      setCurrentFormat('json')
      setDetectedFormat('json')
      setTimeout(() => setSuccess(null), 2000)
    } else {
      setError(result.error || 'Convert failed')
      setSuccess(null)
    }
  }

  const handleCopy = async () => {
    if (input) {
      try {
        await navigator.clipboard.writeText(input)
        setError(null)
        setSuccess('Copied to clipboard')
        setTimeout(() => setSuccess(null), 2000)
      } catch (error) {
        setError('Failed to copy to clipboard')
        setSuccess(null)
      }
    } else {
      setError('No content to copy')
      setSuccess(null)
    }
  }

  const getLanguage = () => {
    return currentFormat
  }

  return (
    <ToolLayout
      title="JSON Tool"
      description=""
    >
      <div className="h-full flex flex-col">
        <ResizableJsonEditor
          value={input}
          onChange={(value) => {
            const newValue = value || ''
            setInput(newValue)
            setError(null)
            setSuccess(null)
            // Detect format
            const detected = detectFormat(newValue)
            setDetectedFormat(detected)
            
            // Auto-detect format but don't change currentFormat automatically
            // User can manually select format via buttons
          }}
          language={getLanguage()}
          toolbar={
            <UnifiedToolbar
              onFormat={handleFormat}
              onCompress={handleCompress}
              onValidate={handleValidate}
              onSelectFormat={handleSelectFormat}
              onConvertToJson={handleConvertToJson}
              onConvertToXml={handleConvertToXml}
              onConvertToYaml={handleConvertToYaml}
              onLoadExample={loadExample}
              onCopy={handleCopy}
              showCopy={!!input}
              currentFormat={currentFormat}
              error={error}
              success={success}
            />
          }
        />
      </div>
    </ToolLayout>
  )
}
