import React, { useMemo, useState } from 'react';
import {
  AppShell,
  Container,
  Group,
  Stack,
  Anchor,
  Modal,
  Center,
  Loader,
} from '@mantine/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl as openExternalUrl } from '@tauri-apps/plugin-opener';
import { useS3Browser } from './hooks/useS3Browser';
import { HeaderBar } from './components/HeaderBar';
import { ConnectForm } from './components/ConnectForm';
import { Toolbar } from './components/Toolbar';
import { ObjectListTable } from './components/ObjectListTable';
import { ObjectThumb } from './components/ObjectThumb';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { UploadProgressList } from './components/UploadProgressBar';
import { notifications } from '@mantine/notifications';

function App() {
  const {
    connected,
    loading,
    buckets,
    objects,
    view,
    showConnect,
    connSafe,
    bucket,
    prefix,
    uploadProgress,
    setView,
    setConn,
    setBucket,
    setPrefix,
    doConnect,
    doDisconnect,
    ensureObjectUrl,
    fetchObjects,
    deleteObject,
    createFolder,
    uploadFile,
  } = useS3Browser();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // Delete confirmation state
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Upload progress with file names
  const [uploadFileNames, setUploadFileNames] = useState<Map<string, string>>(
    new Map()
  );

  const breadcrumbItems = useMemo(() => {
    const parts = (prefix || '').replace(/\/+$/, '').split('/').filter(Boolean);
    const items: React.ReactNode[] = [];
    items.push(
      <Anchor key="/" onClick={() => setPrefix('')}>
        /
      </Anchor>
    );
    let acc = '';
    parts.forEach((part) => {
      acc = acc ? `${acc}/${part}` : part;
      const target = `${acc}/`;

      items.push(
        <Anchor key={acc} onClick={() => setPrefix(target)}>
          {part}
        </Anchor>
      );
    });
    return items;
  }, [prefix]);

  function handleSelectBucket(bucketName: string | null) {
    setBucket(bucketName);
    setPrefix(''); // 重置路径为根目录
  }

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

      console.log('Creating preview window for:', key, 'with URL:', url);

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

        console.log('Preview window created:', win);

        // 监听窗口事件
        win.once('tauri://created', () => {
          console.log('Preview window created successfully');
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
        console.log('Falling back to external browser...');
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

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <HeaderBar
        connected={connected}
        buckets={buckets}
        bucket={bucket}
        onSelectBucket={handleSelectBucket}
        view={view}
        onChangeView={setView}
        onRefresh={fetchObjects}
        onDisconnect={doDisconnect}
        loading={loading}
      />

      <AppShell.Main>
        <Container size="lg">
          {showConnect ? (
            <ConnectForm
              conn={connSafe}
              onChange={setConn}
              onSubmit={() => doConnect()}
              loading={loading}
            />
          ) : (
            <Stack>
              <Toolbar
                connected={connected}
                breadcrumbItems={breadcrumbItems}
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
              />

              {loading ? (
                <Center mih={200}>
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
            </Stack>
          )}
        </Container>
      </AppShell.Main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        opened={deleteModalOpened}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        fileName={fileToDelete || ''}
        loading={deletingFile}
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
