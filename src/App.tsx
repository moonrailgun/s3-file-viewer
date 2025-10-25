import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  AppShell,
  Group,
  Anchor,
  Modal,
  Center,
  Loader,
  Text,
  Box,
  Stack,
} from '@mantine/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl as openExternalUrl } from '@tauri-apps/plugin-opener';
import { listen } from '@tauri-apps/api/event';
import { RefreshCw, FolderPlus, Upload } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { useS3Browser } from './hooks/useS3Browser';
import { useFileDrop } from './hooks/useFileDrop';
import { ConnectionSidebar } from './components/ConnectionSidebar';
import { CompactToolbar } from './components/CompactToolbar';
import { ObjectListTable } from './components/ObjectListTable';
import { ObjectThumb } from './components/ObjectThumb';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { ConfirmModal } from './components/ConfirmModal';
import { UploadProgressList } from './components/UploadProgressBar';
import { notifications } from '@mantine/notifications';
import { removeSavedConnection } from './utils/connectionManager';

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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Delete confirmation state
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Create folder modal state
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);

  // Delete connection confirmation state
  const [deleteConnectionModalOpened, setDeleteConnectionModalOpened] =
    useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Upload progress with file names
  const [uploadFileNames, setUploadFileNames] = useState<Map<string, string>>(
    new Map()
  );

  // File upload ref for context menu
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Upload all files
      for (const file of files) {
        try {
          const uploadId = await uploadFile(file);
          setUploadFileNames(
            (prev) => new Map([...prev, [uploadId, file.name]])
          );
          notifications.show({
            message: `Uploaded: ${file.name}`,
            color: 'green',
            position: 'bottom-right',
          });
        } catch (err: any) {
          notifications.show({
            message: `Upload failed for ${file.name}: ${err}`,
            color: 'red',
            position: 'bottom-right',
          });
        }
      }

      // Refresh objects list after all uploads
      fetchObjects();
    },
    enabled: !!bucket,
  });

  // Listen for connection created event from connection form window
  useEffect(() => {
    const unlisten = listen('connection-created', (event: any) => {
      const { connectionId } = event.payload;
      if (connectionId) {
        // Trigger a reconnection or refresh to pick up the new connection
        setTimeout(() => {
          connectToSavedConnection(connectionId);
        }, 100);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const breadcrumbItems = useMemo(() => {
    const parts = (prefix || '').replace(/\/+$/, '').split('/').filter(Boolean);
    const items: React.ReactNode[] = [];
    items.push(
      <Anchor key="/" onClick={() => setPrefix('')} size="sm">
        /
      </Anchor>
    );
    let acc = '';
    parts.forEach((part) => {
      acc = acc ? `${acc}/${part}` : part;
      const target = `${acc}/`;

      items.push(
        <Anchor key={acc} onClick={() => setPrefix(target)} size="sm">
          {part}
        </Anchor>
      );
    });
    return items;
  }, [prefix]);

  const handleCreateConnection = () => {
    // Open connection form in new window
    const win = new WebviewWindow('connection-form', {
      url: '/src/windows/connection-form.html',
      title: 'New Connection',
      width: 450,
      height: 560,
      center: true,
      resizable: false,
      decorations: true,
    });

    win.once('tauri://error', (e) => {
      console.error('Connection form window error:', e);
      notifications.show({
        message: `Cannot open connection window: ${e.payload}`,
        color: 'red',
        position: 'bottom-right',
      });
    });
  };

  const handleEditConnection = (connectionId: string) => {
    // Open connection form in edit mode with connection ID
    const win = new WebviewWindow(`connection-form-${Date.now()}`, {
      url: `/src/windows/connection-form.html?connectionId=${connectionId}`,
      title: 'Edit Connection',
      width: 450,
      height: 560,
      center: true,
      resizable: false,
      decorations: true,
    });

    win.once('tauri://error', (e) => {
      console.error('Connection form window error:', e);
      notifications.show({
        message: `Cannot open connection window: ${e.payload}`,
        color: 'red',
        position: 'bottom-right',
      });
    });
  };

  async function copyObjectUrl(key: string) {
    try {
      const url = await ensureObjectUrl(key);
      if (!url) {
        throw new Error('no url');
      }
      await writeText(url);
      notifications.show({
        message: 'URL copied to clipboard',
        color: 'green',
        position: 'bottom-right',
      });
    } catch (e) {
      notifications.show({
        message: `Copy failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
        color: 'red',
        position: 'bottom-right',
      });
    }
  }

  async function previewInNewWindow(key: string) {
    try {
      const url = await ensureObjectUrl(key);
      if (!url) {
        throw new Error('no url');
      }

      try {
        const label = `preview-${Date.now()}`;
        const win = new WebviewWindow(label, {
          url,
          title: key,
          width: 1200,
          height: 800,
          center: true,
          resizable: true,
          decorations: true,
        });

        win.once('tauri://error', (e) => {
          console.error('Preview window error:', e);
          notifications.show({
            message: `Preview window error: ${e.payload}`,
            color: 'red',
            position: 'bottom-right',
          });
        });
      } catch (webviewError) {
        console.error('Webview creation failed:', webviewError);
        await openExternalUrl(url);
      }
    } catch (e) {
      console.error('Preview failed:', e);
      notifications.show({
        message: `Preview failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
        color: 'red',
        position: 'bottom-right',
      });
    }
  }

  // Handle delete confirmation
  function handleDeleteRequest(key: string) {
    setFileToDelete(key);
    setDeleteModalOpened(true);
  }

  function handleDeleteCancel() {
    setDeleteModalOpened(false);
    setFileToDelete(null);
    setDeletingFile(false);
  }

  async function handleDeleteConfirm() {
    if (!fileToDelete) return;

    try {
      setDeletingFile(true);
      await deleteObject(fileToDelete);
      notifications.show({
        message: `Deleted ${fileToDelete}`,
        color: 'green',
        position: 'bottom-right',
      });
      fetchObjects();
      handleDeleteCancel();
    } catch (err: any) {
      notifications.show({
        message: `Delete failed: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
      setDeletingFile(false);
    }
  }

  // Handle file upload from context menu
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadId = await uploadFile(file);
      setUploadFileNames((prev) => new Map([...prev, [uploadId, file.name]]));
      notifications.show({
        message: `Uploaded: ${file.name}`,
        color: 'green',
        position: 'bottom-right',
      });
      fetchObjects();
    } catch (err: any) {
      notifications.show({
        message: `Upload failed: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle delete connection request
  const handleRequestDeleteConnection = (
    connectionId: string,
    connectionName: string
  ) => {
    setConnectionToDelete({ id: connectionId, name: connectionName });
    setDeleteConnectionModalOpened(true);
  };

  // Handle delete connection confirm
  const handleDeleteConnectionConfirm = () => {
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
  };

  return (
    <AppShell navbar={{ width: 250, breakpoint: 'sm' }} padding={0}>
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
          onCreateConnection={handleCreateConnection}
          onSelectConnection={connectToSavedConnection}
          onSelectBucket={selectConnectionBucket}
          onRefreshBuckets={refreshConnectionBuckets}
          onEditConnection={handleEditConnection}
          onRequestDeleteConnection={handleRequestDeleteConnection}
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
              onRefresh={fetchObjects}
              onCreateFolder={async (name) => {
                try {
                  await createFolder(name);
                  notifications.show({
                    message: `Folder created: ${name}`,
                    color: 'green',
                    position: 'bottom-right',
                  });
                  fetchObjects();
                } catch (err: any) {
                  notifications.show({
                    message: `Create folder failed: ${err}`,
                    color: 'red',
                    position: 'bottom-right',
                  });
                }
              }}
              onUpload={async (file) => {
                try {
                  const uploadId = await uploadFile(file);
                  setUploadFileNames(
                    (prev) => new Map([...prev, [uploadId, file.name]])
                  );
                  notifications.show({
                    message: `Uploaded: ${file.name}`,
                    color: 'green',
                    position: 'bottom-right',
                  });
                  fetchObjects();
                } catch (err: any) {
                  notifications.show({
                    message: `Upload failed: ${err}`,
                    color: 'red',
                    position: 'bottom-right',
                  });
                }
              }}
              loading={loading}
              hasBucket={!!bucket}
            />

            <ContextMenu>
              <ContextMenuTrigger asChild>
                <Box
                  style={{ flex: 1, overflow: 'auto', position: 'relative' }}
                  p="xs"
                  {...dragHandlers}
                >
                  {/* Drag and drop overlay */}
                  {isDragging && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        backdropFilter: 'blur(2px)',
                        border: '3px dashed var(--mantine-color-blue-6)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 999,
                        pointerEvents: 'none',
                      }}
                    >
                      <Stack align="center" gap="md">
                        <Upload size={48} color="var(--mantine-color-blue-6)" />
                        <Text size="xl" fw={600} c="blue">
                          拖拽文件到此处上传
                        </Text>
                      </Stack>
                    </Box>
                  )}

                  {loading ? (
                    <Center h="100%">
                      <Loader type="dots" />
                    </Center>
                  ) : view === 'list' ? (
                    <ObjectListTable
                      objects={objects}
                      onEnterDir={(k) => setPrefix(k)}
                      onDelete={handleDeleteRequest}
                      onCopyUrl={copyObjectUrl}
                      onPreviewExternal={previewInNewWindow}
                    />
                  ) : (
                    <>
                      <Group justify="start" align="normal" gap={2}>
                        {objects.map((o) => (
                          <ObjectThumb
                            key={o.key}
                            obj={o}
                            ensureObjectUrl={ensureObjectUrl}
                            onPreview={(k, url) => {
                              setPreviewTitle(k);
                              setPreviewUrl(url);
                            }}
                            onDelete={handleDeleteRequest}
                            onEnterDir={(k) => setPrefix(k)}
                            onCopyUrl={copyObjectUrl}
                            onPreviewExternal={previewInNewWindow}
                          />
                        ))}
                      </Group>
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
                  )}
                </Box>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    fetchObjects();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    setCreateFolderModalOpened(true);
                  }}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </>
        ) : (
          <Center h="100%" style={{ flexDirection: 'column', gap: '1rem' }}>
            <Text size="lg" c="dimmed">
              Welcome to S3 File Viewer
            </Text>
            <Text size="sm" c="dimmed">
              Please select a connection and bucket from the left sidebar to
              start browsing
            </Text>
          </Center>
        )}
      </AppShell.Main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={deleteModalOpened}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={fileToDelete || ''}
        loading={deletingFile}
      />

      {/* Create Folder Modal */}
      <CreateFolderModal
        opened={createFolderModalOpened}
        onClose={() => setCreateFolderModalOpened(false)}
        onConfirm={async (name) => {
          try {
            await createFolder(name);
            notifications.show({
              message: `Folder created: ${name}`,
              color: 'green',
              position: 'bottom-right',
            });
            fetchObjects();
            setCreateFolderModalOpened(false);
          } catch (err: any) {
            notifications.show({
              message: `Create folder failed: ${err}`,
              color: 'red',
              position: 'bottom-right',
            });
          }
        }}
      />

      {/* Delete Connection Confirmation Modal */}
      <ConfirmModal
        opened={deleteConnectionModalOpened}
        onClose={() => {
          setDeleteConnectionModalOpened(false);
          setConnectionToDelete(null);
        }}
        onConfirm={handleDeleteConnectionConfirm}
        title="Delete Connection"
        message="Are you sure you want to delete this connection?"
        itemName={connectionToDelete?.name || ''}
        confirmLabel="Delete"
        confirmColor="red"
      />

      {/* Hidden file input for context menu upload */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Upload Progress Display */}
      <UploadProgressList
        uploads={
          new Map(
            Array.from(uploadProgress.entries()).map(([uploadId, progress]) => [
              uploadId,
              {
                ...progress,
                fileName: uploadFileNames.get(uploadId) || 'Unknown file',
              },
            ])
          )
        }
      />
    </AppShell>
  );
}

export default App;
