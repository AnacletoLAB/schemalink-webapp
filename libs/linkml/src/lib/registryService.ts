/// <reference types="vite/client" />
/**
 * Registry Service for fetching enum and regex registries from server
 * Caches the data to avoid repeated fetches
 */

type EnumRegistryEntry = {
  permissible_values?: string[];
  reachable_from?: {
    source_ontology: string;
    source_nodes: string[];
    relationship_types?: string[];
  };
};

type RegexRegistryEntry = {
  name: string;
  expression: string;
};


let enumRegistryCache: Record<string, EnumRegistryEntry> | null = null;
let regexRegistryCache: Record<string, RegexRegistryEntry> | null = null;
let enumRegistryPromise: Promise<Record<string, EnumRegistryEntry>> | null = null;
let regexRegistryPromise: Promise<Record<string, RegexRegistryEntry>> | null = null;

/**
 * Fetches enum registry from server
 */
export const fetchEnumRegistry = async (): Promise<Record<string, EnumRegistryEntry>> => {
  if (enumRegistryCache) {
    return enumRegistryCache;
  }

  if (enumRegistryPromise) {
    return enumRegistryPromise;
  }

  enumRegistryPromise = (async () => {
    try {
      const endpoint = import.meta.env['VITE_ENUM_REGISTRY_ENDPOINT'];
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache', // Ensure fresh data on page refresh
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch enum registry: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      enumRegistryCache = data;
      return data;
    } catch (error) {
      enumRegistryPromise = null; // Reset promise on error
      throw error;
    }
  })();

  return enumRegistryPromise;
};

/**
 * Fetches regex registry from server
 */
export const fetchRegexRegistry = async (): Promise<Record<string, RegexRegistryEntry>> => {
  if (regexRegistryCache) {
    return regexRegistryCache;
  }

  if (regexRegistryPromise) {
    return regexRegistryPromise;
  }

  regexRegistryPromise = (async () => {
    try {
      const endpoint = import.meta.env['VITE_REGEX_REGISTRY_ENDPOINT'];
      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache', // Ensure fresh data on page refresh
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch regex registry: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      regexRegistryCache = data;
      return data;
    } catch (error) {
      regexRegistryPromise = null; // Reset promise on error
      throw error;
    }
  })();

  return regexRegistryPromise;
};

/**
 * Clears the registry cache (useful after updates)
 */
export const clearRegistryCache = () => {
  enumRegistryCache = null;
  regexRegistryCache = null;
  enumRegistryPromise = null;
  regexRegistryPromise = null;
};

/**
 * Gets the cached enum registry synchronously (returns null if not loaded)
 */
export const getCachedEnumRegistry = (): Record<string, EnumRegistryEntry> | null => {
  return enumRegistryCache;
};

/**
 * Gets the cached regex registry synchronously (returns null if not loaded)
 */
export const getCachedRegexRegistry = (): Record<string, RegexRegistryEntry> | null => {
  return regexRegistryCache;
};

/**
 * Gets enum registry entry for a given enum type
 * Checks cache first (synchronous), falls back to async fetch if cache missing
 */
export const getEnumRegistryEntry = async (enumType: string): Promise<EnumRegistryEntry | null> => {
  // Check cache first (synchronous) - should be available if preloaded
  if (enumRegistryCache) {
    const entry = enumRegistryCache[enumType];
    if (!entry) {
      return null;
    }
    return {
      permissible_values: entry.permissible_values,
      reachable_from: entry.reachable_from,
    };
  }

  // Fallback to async fetch if cache not available (shouldn't happen if preloaded)
  try {
    const registry = await fetchEnumRegistry();
    const entry = registry[enumType];
    if (!entry) {
      return null;
    }
    return {
      permissible_values: entry.permissible_values,
      reachable_from: entry.reachable_from,
    };
  } catch (error) {
    console.warn(`Failed to fetch enum registry entry for ${enumType}:`, error);
    return null;
  }
};

/**
 * Gets enum registry entry synchronously from cache (returns null if cache not available or entry not found)
 */
export const getCachedEnumRegistryEntry = (enumType: string): EnumRegistryEntry | null => {
  if (!enumRegistryCache) {
    return null;
  }
  const entry = enumRegistryCache[enumType];
  if (!entry) {
    return null;
  }
  return {
    permissible_values: entry.permissible_values,
    reachable_from: entry.reachable_from,
  };
};

/**
 * Gets regex pattern for a given regex type (synchronous - uses cache only)
 */
export const getRegexPattern = (regexType: string): string | null => {
  // Use cached registry (synchronous) - should be available if preloaded
  if (!regexRegistryCache) {
    console.warn(`Regex registry not preloaded - cannot get pattern for ${regexType}`);
    return null;
  }
  
  const entry = regexRegistryCache[regexType];
  return entry?.expression || null;
};

/**
 * Gets regex pattern synchronously from cache (returns null if cache not available or entry not found)
 */
export const getCachedRegexPattern = (regexType: string): string | null => {
  if (!regexRegistryCache) {
    return null;
  }
  const entry = regexRegistryCache[regexType];
  return entry?.expression || null;
};

/**
 * Gets all enum permissible values for a given enum type
 */
export const getEnumPermissibleValues = async (enumType: string): Promise<string[] | null> => {
  const entry = await getEnumRegistryEntry(enumType);
  return entry?.permissible_values || null;
};

/**
 * Builds regexToPattern map from server registry
 * Checks cache first (synchronous), falls back to async fetch if cache missing
 */
export const buildRegexToPattern = async (): Promise<Record<string, string>> => {
  // Check cache first (synchronous) - should be available if preloaded
  let registry = getCachedRegexRegistry();
  
  // Fallback to async fetch if cache not available (shouldn't happen if preloaded)
  if (!registry) {
    registry = await fetchRegexRegistry();
  }
  
  const result: Record<string, string> = {};
  for (const [name, entry] of Object.entries(registry)) {
    if (entry.expression) {
      result[name] = entry.expression;
    }
  }
  return result;
};

/**
 * Builds enumToPermissibleValues map from server registry
 * Checks cache first (synchronous), falls back to async fetch if cache missing
 */
export const buildEnumToPermissibleValues = async (): Promise<Record<string, string[]>> => {
  // Check cache first (synchronous) - should be available if preloaded
  let registry = getCachedEnumRegistry();
  
  // Fallback to async fetch if cache not available (shouldn't happen if preloaded)
  if (!registry) {
    registry = await fetchEnumRegistry();
  }
  
  const result: Record<string, string[]> = {};
  for (const [name, entry] of Object.entries(registry)) {
    if (entry.permissible_values) {
      result[name] = entry.permissible_values;
    }
  }
  return result;
};

/**
 * Builds patternToRegexType map from server registry (reverse lookup)
 * Checks cache first (synchronous), falls back to async fetch if cache missing
 */
export const buildPatternToRegexType = async (): Promise<Record<string, string>> => {
  // Check cache first (synchronous) - should be available if preloaded
  let registry = getCachedRegexRegistry();
  
  // Fallback to async fetch if cache not available (shouldn't happen if preloaded)
  if (!registry) {
    registry = await fetchRegexRegistry();
  }
  
  const result: Record<string, string> = {};
  for (const [name, entry] of Object.entries(registry)) {
    if (entry.expression) {
      result[entry.expression] = name;
    }
  }
  return result;
};

