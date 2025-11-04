import { ConnectionParams, SavedConnection } from '../types';

const CONNECTIONS_KEY = 's3-file-viewer-connections';

/**
 * Generate a unique ID for connection
 */
function generateConnectionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Generate connection name from endpoint and access_key
 */
function generateConnectionName(conn: ConnectionParams): string {
  const endpoint = conn.endpoint || 'Unknown';
  const accessKey = conn.access_key || 'Unknown';
  return `${endpoint} (${accessKey.substring(0, 8)}...)`;
}

/**
 * Load all saved connections from localStorage
 */
export function loadSavedConnections(): SavedConnection[] {
  try {
    const stored = localStorage.getItem(CONNECTIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load saved connections:', error);
    return [];
  }
}

/**
 * Save a new connection to localStorage
 */
export function saveConnection(
  conn: ConnectionParams,
  name?: string
): SavedConnection {
  const connections = loadSavedConnections();

  const savedConnection: SavedConnection = {
    ...conn,
    id: generateConnectionId(),
    name: name || generateConnectionName(conn),
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
  };

  // Check if a similar connection already exists
  const existingIndex = connections.findIndex(
    (c) => c.endpoint === conn.endpoint && c.access_key === conn.access_key
  );

  if (existingIndex >= 0) {
    // Update existing connection
    connections[existingIndex] = {
      ...connections[existingIndex],
      ...conn,
      last_used: new Date().toISOString(),
    };
  } else {
    // Add new connection
    connections.unshift(savedConnection);
  }

  // Keep only the latest 10 connections
  const limitedConnections = connections.slice(0, 10);

  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(limitedConnections));
  } catch (error) {
    console.error('Failed to save connection:', error);
  }

  return savedConnection;
}

/**
 * Remove a saved connection
 */
export function removeSavedConnection(id: string): void {
  const connections = loadSavedConnections();
  const filtered = connections.filter((c) => c.id !== id);

  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove connection:', error);
  }
}

/**
 * Update an existing connection
 */
export function updateConnection(
  id: string,
  updates: Partial<SavedConnection>
): void {
  const connections = loadSavedConnections();
  const index = connections.findIndex((c) => c.id === id);

  if (index >= 0) {
    connections[index] = {
      ...connections[index],
      ...updates,
      id, // Keep the same ID
      last_used: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  }
}

/**
 * Update last used time for a connection
 */
export function updateConnectionLastUsed(conn: ConnectionParams): void {
  const connections = loadSavedConnections();
  const index = connections.findIndex(
    (c) => c.endpoint === conn.endpoint && c.access_key === conn.access_key
  );

  if (index >= 0) {
    connections[index].last_used = new Date().toISOString();
    try {
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
    } catch (error) {
      console.error('Failed to update connection last used:', error);
    }
  }
}

/**
 * Reorder connections and save to localStorage
 */
export function reorderConnections(connections: SavedConnection[]): void {
  try {
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  } catch (error) {
    console.error('Failed to reorder connections:', error);
  }
}

/**
 * Convert SavedConnection to ConnectionParams
 */
export function toConnectionParams(saved: SavedConnection): ConnectionParams {
  return {
    endpoint: saved.endpoint,
    access_key: saved.access_key,
    secret_key: saved.secret_key,
    region: saved.region,
  };
}
