import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { removeSavedConnection } from '../utils/connectionManager';

interface UseConnectionOperationsProps {
  deleteConnectionFromState: (connectionId: string) => void;
}

/**
 * Custom hook for connection operations (delete, etc.)
 */
export function useConnectionOperations({
  deleteConnectionFromState,
}: UseConnectionOperationsProps) {
  const [deleteConnectionModalOpened, setDeleteConnectionModalOpened] =
    useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleRequestDeleteConnection = useCallback(
    (connectionId: string, connectionName: string) => {
      setConnectionToDelete({ id: connectionId, name: connectionName });
      setDeleteConnectionModalOpened(true);
    },
    []
  );

  const handleDeleteConnectionConfirm = useCallback(() => {
    if (!connectionToDelete) return;

    removeSavedConnection(connectionToDelete.id);
    deleteConnectionFromState(connectionToDelete.id);

    notifications.show({
      message: `Connection "${connectionToDelete.name}" deleted`,
      color: 'green',
      position: 'bottom-right',
    });

    setDeleteConnectionModalOpened(false);
    setConnectionToDelete(null);
  }, [connectionToDelete, deleteConnectionFromState]);

  const handleDeleteConnectionClose = useCallback(() => {
    setDeleteConnectionModalOpened(false);
    setConnectionToDelete(null);
  }, []);

  return {
    deleteConnectionModalOpened,
    connectionToDelete,
    handleRequestDeleteConnection,
    handleDeleteConnectionConfirm,
    handleDeleteConnectionClose,
  };
}
