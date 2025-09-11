import { useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from 'ahooks';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { notifications } from '@mantine/notifications';
import { BucketInfo, ConnectionParams, S3ObjectInfo } from '../types';
import {
  updateConnectionLastUsed,
  saveConnection,
} from '../utils/connectionManager';
import { inferMimeType } from '../utils/mimeTypes';

// Upload progress interface
interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

// Core stateful logic for S3 browsing
export function useS3Browser() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [objects, setObjects] = useState<S3ObjectInfo[]>([]);
  const urlCacheRef = useRef<Map<string, string>>(new Map());

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, UploadProgress>
  >(new Map());
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());

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

      // Update last used time for the connection
      updateConnectionLastUsed(params);

      notifications.show({
        message: 'Connected to S3 successfully',
        color: 'green',
        position: 'bottom-right',
      });
      await fetchBuckets();
    } catch (err: any) {
      notifications.show({
        message: `Connect failed: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
      throw err; // Re-throw error so ConnectForm can handle it
    } finally {
      setLoading(false);
    }
  }

  // Save connection after successful connection
  function handleConnectionSuccess(params: ConnectionParams) {
    saveConnection(params);
  }

  function doDisconnect() {
    setConnected(false);
    setShowConnect(true);
    setBuckets([]);
    setObjects([]);
    setBucket(null);
    setPrefix('');
    urlCacheRef.current.clear();

    notifications.show({
      message: 'Disconnected from S3',
      color: 'blue',
      position: 'bottom-right',
    });
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
        position: 'bottom-right',
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
        position: 'bottom-right',
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

  async function uploadFile(file: File): Promise<string> {
    if (!bucket) throw new Error('No bucket selected');

    // Generate unique upload ID
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Infer MIME type for the file
    const mimeType = inferMimeType(file);

    const arr = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    arr.forEach((b) => (binary += String.fromCharCode(b)));
    const b64 = btoa(binary);
    const key = prefix
      ? `${prefix.replace(/\/?$/, '/')}${file.name}`
      : file.name;

    // Add to active uploads
    setActiveUploads((prev) => new Set([...prev, uploadId]));
    setUploadProgress(
      (prev) =>
        new Map([
          ...prev,
          [uploadId, { progress: 0, uploaded: 0, total: file.size }],
        ])
    );

    // Set up progress listener
    const unlisten = await listen(`upload-progress-${uploadId}`, (event) => {
      const progress = event.payload as UploadProgress;
      setUploadProgress((prev) => new Map([...prev, [uploadId, progress]]));
    });

    try {
      await invoke('upload_object_with_progress', {
        params: {
          bucket,
          key,
          content_base64: b64,
          upload_id: uploadId,
          content_type: mimeType,
        },
      });

      // Clean up
      setTimeout(() => {
        setActiveUploads((prev) => {
          const newSet = new Set(prev);
          newSet.delete(uploadId);
          return newSet;
        });
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(uploadId);
          return newMap;
        });
      }, 2000); // Keep progress visible for 2 seconds after completion

      return uploadId;
    } catch (error) {
      // Clean up on error
      setActiveUploads((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(uploadId);
        return newMap;
      });
      throw error;
    } finally {
      unlisten();
    }
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
    uploadProgress,
    activeUploads,
    // setters
    setView,
    setShowConnect,
    setConn,
    setBucket,
    setPrefix,
    // actions
    doConnect,
    doDisconnect,
    handleConnectionSuccess,
    ensureObjectUrl,
    fetchBuckets,
    fetchObjects,
    deleteObject,
    createFolder,
    uploadFile,
  } as const;
}
