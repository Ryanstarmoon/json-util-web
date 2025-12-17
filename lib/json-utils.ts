import { Parser } from 'json2csv';
import yaml from 'js-yaml';
import { json2xml, xml2json } from 'xml-js';

/**
 * Try to fix common JSON errors
 * - Remove trailing commas
 * - Replace single quotes with double quotes
 * - Try to auto-close brackets
 */
export function tryFixJson(jsonString: string): { success: boolean; result?: string; error?: string; fixes?: string[] } {
  const fixes: string[] = [];
  let fixed = jsonString;

  // 1. Replace single quotes with double quotes (for keys and string values)
  // But be careful not to replace single quotes inside double-quoted strings
  const singleQuotePattern = /(?<!\\)'([^'\\]*(?:\\.[^'\\]*)*)'/g;
  if (singleQuotePattern.test(fixed)) {
    fixed = fixed.replace(singleQuotePattern, '"$1"');
    fixes.push('Replaced single quotes with double quotes');
  }

  // 2. Remove trailing commas before } or ]
  const trailingCommaPattern = /,(\s*[}\]])/g;
  if (trailingCommaPattern.test(fixed)) {
    fixed = fixed.replace(trailingCommaPattern, '$1');
    fixes.push('Removed trailing commas');
  }

  // 3. Add missing quotes to unquoted keys
  // Match unquoted keys like { key: value } -> { "key": value }
  const unquotedKeyPattern = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
  if (unquotedKeyPattern.test(fixed)) {
    fixed = fixed.replace(unquotedKeyPattern, '$1"$2"$3');
    fixes.push('Added quotes to unquoted keys');
  }

  // 4. Try to balance brackets
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/]/g) || []).length;

  if (openBraces > closeBraces) {
    fixed = fixed + '}'.repeat(openBraces - closeBraces);
    fixes.push(`Added ${openBraces - closeBraces} missing closing brace(s)`);
  }
  if (openBrackets > closeBrackets) {
    fixed = fixed + ']'.repeat(openBrackets - closeBrackets);
    fixes.push(`Added ${openBrackets - closeBrackets} missing closing bracket(s)`);
  }

  // 5. Remove JavaScript-style comments
  const commentPattern = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
  if (commentPattern.test(fixed)) {
    fixed = fixed.replace(commentPattern, '');
    fixes.push('Removed comments');
  }

  // Try to parse the fixed JSON
  try {
    const parsed = JSON.parse(fixed);
    return {
      success: true,
      result: JSON.stringify(parsed, null, 2),
      fixes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fix JSON',
      fixes
    };
  }
}

/**
 * Extract JSON from cURL command
 */
export function extractFromCurl(curlString: string): { success: boolean; result?: string; url?: string; headers?: Record<string, string>; error?: string } {
  try {
    const trimmed = curlString.trim();
    
    // Check if it's a curl command
    if (!trimmed.toLowerCase().startsWith('curl')) {
      return { success: false, error: 'Not a valid cURL command' };
    }

    // Extract URL
    const urlMatch = trimmed.match(/curl\s+(?:(?:-[A-Za-z]+|--[a-z-]+)\s+(?:'[^']*'|"[^"]*"|[^\s]+)\s+)*['"]?(https?:\/\/[^\s'"]+)['"]?/i) ||
                     trimmed.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/);
    const url = urlMatch ? urlMatch[1] : undefined;

    // Extract headers
    const headers: Record<string, string> = {};
    const headerMatches = trimmed.matchAll(/-H\s+['"]([^'"]+)['"]/g);
    for (const match of headerMatches) {
      const [key, ...valueParts] = match[1].split(':');
      if (key) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    }

    // Extract data/body from -d, --data, --data-raw, --data-binary
    // Use [\s\S] instead of . with /s flag for ES5 compatibility
    const dataMatch = trimmed.match(/(?:-d|--data(?:-raw|-binary)?)\s+['"]([\s\S]+?)['"]/) ||
                      trimmed.match(/(?:-d|--data(?:-raw|-binary)?)\s+([^\s]+)/);
    
    if (dataMatch) {
      let data = dataMatch[1];
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(data);
        return {
          success: true,
          result: JSON.stringify(parsed, null, 2),
          url,
          headers
        };
      } catch {
        // Try to fix and parse
        const fixResult = tryFixJson(data);
        if (fixResult.success) {
          return {
            success: true,
            result: fixResult.result,
            url,
            headers
          };
        }
        // Return raw data if not JSON
        return {
          success: true,
          result: data,
          url,
          headers
        };
      }
    }

    return {
      success: false,
      error: 'No data/body found in cURL command',
      url,
      headers
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse cURL'
    };
  }
}

/**
 * Decode Base64 and try to parse as JSON
 */
export function decodeBase64Json(base64String: string): { success: boolean; result?: string; error?: string } {
  try {
    // Clean up the string (remove whitespace, potential data URI prefix)
    let cleaned = base64String.trim();
    
    // Remove data URI prefix if present
    if (cleaned.includes(',')) {
      cleaned = cleaned.split(',').pop() || cleaned;
    }
    
    // Check if it looks like Base64
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Pattern.test(cleaned.replace(/\s/g, ''))) {
      return { success: false, error: 'Not a valid Base64 string' };
    }

    // Decode Base64
    const decoded = atob(cleaned);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(decoded);
      return {
        success: true,
        result: JSON.stringify(parsed, null, 2)
      };
    } catch {
      // Try to fix and parse
      const fixResult = tryFixJson(decoded);
      if (fixResult.success) {
        return {
          success: true,
          result: fixResult.result
        };
      }
      // Return decoded text if not JSON
      return {
        success: true,
        result: decoded
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode Base64'
    };
  }
}

/**
 * Smart detect and extract content from various formats
 * - cURL commands
 * - Base64 encoded JSON
 * - Log lines containing JSON
 * - URL-encoded JSON
 */
export function smartExtract(content: string): { success: boolean; result?: string; detectedType?: string; error?: string } {
  const trimmed = content.trim();

  // 1. Check for cURL
  if (trimmed.toLowerCase().startsWith('curl')) {
    const curlResult = extractFromCurl(trimmed);
    if (curlResult.success && curlResult.result) {
      return { success: true, result: curlResult.result, detectedType: 'cURL' };
    }
  }

  // 2. Check for Base64 (looks like Base64 and is long enough)
  const base64Pattern = /^[A-Za-z0-9+/]{20,}=*$/;
  if (base64Pattern.test(trimmed.replace(/\s/g, ''))) {
    const base64Result = decodeBase64Json(trimmed);
    if (base64Result.success) {
      return { success: true, result: base64Result.result, detectedType: 'Base64' };
    }
  }

  // 3. Check for URL-encoded content
  if (trimmed.includes('%7B') || trimmed.includes('%5B')) {
    try {
      const decoded = decodeURIComponent(trimmed);
      try {
        const parsed = JSON.parse(decoded);
        return { success: true, result: JSON.stringify(parsed, null, 2), detectedType: 'URL-encoded' };
      } catch {
        // Continue to other checks
      }
    } catch {
      // Not URL-encoded
    }
  }

  // 4. Try to extract JSON from log lines (find first { or [ and match to end)
  const jsonStartMatch = trimmed.match(/[{\[]/);
  if (jsonStartMatch && jsonStartMatch.index !== undefined && jsonStartMatch.index > 0) {
    const potentialJson = trimmed.slice(jsonStartMatch.index);
    try {
      const parsed = JSON.parse(potentialJson);
      return { success: true, result: JSON.stringify(parsed, null, 2), detectedType: 'Log line' };
    } catch {
      const fixResult = tryFixJson(potentialJson);
      if (fixResult.success) {
        return { success: true, result: fixResult.result, detectedType: 'Log line (fixed)' };
      }
    }
  }

  // 5. Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    return { success: true, result: JSON.stringify(parsed, null, 2), detectedType: 'JSON' };
  } catch {
    // 6. Try to fix JSON
    const fixResult = tryFixJson(trimmed);
    if (fixResult.success) {
      return { success: true, result: fixResult.result, detectedType: 'JSON (fixed)' };
    }
  }

  return { success: false, error: 'Could not detect or parse content' };
}

/**
 * Calculate JSON statistics
 */
export function getJsonStats(jsonString: string): { nodeCount: number; depth: number; size: number } | null {
  try {
    const parsed = JSON.parse(jsonString);
    
    let nodeCount = 0;
    let maxDepth = 0;

    function traverse(obj: any, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      
      if (obj === null || typeof obj !== 'object') {
        nodeCount++;
        return;
      }

      nodeCount++;
      
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, depth + 1));
      } else {
        Object.values(obj).forEach(value => traverse(value, depth + 1));
      }
    }

    traverse(parsed, 0);

    return {
      nodeCount,
      depth: maxDepth,
      size: new Blob([jsonString]).size
    };
  } catch {
    return null;
  }
}

/**
 * Get JSONPath for a position in the JSON string
 */
export function getJsonPathAtPosition(jsonString: string, position: number): string {
  try {
    // Simple implementation: count braces/brackets to determine path
    const path: (string | number)[] = ['$'];
    let currentKey = '';
    let inString = false;
    let escaped = false;
    let depth = 0;
    const stack: { type: 'object' | 'array'; key?: string; index: number }[] = [];

    for (let i = 0; i < Math.min(position, jsonString.length); i++) {
      const char = jsonString[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (inString) {
        currentKey += char;
        continue;
      }

      if (char === '{') {
        stack.push({ type: 'object', index: 0 });
        depth++;
      } else if (char === '[') {
        stack.push({ type: 'array', index: 0 });
        depth++;
      } else if (char === '}' || char === ']') {
        stack.pop();
        depth--;
      } else if (char === ':' && stack.length > 0 && stack[stack.length - 1].type === 'object') {
        stack[stack.length - 1].key = currentKey;
        currentKey = '';
      } else if (char === ',' && stack.length > 0) {
        if (stack[stack.length - 1].type === 'array') {
          stack[stack.length - 1].index++;
        }
        currentKey = '';
      }
    }

    // Build path from stack
    for (const frame of stack) {
      if (frame.type === 'object' && frame.key) {
        path.push(frame.key);
      } else if (frame.type === 'array') {
        path.push(frame.index);
      }
    }

    return path.map((p, i) => {
      if (i === 0) return p;
      if (typeof p === 'number') return `[${p}]`;
      return `.${p}`;
    }).join('');
  } catch {
    return '$';
  }
}

/**
 * Escape string - convert special characters to escape sequences
 */
export function escapeString(str: string): { success: boolean; result?: string; error?: string } {
  try {
    // Use JSON.stringify to escape, then remove outer quotes
    const escaped = JSON.stringify(str);
    // Remove the outer quotes added by JSON.stringify
    const result = escaped.slice(1, -1);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Escape failed'
    };
  }
}

/**
 * Unescape string - convert escape sequences back to characters
 */
export function unescapeString(str: string): { success: boolean; result?: string; error?: string } {
  try {
    // Add quotes and use JSON.parse to unescape
    const result = JSON.parse(`"${str}"`);
    return {
      success: true,
      result
    };
  } catch (error) {
    // Try a more lenient approach for common escape sequences
    try {
      const result = str
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'");
      return {
        success: true,
        result
      };
    } catch {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unescape failed'
      };
    }
  }
}

/**
 * Format JSON string
 */
export function formatJson(jsonString: string): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      success: true,
      result: JSON.stringify(parsed, null, 4)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Format XML string
 */
export function formatXml(xmlString: string): { success: boolean; result?: string; error?: string } {
  try {
    // Clean XML string
    const cleanedXml = xmlString.trim();
    
    // Check if it's valid XML
    if (!cleanedXml.includes('<') || !cleanedXml.includes('>')) {
      return {
        success: false,
        error: 'Invalid XML format'
      };
    }
    
    // Use xml2json with non-compact mode to parse XML, then convert back with formatting
    // First, parse XML to JSON object (non-compact mode preserves structure better)
    const jsonResult = xml2json(cleanedXml, { 
      compact: false,  // Use non-compact mode for better structure preservation
      spaces: 4,
      ignoreComment: true,
      ignoreAttributes: false,
      ignoreDeclaration: true,
      ignoreInstruction: true,
      ignoreDoctype: true
    });
    
    // Verify result is a string and looks like JSON
    if (typeof jsonResult !== 'string') {
      return {
        success: false,
        error: 'XML conversion failed: unexpected result type'
      };
    }
    
    // Parse JSON to get the structure
    let jsonData: any;
    try {
      jsonData = JSON.parse(jsonResult);
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse XML: ${parseError instanceof Error ? parseError.message : 'Invalid XML structure'}`
      };
    }
    
    // Convert back to XML with formatting using non-compact mode
    const formattedXml = json2xml(jsonData, {
      compact: false,  // Non-compact mode for formatted output
      spaces: 4,
      ignoreComment: true,
      ignoreAttributes: false
    });
    
    return {
      success: true,
      result: formattedXml.trim()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid XML'
    };
  }
}

/**
 * Format YAML string
 */
export function formatYaml(yamlString: string): { success: boolean; result?: string; error?: string } {
  try {
    // Convert YAML to JSON, then back to YAML to format it
    const jsonResult = yamlToJson(yamlString);
    if (!jsonResult.success || !jsonResult.result) {
      return {
        success: false,
        error: jsonResult.error || 'Invalid YAML'
      };
    }
    
    // Convert back to YAML with formatting
    const yamlResult = jsonToYaml(jsonResult.result);
    if (!yamlResult.success || !yamlResult.result) {
      return {
        success: false,
        error: yamlResult.error || 'Failed to format YAML'
      };
    }
    
    return {
      success: true,
      result: yamlResult.result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid YAML'
    };
  }
}

/**
 * Compress JSON string
 */
export function compressJson(jsonString: string): { success: boolean; result?: string; error?: string; originalSize?: number; compressedSize?: number } {
  try {
    const parsed = JSON.parse(jsonString);
    const compressed = JSON.stringify(parsed);
    return {
      success: true,
      result: compressed,
      originalSize: new Blob([jsonString]).size,
      compressedSize: new Blob([compressed]).size
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): { valid: boolean; error?: string; position?: number } {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const match = error.message.match(/position (\d+)/);
      return {
        valid: false,
        error: error.message,
        position: match ? parseInt(match[1]) : undefined
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON'
    };
  }
}

/**
 * Convert JSON to CSV
 */
export function jsonToCsv(jsonString: string): { success: boolean; result?: string; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const arrayData = Array.isArray(data) ? data : [data];
    
    if (arrayData.length === 0) {
      return {
        success: false,
        error: 'JSON array is empty'
      };
    }

    const parser = new Parser();
    const csv = parser.parse(arrayData);
    return {
      success: true,
      result: csv
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

/**
 * Convert JSON to XML
 */
export function jsonToXml(jsonString: string): { success: boolean; result?: string; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    
    // Ensure data has a root node, wrap all data in root node
    let xmlData = data;
    
    // If data is an array, wrap in root node with item elements
    if (Array.isArray(data)) {
      // Convert array to object with root containing item elements
      xmlData = { root: { item: data } };
    } 
    // If data is a primitive type, wrap in root node
    else if (typeof data !== 'object' || data === null) {
      xmlData = { root: { _text: String(data) } };
    }
    // If object, always wrap in root node (unless it already has a single 'root' key)
    else {
      const keys = Object.keys(data);
      // Only skip wrapping if object already has a single 'root' key (might be from previous XML conversion)
      if (keys.length === 1 && keys[0] === 'root') {
        xmlData = data;
      } else {
        xmlData = { root: data };
      }
    }
    
    const xml = json2xml(xmlData, {
      compact: true,
      spaces: 4,
      textKey: '_text',
      cdataKey: '_cdata',
      attributesKey: '_attributes'
    });
    
    return {
      success: true,
      result: xml.trim()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

/**
 * Convert JSON to YAML
 */
export function jsonToYaml(jsonString: string): { success: boolean; result?: string; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const yamlString = yaml.dump(data, { indent: 4 });
    return {
      success: true,
      result: yamlString
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

/**
 * Convert CSV to JSON
 */
export function csvToJson(csvString: string): { success: boolean; result?: string; error?: string } {
  try {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'This feature is only available on the client side'
      };
    }
    
    // Use simple CSV parsing logic
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV data format is incorrect'
      };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Try to parse numbers
        if (value === 'true' || value === 'false') {
          obj[header] = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          obj[header] = Number(value);
        } else {
          obj[header] = value;
        }
      });
      return obj;
    });
    
    return {
      success: true,
      result: JSON.stringify(rows, null, 4)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

/**
 * Recursively process JSON structure after XML conversion, restore _text structure to original values
 */
function normalizeXmlJson(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's an array, recursively process each element
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeXmlJson(item));
  }
  
  // If it's an object
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    
    // If object only has _text key, return its value directly
    if (keys.length === 1 && keys[0] === '_text') {
      const textValue = obj._text;
      // Try to convert to number or boolean
      if (textValue === 'true') return true;
      if (textValue === 'false') return false;
      if (!isNaN(Number(textValue)) && textValue !== '') {
        return Number(textValue);
      }
      return textValue;
    }
    
    // If object has _text and other keys, keep _text value but also process other keys
    const result: any = {};
    for (const key of keys) {
      if (key === '_text') {
        // If only _text key, return its value directly
        if (keys.length === 1) {
          return normalizeXmlJson(obj._text);
        }
        // If there are other keys, ignore _text (because other keys are more important)
        continue;
      } else if (key === '_attributes' || key === '_cdata') {
        // Ignore these metadata keys
        continue;
      } else {
        result[key] = normalizeXmlJson(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Convert XML to JSON
 */
export function xmlToJson(xmlString: string): { success: boolean; result?: string; error?: string } {
  try {
    // Clean XML string, remove possible BOM and extra whitespace
    const cleanedXml = xmlString.trim();
    
    // Check if there is a root node
    if (!cleanedXml.includes('<') || !cleanedXml.includes('>')) {
      return {
        success: false,
        error: 'XML format error: not a valid XML format'
      };
    }
    
    // xml2json returns a JSON string, use compact mode to match jsonToXml output format
    const result = xml2json(cleanedXml, { 
      compact: true, 
      spaces: 4,
      ignoreComment: true,
      ignoreAttributes: false,
      textKey: '_text',
      cdataKey: '_cdata',
      attributesKey: '_attributes',
      ignoreDeclaration: true,
      ignoreInstruction: true,
      ignoreDoctype: true
    });
    
    // Verify result is a string and looks like JSON
    if (typeof result !== 'string') {
      return {
        success: false,
        error: 'XML conversion failed: unexpected result type'
      };
    }
    
    // Check if result looks like JSON (starts with { or [)
    const trimmedResult = result.trim();
    if (!trimmedResult.startsWith('{') && !trimmedResult.startsWith('[')) {
      return {
        success: false,
        error: 'XML conversion failed: result is not valid JSON'
      };
    }
    
    // Parse JSON string
    let jsonData: any;
    try {
      jsonData = JSON.parse(result);
    } catch (parseError) {
      return {
        success: false,
        error: `XML conversion failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`
      };
    }
    
    // Normalize JSON structure, restore _text structure to original values
    const normalized = normalizeXmlJson(jsonData);
    
    // If normalized data only has one root key and this root is the wrapper node we added, unwrap it
    if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
      const keys = Object.keys(normalized);
      if (keys.length === 1 && keys[0] === 'root') {
        const rootContent = normalized.root;
        // If root content is an object with only 'item' key and item is an array, return the array directly
        // This handles the case where JSON array was converted to XML with item wrapper
        if (rootContent && typeof rootContent === 'object' && !Array.isArray(rootContent)) {
          const rootKeys = Object.keys(rootContent);
          if (rootKeys.length === 1 && rootKeys[0] === 'item' && Array.isArray(rootContent.item)) {
            return {
              success: true,
              result: JSON.stringify(rootContent.item, null, 4)
            };
          }
        }
        return {
          success: true,
          result: JSON.stringify(rootContent, null, 4)
        };
      }
    }
    
    return {
      success: true,
      result: JSON.stringify(normalized, null, 4)
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'XML conversion failed';
    // Provide more user-friendly error messages
    if (errorMessage.includes('Text data outside of root node')) {
      return {
        success: false,
        error: 'XML format error: text data exists outside root node, please ensure XML has only one root node'
      };
    }
    return {
      success: false,
      error: `XML conversion failed: ${errorMessage}`
    };
  }
}

/**
 * Convert YAML to JSON
 */
export function yamlToJson(yamlString: string): { success: boolean; result?: string; error?: string } {
  try {
    const data = yaml.load(yamlString);
    return {
      success: true,
      result: JSON.stringify(data, null, 4)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
}

/**
 * Detect content format
 */
export function detectFormat(content: string): 'json' | 'xml' | 'yaml' | null {
  if (!content || !content.trim()) {
    return null;
  }
  
  const trimmed = content.trim();
  
  // Detect XML: starts with <, contains tag structure
  if (trimmed.startsWith('<') && trimmed.includes('>') && trimmed.includes('</')) {
    return 'xml';
  }
  
  // Detect YAML: contains YAML features (colon, indentation, dashes, etc.)
  // YAML usually appears as key-value pairs, separated by colons
  if (trimmed.includes(':') && (trimmed.includes('\n') || trimmed.includes('  '))) {
    // Check if it's valid YAML
    try {
      yaml.load(trimmed);
      // If not JSON format, determine as YAML
      try {
        JSON.parse(trimmed);
        // If both JSON and YAML, prioritize JSON (because JSON is stricter)
      } catch {
        return 'yaml';
      }
    } catch {
      // YAML parsing failed, continue detecting JSON
    }
  }
  
  // Detect JSON: try to parse
  try {
    JSON.parse(trimmed);
    return 'json';
  } catch {
    // JSON parsing failed
  }
  
  return null;
}

/**
 * Detect content format and convert to JSON
 */
export function convertToJson(content: string, currentType: 'json' | 'xml' | 'yaml' | null): { success: boolean; result?: string; error?: string } {
  if (currentType === null || currentType === 'json') {
    // Try to parse as JSON
    try {
      JSON.parse(content);
      return { success: true, result: content };
    } catch {
      return { success: false, error: 'Unrecognized content format' };
    }
  }
  
  switch (currentType) {
    case 'xml':
      return xmlToJson(content);
    case 'yaml':
      return yamlToJson(content);
    default:
      return { success: false, error: 'Unsupported type' };
  }
}

/**
 * Universal format conversion function: supports conversion between any formats
 */
export function convertFormat(
  content: string,
  fromType: 'json' | 'xml' | 'yaml' | null,
  toType: 'json' | 'xml' | 'yaml'
): { success: boolean; result?: string; error?: string } {
  // If source format and target format are the same, return directly
  if (fromType === toType) {
    return { success: true, result: content };
  }

  // First convert to JSON (as intermediate format)
  const jsonResult = convertToJson(content, fromType);
  if (!jsonResult.success || !jsonResult.result) {
    return { success: false, error: jsonResult.error || 'Unable to convert to JSON' };
  }

  // Convert from JSON to target format
  switch (toType) {
    case 'json':
      return formatJson(jsonResult.result);
    case 'xml':
      return jsonToXml(jsonResult.result);
    case 'yaml':
      return jsonToYaml(jsonResult.result);
    default:
      return { success: false, error: 'Unsupported target format' };
  }
}

/**
 * JSONPath query
 */
export async function queryJsonPath(jsonString: string, path: string): Promise<{ success: boolean; result?: any[]; error?: string }> {
  try {
    // Dynamically import jsonpath, only use on client side
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'This feature is only available on the client side'
      };
    }
    
    const jsonpathModule = await import('jsonpath');
    const jsonpath = jsonpathModule.default || jsonpathModule;
    
    const data = JSON.parse(jsonString);
    const results = jsonpath.query(data, path);
    return {
      success: true,
      result: results
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Query failed'
    };
  }
}

