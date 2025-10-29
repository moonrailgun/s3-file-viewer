import { useState, useRef, useCallback } from 'react';
import { AppShell, Modal } from '@mantine/core';
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
import type { S3ObjectInfo } from './types';

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
    setView,
    setPrefix,
    ensureObjectUrl,
    fetchObjects,
    deleteObject,
    createFolder,
    uploadFile,
    connectToSavedConnection,
    refreshConnectionBuckets,
    selectConnectionBucket,
    deleteConnectionFromState,
  } = useS3Browser();

  // Local state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<S3ObjectInfo | null>(null);
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);

  // Grid container ref for keyboard navigation
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // File operations hook
  const fileOps = useFileOperations({
    ensureObjectUrl,
    deleteObject,
    createFolder,
    uploadFile,
    fetchObjects,
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
      connectionOps.deleteConnectionModalOpened,
    gridContainerRef,
    onSetSelectedFile: setSelectedFile,
    onEnterFolder: (key) => {
      setPrefix(key);
      setSelectedFile(null);
    },
    onPreviewFile: fileOps.previewInNewWindow,
  });

  // Breadcrumbs navigation
  const breadcrumbItems = useBreadcrumbs(prefix || '', (path: string) => {
    setPrefix(path);
    setSelectedFile(null);
  });

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

  return (
    <AppShell
      navbar={{ width: 250, breakpoint: 'sm' }}
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
          onSelectBucket={selectConnectionBucket}
          onRefreshBuckets={refreshConnectionBuckets}
          onEditConnection={openEditConnectionForm}
          onRequestDeleteConnection={
            connectionOps.handleRequestDeleteConnection
          }
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
              bucketName={bucket}
              view={view}
              onChangeView={setView}
              onRefresh={() => {
                fetchObjects();
                setSelectedFile(null);
              }}
              onCreateFolder={handleToolbarCreateFolder}
              onUpload={handleToolbarUpload}
              loading={loading}
              hasBucket={!!bucket}
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
                gridContainerRef={gridContainerRef}
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
        deleteConnectionModalOpened={connectionOps.deleteConnectionModalOpened}
        connectionToDelete={connectionOps.connectionToDelete}
        onDeleteConnectionClose={connectionOps.handleDeleteConnectionClose}
        onDeleteConnectionConfirm={connectionOps.handleDeleteConnectionConfirm}
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
