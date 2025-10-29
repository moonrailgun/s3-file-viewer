import React from 'react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CreateFolderModal } from './CreateFolderModal';
import { ConfirmModal } from './ConfirmModal';

interface AppModalsProps {
  // Delete file modal
  deleteModalOpened: boolean;
  fileToDelete: string | null;
  deletingFile: boolean;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;

  // Create folder modal
  createFolderModalOpened: boolean;
  onCreateFolderClose: () => void;
  onCreateFolderConfirm: (name: string) => Promise<void>;

  // Delete connection modal
  deleteConnectionModalOpened: boolean;
  connectionToDelete: { id: string; name: string } | null;
  onDeleteConnectionClose: () => void;
  onDeleteConnectionConfirm: () => void;
}

/**
 * All modals used in the application
 * Extracted to reduce App.tsx complexity
 */
export const AppModals = React.memo(
  ({
    deleteModalOpened,
    fileToDelete,
    deletingFile,
    onDeleteCancel,
    onDeleteConfirm,
    createFolderModalOpened,
    onCreateFolderClose,
    onCreateFolderConfirm,
    deleteConnectionModalOpened,
    connectionToDelete,
    onDeleteConnectionClose,
    onDeleteConnectionConfirm,
  }: AppModalsProps) => {
    return (
      <>
        {/* Delete File Confirmation Modal */}
        <DeleteConfirmModal
          opened={deleteModalOpened}
          onClose={onDeleteCancel}
          onConfirm={onDeleteConfirm}
          fileName={fileToDelete || ''}
          loading={deletingFile}
        />

        {/* Create Folder Modal */}
        <CreateFolderModal
          opened={createFolderModalOpened}
          onClose={onCreateFolderClose}
          onConfirm={onCreateFolderConfirm}
        />

        {/* Delete Connection Confirmation Modal */}
        <ConfirmModal
          opened={deleteConnectionModalOpened}
          onClose={onDeleteConnectionClose}
          onConfirm={onDeleteConnectionConfirm}
          title="Delete Connection"
          message="Are you sure you want to delete this connection?"
          itemName={connectionToDelete?.name || ''}
          confirmLabel="Delete"
          confirmColor="red"
        />
      </>
    );
  }
);

AppModals.displayName = 'AppModals';
