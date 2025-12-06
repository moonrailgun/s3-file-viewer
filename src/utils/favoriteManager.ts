import { Favorite } from '../types';

const FAVORITES_KEY = 's3-file-viewer-favorites';

/**
 * Generate a unique ID for favorite
 */
function generateFavoriteId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Load all favorites from localStorage
 */
export function loadFavorites(): Favorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

/**
 * Save a new favorite to localStorage
 */
export function saveFavorite(
  connectionId: string,
  bucket: string,
  prefix: string,
  name?: string
): Favorite {
  const favorites = loadFavorites();

  // Generate default name if not provided
  const defaultName = prefix
    ? `${bucket}/${prefix}`
    : bucket;

  const newFavorite: Favorite = {
    id: generateFavoriteId(),
    name: name || defaultName,
    connectionId,
    bucket,
    prefix,
    createdAt: new Date().toISOString(),
  };

  // Check if a similar favorite already exists
  const existingIndex = favorites.findIndex(
    (f) =>
      f.connectionId === connectionId &&
      f.bucket === bucket &&
      f.prefix === prefix
  );

  if (existingIndex >= 0) {
    // Update existing favorite
    favorites[existingIndex] = {
      ...favorites[existingIndex],
      name: name || favorites[existingIndex].name,
    };
  } else {
    // Add new favorite at the beginning
    favorites.unshift(newFavorite);
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorite:', error);
  }

  return newFavorite;
}

/**
 * Remove a favorite
 */
export function removeFavorite(id: string): void {
  const favorites = loadFavorites();
  const filtered = favorites.filter((f) => f.id !== id);

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

/**
 * Update an existing favorite
 */
export function updateFavorite(
  id: string,
  updates: Partial<Favorite>
): void {
  const favorites = loadFavorites();
  const index = favorites.findIndex((f) => f.id === id);

  if (index >= 0) {
    favorites[index] = {
      ...favorites[index],
      ...updates,
      id, // Keep the same ID
    };

    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  }
}

/**
 * Reorder favorites and save to localStorage
 */
export function reorderFavorites(favorites: Favorite[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to reorder favorites:', error);
  }
}

/**
 * Check if a location is already favorited
 */
export function isFavorited(
  connectionId: string,
  bucket: string,
  prefix: string
): boolean {
  const favorites = loadFavorites();
  return favorites.some(
    (f) =>
      f.connectionId === connectionId &&
      f.bucket === bucket &&
      f.prefix === prefix
  );
}

/**
 * Get favorite by location
 */
export function getFavoriteByLocation(
  connectionId: string,
  bucket: string,
  prefix: string
): Favorite | undefined {
  const favorites = loadFavorites();
  return favorites.find(
    (f) =>
      f.connectionId === connectionId &&
      f.bucket === bucket &&
      f.prefix === prefix
  );
}
