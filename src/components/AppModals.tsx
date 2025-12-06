import React from 'react';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CreateFolderModal } from './CreateFolderModal';
import { CreateBucketModal } from './CreateBucketModal';
import { BucketDetailsModal } from './BucketDetailsModal';
import { ConfirmModal } from './ConfirmModal';
import { RenameFavoriteModal } from './RenameFavoriteModal';
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

  // Rename favorite modal
  renameFavoriteModalOpened: boolean;
  favoriteToRename: { id: string; name: string } | null;
  onRenameFavoriteClose: () => void;
  onRenameFavoriteConfirm: (newName: string) => void;

  // Delete favorite modal
  deleteFavoriteModalOpened: boolean;
  favoriteToDelete: { id: string; name: string } | null;
  onDeleteFavoriteClose: () => void;
  onDeleteFavoriteConfirm: () => void;
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
    renameFavoriteModalOpened,
    favoriteToRename,
    onRenameFavoriteClose,
    onRenameFavoriteConfirm,
    deleteFavoriteModalOpened,
    favoriteToDelete,
    onDeleteFavoriteClose,
    onDeleteFavoriteConfirm,
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

        {/* Rename Favorite Modal */}
        <RenameFavoriteModal
          opened={renameFavoriteModalOpened}
          onClose={onRenameFavoriteClose}
          onConfirm={onRenameFavoriteConfirm}
          currentName={favoriteToRename?.name || ''}
        />

        {/* Delete Favorite Confirmation Modal */}
        <ConfirmModal
          opened={deleteFavoriteModalOpened}
          onClose={onDeleteFavoriteClose}
          onConfirm={onDeleteFavoriteConfirm}
          title="Remove Favorite"
          message="Are you sure you want to remove this favorite?"
          itemName={favoriteToDelete?.name || ''}
          confirmLabel="Remove"
          confirmColor="red"
        />
      </>
    );
  }
);

AppModals.displayName = 'AppModals';
