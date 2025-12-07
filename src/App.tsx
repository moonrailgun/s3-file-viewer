import { useState, useCallback } from 'react';
import { AppShell, Modal } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useS3Browser } from './hooks/useS3Browser';
import { useFileDrop } from './hooks/useFileDrop';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useFileOperations } from './hooks/useFileOperations';
import { useConnectionOperations } from './hooks/useConnectionOperations';
import { useConnectionEventListener } from './hooks/useConnectionEventListener';
import { useBreadcrumbs } from './hooks/useBreadcrumbs.tsx';
import {
  openConnectionForm,
  openEditConnectionForm,
} from './utils/connectionWindow';
import { ConnectionSidebar } from './components/ConnectionSidebar';
import { CompactToolbar } from './components/CompactToolbar';
import { MainContentArea } from './components/MainContentArea';
import { EmptyState } from './components/EmptyState';
import { ContextMenuWrapper } from './components/ContextMenuWrapper';
import { AppModals } from './components/AppModals';
import { UploadProgressList } from './components/UploadProgressBar';
import { FileDetailsSidebar } from './components/FileDetailsSidebar';
import type { S3ObjectInfo, BucketInfo, Favorite } from './types';
import { isMobilePlatform } from './utils/platform';
import {
  saveFavorite,
  removeFavorite,
  updateFavorite,
  isFavorited,
  getFavoriteByLocation,
} from './utils/favoriteManager';

function App() {
  const {
    loading,
    objects,
    view,
    bucket,
    prefix,
    uploadProgress,
    activeConnectionId,
    connectionBuckets,
    connectionLoading,
    connSafe,
    searchQuery,
    searchMode,
    isSearching,
    hasMore,
    loadingMore,
    setView,
    setPrefix,
    ensureObjectUrl,
    fetchObjects,
    deleteObject,
    createFolder,
    createBucket,
    uploadFile,
    connectToSavedConnection,
    refreshConnectionBuckets,
    selectConnectionBucket,
    deleteConnectionFromState,
    searchObjects,
    clearSearch,
    loadMoreObjects,
  } = useS3Browser();

  // Local state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<S3ObjectInfo | null>(null);
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);
  const [createBucketModalOpened, setCreateBucketModalOpened] = useState(false);
  const [bucketDetailsModalOpened, setBucketDetailsModalOpened] =
    useState(false);
  const [bucketToShow, setBucketToShow] = useState<BucketInfo | null>(null);

  // Favorites state
  const [renameFavoriteModalOpened, setRenameFavoriteModalOpened] =
    useState(false);
  const [favoriteToRename, setFavoriteToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteFavoriteModalOpened, setDeleteFavoriteModalOpened] =
    useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mobile sidebar state
  // On mobile platforms (iOS/Android), default to open the sidebar
  const isOnMobilePlatform = isMobilePlatform();
  const [navbarOpened, { toggle: toggleNavbar, close: closeNavbar }] =
    useDisclosure(isOnMobilePlatform);
  const isMobile = useMediaQuery('(max-width: 640px)');

  // File operations hook
  const fileOps = useFileOperations({
    ensureObjectUrl,
    deleteObject,
    createFolder,
    uploadFile,
    fetchObjects,
    bucket,
  });

  // Connection operations hook
  const connectionOps = useConnectionOperations({
    deleteConnectionFromState,
  });

  // File drag and drop handling
  const { isDragging, dragHandlers } = useFileDrop({
    onFilesDropped: async (files) => {
      if (!bucket) {
        notifications.show({
          message: 'Please select a bucket first',
          color: 'orange',
          position: 'bottom-right',
        });
        return;
      }
      await fileOps.handleUploadFiles(files);
    },
    enabled: !!bucket,
  });

  // Listen for connection created event from connection form window
  useConnectionEventListener(connectToSavedConnection);

  // Keyboard navigation
  useKeyboardNavigation({
    bucket,
    objects,
    selectedFile,
    view,
    modalsOpen:
      fileOps.deleteModalOpened ||
      createFolderModalOpened ||
      createBucketModalOpened ||
      bucketDetailsModalOpened ||
      connectionOps.deleteConnectionModalOpened,
    onSetSelectedFile: setSelectedFile,
    onEnterFolder: (key) => {
      setPrefix(key);
      setSelectedFile(null);
    },
    onPreviewFile: fileOps.previewInNewWindow,
  });

  // Breadcrumbs navigation
  const breadcrumbItems = useBreadcrumbs(
    prefix || '',
    bucket,
    (path: string) => {
      setPrefix(path);
      setSelectedFile(null);
    }
  );

  // Handle image preview in modal
  const handleImagePreview = useCallback((key: string, url: string) => {
    setPreviewTitle(key);
    setPreviewUrl(url);
  }, []);

  // Handle folder creation from toolbar
  const handleToolbarCreateFolder = useCallback(
    async (name: string) => {
      const success = await fileOps.handleCreateFolder(name);
      if (success) {
        // Success notification already shown in handleCreateFolder
      }
    },
    [fileOps]
  );

  // Handle file upload from toolbar
  const handleToolbarUpload = useCallback(
    async (file: File) => {
      await fileOps.handleUploadFiles([file]);
    },
    [fileOps]
  );

  // Handle bucket creation
  const handleCreateBucket = useCallback(
    async (bucketName: string, region: string) => {
      try {
        await createBucket(bucketName, region);
        setCreateBucketModalOpened(false);
      } catch (err) {
        // Error already handled in createBucket
      }
    },
    [createBucket]
  );

  // Handle showing bucket details
  const handleShowBucketDetails = useCallback((bucket: BucketInfo) => {
    setBucketToShow(bucket);
    setBucketDetailsModalOpened(true);
  }, []);

  // Handle refresh - stable callback
  const handleRefresh = useCallback(() => {
    fetchObjects();
    setSelectedFile(null);
  }, [fetchObjects]);

  // Check if current location is favorited
  const currentIsFavorited = activeConnectionId && bucket
    ? isFavorited(activeConnectionId, bucket, prefix || '')
    : false;

  // Handle toggle favorite
  const handleToggleFavorite = useCallback(() => {
    if (!activeConnectionId || !bucket) return;

    if (currentIsFavorited) {
      // Remove favorite
      const favorite = getFavoriteByLocation(
        activeConnectionId,
        bucket,
        prefix || ''
      );
      if (favorite) {
        removeFavorite(favorite.id);
        // Trigger refresh in FavoritesSection
        window.dispatchEvent(new Event('refresh-favorites'));
        notifications.show({
          message: 'Removed from favorites',
          color: 'blue',
          position: 'bottom-right',
        });
      }
    } else {
      // Add favorite
      saveFavorite(activeConnectionId, bucket, prefix || '');
      // Trigger refresh in FavoritesSection
      window.dispatchEvent(new Event('refresh-favorites'));
      notifications.show({
        message: 'Added to favorites',
        color: 'green',
        position: 'bottom-right',
      });
    }
  }, [activeConnectionId, bucket, prefix, currentIsFavorited]);

  // Handle open favorite
  const handleOpenFavorite = useCallback(
    async (favorite: Favorite) => {
      // Check if we need to switch connections
      if (activeConnectionId !== favorite.connectionId) {
        await connectToSavedConnection(favorite.connectionId);
      }

      // Switch to the bucket and prefix
      selectConnectionBucket(favorite.connectionId, favorite.bucket);
      setPrefix(favorite.prefix);
      setSelectedFile(null);

      // Close mobile sidebar if needed
      if (isMobile) closeNavbar();

      notifications.show({
        message: `Opened favorite: ${favorite.name}`,
        color: 'green',
        position: 'bottom-right',
      });
    },
    [activeConnectionId, connectToSavedConnection, selectConnectionBucket, setPrefix, isMobile, closeNavbar]
  );

  // Handle rename favorite
  const handleRenameFavorite = useCallback((favorite: Favorite) => {
    setFavoriteToRename({ id: favorite.id, name: favorite.name });
    setRenameFavoriteModalOpened(true);
  }, []);

  // Handle rename favorite confirm
  const handleRenameFavoriteConfirm = useCallback(
    (newName: string) => {
      if (favoriteToRename) {
        updateFavorite(favoriteToRename.id, { name: newName });
        // Trigger refresh in FavoritesSection
        window.dispatchEvent(new Event('refresh-favorites'));
        setRenameFavoriteModalOpened(false);
        setFavoriteToRename(null);
        notifications.show({
          message: 'Favorite renamed',
          color: 'green',
          position: 'bottom-right',
        });
      }
    },
    [favoriteToRename]
  );

  // Handle delete favorite request
  const handleDeleteFavorite = useCallback(
    (favoriteId: string, favoriteName: string) => {
      setFavoriteToDelete({ id: favoriteId, name: favoriteName });
      setDeleteFavoriteModalOpened(true);
    },
    []
  );

  // Handle delete favorite confirm
  const handleDeleteFavoriteConfirm = useCallback(() => {
    if (favoriteToDelete) {
      removeFavorite(favoriteToDelete.id);
      // Trigger refresh in FavoritesSection
      window.dispatchEvent(new Event('refresh-favorites'));
      setDeleteFavoriteModalOpened(false);
      setFavoriteToDelete(null);
      notifications.show({
        message: 'Favorite removed',
        color: 'blue',
        position: 'bottom-right',
      });
    }
  }, [favoriteToDelete]);

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !navbarOpened },
      }}
      aside={{
        width: 320,
        breakpoint: 'md',
        collapsed: { mobile: !selectedFile, desktop: !selectedFile },
      }}
      padding={0}
    >
      {/* Left Sidebar */}
      <AppShell.Navbar
        style={{
          borderRight:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        <ConnectionSidebar
          activeConnectionId={activeConnectionId}
          selectedBucket={bucket}
          connectionBuckets={connectionBuckets}
          connectionLoading={connectionLoading}
          onCreateConnection={openConnectionForm}
          onSelectConnection={connectToSavedConnection}
          onSelectBucket={(connId, bucketName) => {
            selectConnectionBucket(connId, bucketName);
            if (isMobile) closeNavbar();
          }}
          onRefreshBuckets={refreshConnectionBuckets}
          onCreateBucket={() => setCreateBucketModalOpened(true)}
          onEditConnection={openEditConnectionForm}
          onRequestDeleteConnection={
            connectionOps.handleRequestDeleteConnection
          }
          onShowBucketDetails={handleShowBucketDetails}
          onOpenFavorite={handleOpenFavorite}
          onRenameFavorite={handleRenameFavorite}
          onDeleteFavorite={handleDeleteFavorite}
          onCloseMobile={closeNavbar}
          isMobile={isMobile}
        />
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main
        style={{
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {bucket ? (
          <>
            <CompactToolbar
              breadcrumbItems={breadcrumbItems}
              view={view}
              onChangeView={setView}
              onRefresh={handleRefresh}
              onCreateFolder={handleToolbarCreateFolder}
              onUpload={handleToolbarUpload}
              loading={loading}
              hasBucket={!!bucket}
              onToggleNavbar={toggleNavbar}
              isMobile={isMobile}
              searchQuery={searchQuery}
              searchMode={searchMode}
              isSearching={isSearching}
              onSearch={searchObjects}
              onClearSearch={clearSearch}
              isFavorited={currentIsFavorited}
              onToggleFavorite={handleToggleFavorite}
            />

            <ContextMenuWrapper
              onRefresh={() => {
                fetchObjects();
                setSelectedFile(null);
              }}
              onCreateFolder={() => setCreateFolderModalOpened(true)}
              onUpload={() => fileOps.fileInputRef.current?.click()}
            >
              <MainContentArea
                loading={loading}
                view={view}
                objects={objects}
                isDragging={isDragging}
                dragHandlers={dragHandlers}
                selectedFile={selectedFile}
                onEnterDir={(k) => {
                  setPrefix(k);
                  setSelectedFile(null);
                }}
                onDelete={fileOps.handleDeleteRequest}
                onCopyUrl={fileOps.copyObjectUrl}
                onPreviewExternal={fileOps.previewInNewWindow}
                onSelectFile={setSelectedFile}
                ensureObjectUrl={ensureObjectUrl}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMoreObjects}
              />
            </ContextMenuWrapper>

            {/* Image Preview Modal */}
            <Modal
              opened={!!previewUrl}
              onClose={() => setPreviewUrl(null)}
              title={previewTitle}
              size="xl"
              centered
            >
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt={previewTitle}
                  style={{
                    width: '100%',
                    maxHeight: 600,
                    objectFit: 'contain',
                  }}
                />
              )}
            </Modal>
          </>
        ) : (
          <EmptyState />
        )}
      </AppShell.Main>

      {/* Right Sidebar - File Details */}
      <AppShell.Aside
        style={{
          borderLeft:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        <FileDetailsSidebar
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onCopyUrl={fileOps.copyObjectUrl}
          onPreview={fileOps.previewInNewWindow}
          onDownload={fileOps.downloadFile}
          onDelete={(key) => {
            fileOps.handleDeleteRequest(key);
            setSelectedFile(null);
          }}
          onImagePreview={handleImagePreview}
          ensureObjectUrl={ensureObjectUrl}
        />
      </AppShell.Aside>

      {/* All Modals */}
      <AppModals
        deleteModalOpened={fileOps.deleteModalOpened}
        fileToDelete={fileOps.fileToDelete}
        deletingFile={fileOps.deletingFile}
        onDeleteCancel={fileOps.handleDeleteCancel}
        onDeleteConfirm={fileOps.handleDeleteConfirm}
        createFolderModalOpened={createFolderModalOpened}
        onCreateFolderClose={() => setCreateFolderModalOpened(false)}
        onCreateFolderConfirm={async (name) => {
          const success = await fileOps.handleCreateFolder(name);
          if (success) {
            setCreateFolderModalOpened(false);
          }
        }}
        createBucketModalOpened={createBucketModalOpened}
        onCreateBucketClose={() => setCreateBucketModalOpened(false)}
        onCreateBucketConfirm={handleCreateBucket}
        currentRegion={connSafe.region}
        deleteConnectionModalOpened={connectionOps.deleteConnectionModalOpened}
        connectionToDelete={connectionOps.connectionToDelete}
        onDeleteConnectionClose={connectionOps.handleDeleteConnectionClose}
        onDeleteConnectionConfirm={connectionOps.handleDeleteConnectionConfirm}
        bucketDetailsModalOpened={bucketDetailsModalOpened}
        bucketToShow={bucketToShow}
        onBucketDetailsClose={() => setBucketDetailsModalOpened(false)}
        renameFavoriteModalOpened={renameFavoriteModalOpened}
        favoriteToRename={favoriteToRename}
        onRenameFavoriteClose={() => {
          setRenameFavoriteModalOpened(false);
          setFavoriteToRename(null);
        }}
        onRenameFavoriteConfirm={handleRenameFavoriteConfirm}
        deleteFavoriteModalOpened={deleteFavoriteModalOpened}
        favoriteToDelete={favoriteToDelete}
        onDeleteFavoriteClose={() => {
          setDeleteFavoriteModalOpened(false);
          setFavoriteToDelete(null);
        }}
        onDeleteFavoriteConfirm={handleDeleteFavoriteConfirm}
      />

      {/* Hidden file input for context menu upload */}
      <input
        ref={fileOps.fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={fileOps.handleFileUpload}
      />

      {/* Upload Progress Display */}
      <UploadProgressList
        uploads={
          new Map(
            Array.from(uploadProgress.entries()).map(([uploadId, progress]) => [
              uploadId,
              {
                ...progress,
                fileName:
                  fileOps.uploadFileNames.get(uploadId) || 'Unknown file',
              },
            ])
          )
        }
      />
    </AppShell>
  );
}

export default App;
