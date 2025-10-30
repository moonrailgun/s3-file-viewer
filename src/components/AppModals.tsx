import React from 'react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CreateFolderModal } from './CreateFolderModal';
import { CreateBucketModal } from './CreateBucketModal';
import { BucketDetailsModal } from './BucketDetailsModal';
import { ConfirmModal } from './ConfirmModal';
import type { BucketInfo } from '../types';

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

  // Create bucket modal
  createBucketModalOpened: boolean;
  onCreateBucketClose: () => void;
  onCreateBucketConfirm: (bucketName: string, region: string) => Promise<void>;
  currentRegion: string;

  // Delete connection modal
  deleteConnectionModalOpened: boolean;
  connectionToDelete: { id: string; name: string } | null;
  onDeleteConnectionClose: () => void;
  onDeleteConnectionConfirm: () => void;

  // Bucket details modal
  bucketDetailsModalOpened: boolean;
  bucketToShow: BucketInfo | null;
  onBucketDetailsClose: () => void;
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
    createBucketModalOpened,
    onCreateBucketClose,
    onCreateBucketConfirm,
    currentRegion,
    deleteConnectionModalOpened,
    connectionToDelete,
    onDeleteConnectionClose,
    onDeleteConnectionConfirm,
    bucketDetailsModalOpened,
    bucketToShow,
    onBucketDetailsClose,
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

        {/* Create Bucket Modal */}
        <CreateBucketModal
          opened={createBucketModalOpened}
          onClose={onCreateBucketClose}
          onConfirm={onCreateBucketConfirm}
          currentRegion={currentRegion}
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

        {/* Bucket Details Modal */}
        <BucketDetailsModal
          opened={bucketDetailsModalOpened}
          onClose={onBucketDetailsClose}
          bucket={bucketToShow}
        />
      </>
    );
  }
);

AppModals.displayName = 'AppModals';
