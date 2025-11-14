import { Parser } from 'json2csv';
import yaml from 'js-yaml';
import { json2xml, xml2json } from 'xml-js';

/**
 * Format JSON string
 */
export function formatJson(jsonString: string): { success: boolean; result?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      success: true,
      result: JSON.stringify(parsed, null, 2)
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
      spaces: 2,
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
      spaces: 2,
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
    
    // Ensure data has a root node, if already an object with a single root node use it directly, otherwise wrap in root
    let xmlData = data;
    
    // If data is an array, wrap in root node
    if (Array.isArray(data)) {
      xmlData = { root: data };
    } 
    // If data is a primitive type, wrap in root node
    else if (typeof data !== 'object' || data === null) {
      xmlData = { root: { _text: String(data) } };
    }
    // If object has multiple top-level keys, wrap in root node
    else {
      const keys = Object.keys(data);
      if (keys.length > 1) {
        xmlData = { root: data };
      }
    }
    
    const xml = json2xml(xmlData, {
      compact: true,
      spaces: 2,
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
    const yamlString = yaml.dump(data, { indent: 2 });
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
      result: JSON.stringify(rows, null, 2)
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
      spaces: 2,
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
        return {
          success: true,
          result: JSON.stringify(normalized.root, null, 2)
        };
      }
    }
    
    return {
      success: true,
      result: JSON.stringify(normalized, null, 2)
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
      result: JSON.stringify(data, null, 2)
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

