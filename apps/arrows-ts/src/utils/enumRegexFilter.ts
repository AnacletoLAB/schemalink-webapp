import { loadEnumRegexPreferences } from '../actions/localStorage';
import { 
  fetchEnumRegistry, 
  fetchRegexRegistry, 
  getCachedEnumRegistry as getCachedEnumRegistryFromService, 
  getCachedRegexRegistry as getCachedRegexRegistryFromService,
  clearRegistryCache 
} from '@neo4j-arrows/linkml';

/**
 * Loads server enum registry (uses shared cache from registryService)
 */
const loadServerEnumRegistry = async (): Promise<void> => {
  try {
    await fetchEnumRegistry();
    // Trigger re-render of components that use enums
    window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
  } catch (error) {
    console.warn('Failed to load server enum registry:', error);
  }
};

/**
 * Loads server regex registry (uses shared cache from registryService)
 */
const loadServerRegexRegistry = async (): Promise<void> => {
  try {
    await fetchRegexRegistry();
    // Trigger re-render of components that use regexes
    window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
  } catch (error) {
    console.warn('Failed to load server regex registry:', error);
  }
};

/**
 * Gets filtered enum types based on user preferences
 * Returns only server-loaded enums that are not hidden by user preferences
 */
export const getFilteredEnumTypes = (): string[] => {
  const preferences = loadEnumRegexPreferences();
  const hiddenEnums = preferences.hiddenEnums || [];
  
  // Use shared cache from registryService
  const enumRegistry = getCachedEnumRegistryFromService();
  
  // Load server registry if not already loaded
  if (enumRegistry === null) {
    loadServerEnumRegistry();
    return []; // Return empty array until loaded
  }

  // Return only server-loaded enums
  return Object.keys(enumRegistry).filter(
    (enumName) => !hiddenEnums.includes(enumName)
  );
};

/**
 * Gets filtered regex types based on user preferences
 * Returns only server-loaded regexes that are not hidden by user preferences
 */
export const getFilteredRegexTypes = (): string[] => {
  const preferences = loadEnumRegexPreferences();
  const hiddenRegexes = preferences.hiddenRegexes || [];
  
  // Use shared cache from registryService
  const regexRegistry = getCachedRegexRegistryFromService();
  
  // Load server registry if not already loaded
  if (regexRegistry === null) {
    loadServerRegexRegistry();
    return []; // Return empty array until loaded
  }

  // Return only server-loaded regexes
  return Object.keys(regexRegistry).filter(
    (regexName) => !hiddenRegexes.includes(regexName)
  );
};

/**
 * Gets the cached enum registry (returns null if not loaded yet)
 * Wrapper around registryService for backward compatibility
 */
export const getCachedEnumRegistry = (): Record<string, any> | null => {
  return getCachedEnumRegistryFromService();
};

/**
 * Gets the cached regex registry (returns null if not loaded yet)
 * Wrapper around registryService for backward compatibility
 */
export const getCachedRegexRegistry = (): Record<string, any> | null => {
  return getCachedRegexRegistryFromService();
};

/**
 * Ensures both registries are loaded and returns them
 * Uses shared cache from registryService
 */
export const getServerRegistries = async (): Promise<{
  enums: Record<string, any>;
  regexes: Record<string, any>;
}> => {
  await Promise.all([
    loadServerEnumRegistry(),
    loadServerRegexRegistry()
  ]);
  
  return {
    enums: getCachedEnumRegistryFromService() || {},
    regexes: getCachedRegexRegistryFromService() || {},
  };
};

/**
 * Clears the server registry cache (call after adding/updating enums/regexes)
 * Clears the shared cache from registryService
 */
export const clearServerRegistryCache = () => {
  clearRegistryCache();
  // Trigger re-render of components that use enums/regexes
  window.dispatchEvent(new CustomEvent('enumRegexPreferencesChanged'));
};

/**
 * Preloads server registries (call this early in app initialization)
 * Uses shared cache from registryService
 */
export const preloadServerRegistries = () => {
  // Trigger async loading (they share the same cache)
  fetchEnumRegistry().catch(err => console.warn('Failed to preload enum registry:', err));
  fetchRegexRegistry().catch(err => console.warn('Failed to preload regex registry:', err));
};
