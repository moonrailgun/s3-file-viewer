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
    setView,
    setConn,
    setBucket,
    setPrefix,
    doConnect,
    ensureObjectUrl,
    fetchObjects,
    deleteObject,
    createFolder,
    uploadFile,
  } = useS3Browser();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

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
      items.push(
        <Anchor key={acc} onClick={() => setPrefix(`${acc}/`)}>
          {part}
        </Anchor>
      );
    });
    return items;
  }, [prefix]);

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
      });
    } catch (e) {
      notifications.show({
        message: `Copy failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
        color: 'red',
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
      });
    }
  }

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <HeaderBar
        connected={connected}
        buckets={buckets}
        bucket={bucket}
        onSelectBucket={setBucket}
        view={view}
        onChangeView={setView}
        onRefresh={fetchObjects}
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
                    });
                    fetchObjects();
                  } catch (err: any) {
                    notifications.show({
                      message: `Create folder failed: ${err}`,
                      color: 'red',
                    });
                  }
                }}
                onUpload={async (file) => {
                  try {
                    await uploadFile(file);
                    notifications.show({
                      message: `Uploaded: ${file.name}`,
                      color: 'green',
                    });
                    fetchObjects();
                  } catch (err: any) {
                    notifications.show({
                      message: `Upload failed: ${err}`,
                      color: 'red',
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
                  onDelete={async (k) => {
                    try {
                      await deleteObject(k);
                      notifications.show({
                        message: `Deleted ${k}`,
                        color: 'green',
                      });
                      fetchObjects();
                    } catch (err: any) {
                      notifications.show({
                        message: `Delete failed: ${err}`,
                        color: 'red',
                      });
                    }
                  }}
                  onCopyUrl={copyObjectUrl}
                  onPreviewExternal={previewInNewWindow}
                />
              ) : (
                <>
                  <Group justify="center" align="normal" gap={2}>
                    {objects.map((o) => (
                      <ObjectThumb
                        key={o.key}
                        obj={o}
                        ensureObjectUrl={ensureObjectUrl}
                        onPreview={(k, url) => {
                          setPreviewTitle(k);
                          setPreviewUrl(url);
                        }}
                        onDelete={async (k) => {
                          try {
                            await deleteObject(k);
                            notifications.show({
                              message: `Deleted ${k}`,
                              color: 'green',
                            });
                            fetchObjects();
                          } catch (err: any) {
                            notifications.show({
                              message: `Delete failed: ${err}`,
                              color: 'red',
                            });
                          }
                        }}
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
    </AppShell>
  );
}

export default App;
