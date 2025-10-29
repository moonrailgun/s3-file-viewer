import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

/**
 * Custom hook to listen for connection-created events from connection form window
 */
export function useConnectionEventListener(
  onConnectionCreated: (connectionId: string) => void
) {
  useEffect(() => {
    const unlisten = listen('connection-created', (event: any) => {
      const { connectionId } = event.payload;
      if (connectionId) {
        // Trigger a reconnection or refresh to pick up the new connection
        setTimeout(() => {
          onConnectionCreated(connectionId);
        }, 100);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [onConnectionCreated]);
}
