import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from 'ahooks';
import { invoke } from '@tauri-apps/api/core';
import { notifications } from '@mantine/notifications';
import { BucketInfo, ConnectionParams, S3ObjectInfo } from '../types';

// Core stateful logic for S3 browsing
export function useS3Browser() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [objects, setObjects] = useState<S3ObjectInfo[]>([]);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

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
    if (!bucket) {
      return undefined;
    }
    const cached = urlCacheRef.current.get(key);
    if (cached) {
      return cached;
    }

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

  async function deleteObject(key: string) {
    if (!bucket) return;
    await invoke('delete_object', { bucket, key });
  }

  async function createFolder(name: string) {
    if (!bucket) return;
    const key = prefix ? `${prefix.replace(/\/?$/, '/')}${name}/` : `${name}/`;
    await invoke('create_folder', { bucket, folderKey: key });
  }

  async function uploadFile(file: File) {
    if (!bucket) return;
    const arr = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    arr.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary);
    const key = prefix
      ? `${prefix.replace(/\/?$/, '/')}${file.name}`
      : file.name;
    await invoke('upload_object', {
      params: { bucket, key, content_base64: b64 },
    });
  }

  useEffect(() => {
    if (connected && bucket != null) {
      fetchObjects();
    }
  }, [connected, bucket, prefix]);

  return {
    // state
    connected,
    loading,
    buckets,
    objects,
    view,
    showConnect,
    connSafe,
    bucket,
    prefix,
    // setters
    setView,
    setShowConnect,
    setConn,
    setBucket,
    setPrefix,
    // actions
    doConnect,
    ensureObjectUrl,
    fetchBuckets,
    fetchObjects,
    deleteObject,
    createFolder,
    uploadFile,
  } as const;
}
