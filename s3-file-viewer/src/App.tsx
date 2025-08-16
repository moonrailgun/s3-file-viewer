import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorageState, useInViewport } from 'ahooks';
import { invoke } from '@tauri-apps/api/core';
import {
  AppShell,
  Button,
  Container,
  Group,
  Stack,
  Select,
  Text,
  Title,
  ActionIcon,
  Table,
  Badge,
  TextInput,
  SegmentedControl,
  Breadcrumbs,
  Anchor,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconFolderPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconCopy,
  IconEye,
} from '@tabler/icons-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { openUrl as openExternalUrl } from '@tauri-apps/plugin-opener';
import './App.css';

type ConnectionParams = {
  endpoint: string;
  access_key: string;
  secret_key: string;
  region: string;
};

type S3ObjectInfo = {
  key: string;
  size: number;
  last_modified?: string;
  is_dir: boolean;
};

type BucketInfo = {
  name: string;
  region: string;
};

type ObjectThumbProps = {
  obj: S3ObjectInfo;
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  onPreview: (key: string, url: string) => void;
  onDelete: (key: string) => Promise<void>;
  onEnterDir: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
};

function humanFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageKey(key: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)$/i.test(key);
}

function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [objects, setObjects] = useState<S3ObjectInfo[]>([]);
  // use ref-based URL cache to avoid causing re-renders on each image URL arrival
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [view, setView] = useLocalStorageState<string>('s3fv:view', {
    defaultValue: 'list',
  });

  const [showConnect, setShowConnect] = useState(true);
  const defaultConn: ConnectionParams = {
    endpoint: 'https://s3.amazonaws.com',
    access_key: '',
    secret_key: '',
    region: 'us-east-1',
  };
  const [conn, setConn] = useLocalStorageState<ConnectionParams>('s3fv:conn', {
    defaultValue: defaultConn,
  });
  const connSafe = (conn ?? defaultConn) as ConnectionParams;
  const [bucket, setBucket] = useLocalStorageState<string | null>(
    's3fv:lastBucket',
    { defaultValue: null }
  );
  const [prefix, setPrefix] = useLocalStorageState<string>('s3fv:lastPrefix', {
    defaultValue: '',
  });

  async function doConnect(override?: ConnectionParams) {
    try {
      setLoading(true);
      const params = override ?? connSafe;
      console.log('doConnect', params);
      await invoke('connect', { params });
      setConnected(true);
      setShowConnect(false);
      notifications.show({
        message: 'Connected to S3 successfully',
        color: 'green',
      });
      await fetchBuckets();
    } catch (err: any) {
      notifications.show({ message: `Connect failed: ${err}`, color: 'red' });
    } finally {
      setLoading(false);
    }
  }

  async function ensureObjectUrl(key: string) {
    if (!bucket) return undefined;
    const cached = urlCacheRef.current.get(key);
    if (cached) return cached;
    try {
      const url = (await invoke('get_object_url', {
        bucket,
        key,
        expiresSecs: 600,
      })) as string;
      urlCacheRef.current.set(key, url);
      return url;
    } catch (e) {
      return undefined;
    }
  }

  async function fetchBuckets() {
    try {
      const res = (await invoke('list_buckets')) as BucketInfo[];
      console.log('fetchBuckets', res);
      setBuckets(res);
      if (res.length > 0) {
        const preferred =
          bucket && res.some((b) => b.name === bucket) ? bucket : res[0].name;
        setBucket(preferred);
      }
    } catch (err: any) {
      notifications.show({
        message: `List buckets failed: ${err}`,
        color: 'red',
      });
    }
  }

  async function fetchObjects() {
    if (!bucket) return;
    try {
      setLoading(true);
      const res = (await invoke('list_objects', {
        bucket,
        prefix: prefix || null,
      })) as S3ObjectInfo[];
      setObjects(res);
    } catch (err: any) {
      notifications.show({
        message: `List objects failed: ${err}`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }

  async function copyObjectUrl(key: string) {
    try {
      const url = await ensureObjectUrl(key);
      if (!url) throw new Error('no url');
      await navigator.clipboard.writeText(url);
      notifications.show({ message: 'URL copied', color: 'green' });
    } catch (e) {
      notifications.show({ message: 'Copy failed', color: 'red' });
    }
  }

  async function previewInNewWindow(key: string) {
    try {
      const url = await ensureObjectUrl(key);
      if (!url) throw new Error('no url');
      try {
        const label = `preview-${Date.now()}`;
        new WebviewWindow(label, { url, title: key });
      } catch (e) {
        await openExternalUrl(url);
      }
    } catch (e) {
      notifications.show({ message: 'Preview failed', color: 'red' });
    }
  }

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

  useEffect(() => {
    if (connected && bucket != null) {
      fetchObjects();
    }
  }, [connected, bucket, prefix]);

  // UI helpers
  const rows = useMemo(
    () =>
      objects.map((o) => (
        <Table.Tr
          key={o.key}
          style={{ cursor: o.is_dir ? 'pointer' : 'default' }}
          onClick={() => {
            if (o.is_dir) setPrefix(o.key);
          }}
        >
          <Table.Td>{o.is_dir ? <Badge color="blue">DIR</Badge> : ''}</Table.Td>
          <Table.Td>{o.key}</Table.Td>
          <Table.Td>{o.is_dir ? '-' : humanFileSize(o.size)}</Table.Td>
          <Table.Td>{o.last_modified ?? '-'}</Table.Td>
          <Table.Td>
            {!o.is_dir && (
              <Group gap="xs">
                <ActionIcon
                  color="red"
                  variant="light"
                  onClick={async () => {
                    try {
                      await invoke('delete_object', { bucket, key: o.key });
                      notifications.show({
                        message: `Deleted ${o.key}`,
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
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            )}
          </Table.Td>
        </Table.Tr>
      )),
    [objects, bucket]
  );

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <Title order={4}>S3 File Viewer</Title>
              {connected && (
                <Select
                  searchable={true}
                  data={buckets.map((b) => ({
                    value: b.name,
                    label: `${b.name} (${b.region})`,
                  }))}
                  value={bucket}
                  onChange={setBucket}
                  placeholder="Select bucket"
                />
              )}
            </Group>
            <Group>
              <SegmentedControl
                value={view}
                onChange={setView}
                data={[
                  { label: 'List', value: 'list' },
                  { label: 'Thumbs', value: 'thumb' },
                ]}
              />
              <ActionIcon
                variant="light"
                onClick={fetchObjects}
                disabled={loading}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          {showConnect ? (
            <Stack gap="md" maw={520} mx="auto">
              <Title order={3}>Connect to S3</Title>
              <TextInput
                label="Endpoint"
                value={connSafe.endpoint}
                onChange={(e) =>
                  setConn({ ...connSafe, endpoint: e.currentTarget.value })
                }
              />
              <Group grow>
                <TextInput
                  label="Access Key"
                  value={connSafe.access_key}
                  onChange={(e) =>
                    setConn({ ...connSafe, access_key: e.currentTarget.value })
                  }
                />
                <TextInput
                  label="Secret Key"
                  type="password"
                  value={connSafe.secret_key}
                  onChange={(e) =>
                    setConn({ ...connSafe, secret_key: e.currentTarget.value })
                  }
                />
              </Group>
              <TextInput
                label="Region"
                value={connSafe.region}
                onChange={(e) =>
                  setConn({ ...connSafe, region: e.currentTarget.value })
                }
              />
              <Button onClick={() => doConnect()} loading={loading}>
                Connect
              </Button>
            </Stack>
          ) : (
            <Stack>
              <Group justify="space-between">
                {connected && (
                  <Breadcrumbs separator="/">{breadcrumbItems}</Breadcrumbs>
                )}
                <Group>
                  <Button
                    leftSection={<IconFolderPlus size={16} />}
                    variant="light"
                    onClick={async () => {
                      const name = prompt('Folder name');
                      if (!name || !bucket) return;
                      const key = prefix
                        ? `${prefix.replace(/\/?$/, '/')}${name}/`
                        : `${name}/`;
                      try {
                        await invoke('create_folder', {
                          bucket,
                          folderKey: key,
                        });
                        notifications.show({
                          message: `Folder created: ${key}`,
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
                  >
                    New Folder
                  </Button>
                  <Button
                    leftSection={<IconUpload size={16} />}
                    variant="light"
                    onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.onchange = async () => {
                        const file = input.files?.[0];
                        if (!file || !bucket) return;
                        const arr = new Uint8Array(await file.arrayBuffer());
                        // base64 encode
                        let binary = '';
                        arr.forEach((b) => (binary += String.fromCharCode(b)));
                        const b64 = btoa(binary);
                        const key = prefix
                          ? `${prefix.replace(/\/?$/, '/')}${file.name}`
                          : file.name;
                        try {
                          await invoke('upload_object', {
                            params: { bucket, key, content_base64: b64 },
                          });
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
                      };
                      input.click();
                    }}
                  >
                    Upload
                  </Button>
                </Group>
              </Group>

              {view === 'list' ? (
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Key</Table.Th>
                      <Table.Th>Size</Table.Th>
                      <Table.Th>Modified</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rows}</Table.Tbody>
                </Table>
              ) : (
                <>
                  <Group>
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
                            await invoke('delete_object', { bucket, key: k });
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

const ObjectThumb: React.FC<ObjectThumbProps> = ({
  obj,
  ensureObjectUrl,
  onPreview,
  onDelete,
  onEnterDir,
  onCopyUrl,
  onPreviewExternal,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [inView] = useInViewport(imgRef);

  useEffect(() => {
    (async () => {
      if (
        !obj.is_dir &&
        isImageKey(obj.key) &&
        inView &&
        imgRef.current &&
        !imgRef.current.dataset.loaded
      ) {
        const url = await ensureObjectUrl(obj.key);
        if (url && imgRef.current) {
          imgRef.current.src = url;
          imgRef.current.dataset.loaded = '1';
        }
      }
    })();
  }, [inView, obj.key]);

  return (
    <Stack
      key={obj.key}
      p="md"
      style={{
        border: '1px solid #eee',
        borderRadius: 8,
        width: 220,
        cursor: obj.is_dir ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (obj.is_dir) onEnterDir(obj.key);
      }}
    >
      {obj.is_dir ? (
        <Text fw={600} size="sm" lineClamp={2}>
          {obj.key}
        </Text>
      ) : isImageKey(obj.key) ? (
        <img
          ref={imgRef}
          alt={obj.key}
          style={{
            width: '100%',
            height: 140,
            objectFit: 'cover',
            borderRadius: 6,
            background: '#fafafa',
            cursor: 'pointer',
          }}
          onError={async (e) => {
            // retry once on error: possibly URL expired or not fetched yet
            const url = await ensureObjectUrl(obj.key);
            if (url) (e.currentTarget as HTMLImageElement).src = url;
          }}
          onClick={async () => {
            const url = await ensureObjectUrl(obj.key);
            if (url) onPreview(obj.key, url);
          }}
        />
      ) : (
        <Text fw={600} size="sm" lineClamp={2}>
          {obj.key}
        </Text>
      )}
      <Text c="dimmed" size="xs">
        {obj.is_dir ? 'Folder' : humanFileSize(obj.size)}
      </Text>
      {!obj.is_dir && (
        <Group gap="xs">
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => onCopyUrl(obj.key)}
            title="Copy URL"
          >
            <IconCopy size={14} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="grape"
            onClick={() => onPreviewExternal(obj.key)}
            title="Preview"
          >
            <IconEye size={14} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            color="red"
            onClick={async () => {
              await onDelete(obj.key);
            }}
            title="Delete"
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      )}
    </Stack>
  );
};
