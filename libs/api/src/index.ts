/// <reference types="vite/client" />
import { Node, Ontology, Relationship } from '@neo4j-arrows/model';
export const generate = async (
  prompt: string,
  url: string,
  operation: string,
  classesNames: Node[],
  associationsNames: string[],
  fullSchema: any
): Promise<string> => {
  const body = JSON.stringify({
    prompt,
    operation,
    classes_names: classesNames,
    associations_names: associationsNames,
    full_schema: fullSchema,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
  // const response = await fetch(url, {
  //   body: prompt,
  //   method: 'POST',
  // });

  if (!response.ok) {
    if (response.status === 409) {
      alert("OpenAI rate or fund limit exceeded. An email will be sent to the admin.");
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error || "An error occurred while generating the response.";
      alert(errorMessage);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  return await response.text();
};

export const edit = async (
  linkmlSchema: string,
  linkmlSelection: string | null,
  prompt: string,
  url: string,
  operation: string,
  classesNames: Node[],
  associationsNames: string[]
): Promise<string> => {
  const fullPrompt = `
Given this LinkML schema\n\n
${linkmlSchema}\n\n
${
  linkmlSelection
    ? `Given this selection of classes in that schema\n\n${linkmlSelection}\n\n`
    : ''
}
Perform this operation\n\n
${prompt}\n\n
Return an updated version of the full LinkML schema`;

  return generate(fullPrompt, url, operation, classesNames, associationsNames, linkmlSchema);
};

interface ValidationIssue {
  message: string;
}

interface ValidateLinkmlResponse {
  validationIssues: ValidationIssue[];
  error: string;
}

export const validateLinkml = async (
  linkml: string,
  url: string
): Promise<ValidateLinkmlResponse> => {
  return fetch(url, {
    body: linkml,
    method: 'POST',
  })
    .then((response) =>
      response.status === 200
        ? response.json().then((data) => {
            return { validationIssues: data, error: '' };
          })
        : {
            validationIssues: [],
            error: `The server returned status ${response.status}`,
          }
    )
    .catch((e) => {
      return { validationIssues: [], error: e.message };
    });
};

export const genPydantic = async (
  linkml: string,
  url: string
): Promise<Blob> => {
  return fetch(url, {
    body: linkml,
    method: 'POST',
  }).then((response) => response.blob());
};

interface TranslateLinkMLOOResponse {
  ontologies?: Ontology[];
  nodes: Array<{
    id: string;
    caption: string;
    style?: Record<string, string>;
    properties: Record<string, any>;
    description?: string;
    position: { x: number; y: number };
    entityType: string;
    ontologies?: any[];
    examples?: string[];
  }>;
  relationships: Array<{
    id: string;
    type: string;
    fromId: string;
    toId: string;
    relationshipType: string;
    entityType: string;
    style?: Record<string, string>;
    properties?: Record<string, any>;
    source_minimum_cardinality?: number;
    source_maximum_cardinality?: number | string;
    target_minimum_cardinality?: number;
    target_maximum_cardinality?: number | string;
    description?: string;
    navigation?: string;
    ontologies?: any[];
    examples?: Array<{ value: string }>;
  }>;
  style?: Record<string, any>;
  description?: string;
  license?: string;
}

export interface ExportLinkMLOOResponse {
  yaml_schema: string;
}

export const exportLinkMLOO = async (
  graphJson: Record<string, any>,
  url?: string,
  signal?: AbortSignal,
  timeoutMs: number = 30000
): Promise<string> => {
  const endpoint = url || import.meta.env['VITE_EXPORT_LINKML_OO_ENDPOINT'];
  
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  
  const combinedSignal = signal 
    ? (() => {
        const combined = new AbortController();
        signal.addEventListener('abort', () => combined.abort());
        timeoutController.signal.addEventListener('abort', () => combined.abort());
        return combined.signal;
      })()
    : timeoutController.signal;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        graph_json: graphJson,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.detail || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.yaml_content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || timeoutController.signal.aborted) {
      if (signal?.aborted) {
        throw new Error('Request was cancelled.');
      } else {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds.`);
      }
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Network error: Unable to connect to the server.');
    }
    
    throw error;
  }
};

export const translateLinkMLOO = async (
  yamlContent: string,
  url?: string,
  signal?: AbortSignal,
  timeoutMs: number = 30000
): Promise<TranslateLinkMLOOResponse> => {
  const endpoint = url || import.meta.env['VITE_LINKML_OO_TRANSLATE_ENDPOINT'];
  
  // Create timeout controller
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  
  // Combine abort signals
  const combinedSignal = signal 
    ? (() => {
        const combined = new AbortController();
        signal.addEventListener('abort', () => combined.abort());
        timeoutController.signal.addEventListener('abort', () => combined.abort());
        return combined.signal;
      })()
    : timeoutController.signal;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        yaml_content: yamlContent,
        return_visual: true,
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData?.detail || `Request failed with status ${response.status}`;
      
      // Improve error messages
      if (response.status === 400) {
        errorMessage = `Invalid LinkML schema: ${errorData?.detail || 'Please check your YAML format.'}`;
      } else if (response.status === 500) {
        errorMessage = `Server error: ${errorData?.detail || 'The server encountered an error processing your schema.'}`;
      } else if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (response.status === 0 || response.status === 408) {
        errorMessage = 'Request timed out. The server took too long to respond.';
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle abort/timeout errors
    if (error.name === 'AbortError' || timeoutController.signal.aborted) {
      if (signal?.aborted) {
        throw new Error('Request was cancelled.');
      } else {
        throw new Error(`Request timed out after ${timeoutMs / 1000} seconds. Please try again with a smaller schema or check your network connection.`);
      }
    }
    
    // Handle network errors
    if (error.message && !error.message.includes('Request failed')) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      }
    }
    
    throw error;
  }
};
