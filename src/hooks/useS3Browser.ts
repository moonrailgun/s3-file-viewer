import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorageState } from 'ahooks';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { notifications } from '@mantine/notifications';
import { BucketInfo, ConnectionParams, S3ObjectInfo } from '../types';
import {
  updateConnectionLastUsed,
  saveConnection,
  loadSavedConnections,
} from '../utils/connectionManager';
import { inferMimeType } from '../utils/mimeTypes';

// Upload progress interface
interface UploadProgress {
  progress: number;
  uploaded: number;
  total: number;
}

// Core stateful logic for S3 browsing with multi-connection support
export function useS3Browser() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [objects, setObjects] = useState<S3ObjectInfo[]>([]);
  const urlCacheRef = useRef<Map<string, string | null>>(new Map());
  const urlErrorCacheRef = useRef<Map<string, boolean>>(new Map()); // Track failed requests

  // Multi-connection state
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(
    null
  );
  const [connectionBuckets, setConnectionBuckets] = useState<
    Map<string, BucketInfo[]>
  >(new Map());
  const [connectionLoading, setConnectionLoading] = useState<
    Map<string, boolean>
  >(new Map());

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

  const handleResetUrlCache = useCallback(() => {
    urlCacheRef.current.clear();
    urlErrorCacheRef.current.clear(); // Also clear error cache
  }, []);

  useEffect(() => {
    handleResetUrlCache();
  }, [bucket]);

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

  // Connect to a saved connection by ID
  async function connectToSavedConnection(connectionId: string) {
    const savedConnections = loadSavedConnections();
    const conn = savedConnections.find((c) => c.id === connectionId);
    if (!conn) {
      notifications.show({
        message: 'Connection not found',
        color: 'red',
        position: 'bottom-right',
      });
      return;
    }

    try {
      // Set loading for this connection
      setConnectionLoading((prev) => new Map(prev).set(connectionId, true));

      const params = {
        endpoint: conn.endpoint,
        access_key: conn.access_key,
        secret_key: conn.secret_key,
        region: conn.region,
      };

      await invoke('connect', { params });
      setConnected(true);
      setActiveConnectionId(connectionId);
      setConn(params);

      // Update last used time
      updateConnectionLastUsed(params);

      // Fetch and cache buckets for this connection
      const bucketList = (await invoke('list_buckets')) as BucketInfo[];
      setConnectionBuckets((prev) =>
        new Map(prev).set(connectionId, bucketList)
      );
      setBuckets(bucketList);

      notifications.show({
        message: 'Connected successfully',
        color: 'green',
        position: 'bottom-right',
      });
    } catch (err: any) {
      notifications.show({
        message: `Connection failed: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
    } finally {
      setConnectionLoading((prev) => new Map(prev).set(connectionId, false));
    }
  }

  // Refresh buckets for a connection
  async function refreshConnectionBuckets(connectionId: string) {
    handleResetUrlCache();
    if (activeConnectionId !== connectionId) {
      notifications.show({
        message: 'Please connect to this connection first',
        color: 'orange',
        position: 'bottom-right',
      });
      return;
    }

    try {
      setConnectionLoading((prev) => new Map(prev).set(connectionId, true));
      const bucketList = (await invoke('list_buckets')) as BucketInfo[];
      setConnectionBuckets((prev) =>
        new Map(prev).set(connectionId, bucketList)
      );
      setBuckets(bucketList);

      notifications.show({
        message: 'Buckets refreshed',
        color: 'green',
        position: 'bottom-right',
      });
    } catch (err: any) {
      notifications.show({
        message: `Refresh failed: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
    } finally {
      setConnectionLoading((prev) => new Map(prev).set(connectionId, false));
    }
  }

  // Select a bucket from a connection
  function selectConnectionBucket(connectionId: string, bucketName: string) {
    if (activeConnectionId !== connectionId) {
      notifications.show({
        message: 'Please connect to this connection first',
        color: 'orange',
        position: 'bottom-right',
      });
      return;
    }

    // Clear objects list immediately when switching bucket
    setObjects([]);
    setBucket(bucketName);
    setPrefix('');
  }

  // Delete connection from state
  function deleteConnectionFromState(connectionId: string) {
    setConnectionBuckets((prev) => {
      const newMap = new Map(prev);
      newMap.delete(connectionId);
      return newMap;
    });
    setConnectionLoading((prev) => {
      const newMap = new Map(prev);
      newMap.delete(connectionId);
      return newMap;
    });

    if (activeConnectionId === connectionId) {
      setActiveConnectionId(null);
      setConnected(false);
      setBuckets([]);
      setObjects([]);
      setBucket(null);
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
    urlErrorCacheRef.current.clear(); // Clear error cache on disconnect

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

    // Check if this request has already failed
    if (urlErrorCacheRef.current.get(key)) {
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
      // Cache the error to prevent repeated requests
      urlErrorCacheRef.current.set(key, true);
      console.error(`Failed to get URL for ${key}:`, e);
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

  const fetchObjects = useCallback(async () => {
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
  }, [bucket, prefix]);

  async function deleteObject(key: string) {
    if (!bucket) return;
    await invoke('delete_object', { bucket, key });
  }

  async function createFolder(name: string) {
    if (!bucket) return;
    const key = prefix ? `${prefix.replace(/\/?$/, '/')}${name}/` : `${name}/`;
    await invoke('create_folder', { bucket, folderKey: key });
  }

  async function createBucket(bucketName: string, region: string) {
    try {
      await invoke('create_bucket', { bucketName, region });

      notifications.show({
        message: `Bucket "${bucketName}" created successfully`,
        color: 'green',
        position: 'bottom-right',
      });

      // Refresh bucket list after creation
      if (activeConnectionId) {
        const bucketList = (await invoke('list_buckets')) as BucketInfo[];
        setConnectionBuckets((prev) =>
          new Map(prev).set(activeConnectionId, bucketList)
        );
        setBuckets(bucketList);

        // Auto-select the newly created bucket
        setBucket(bucketName);
        setPrefix('');
      }
    } catch (err: any) {
      notifications.show({
        message: `Failed to create bucket: ${err}`,
        color: 'red',
        position: 'bottom-right',
      });
      throw err; // Re-throw so modal can handle it
    }
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
  }, [connected, bucket, fetchObjects]);

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
    // Multi-connection state
    activeConnectionId,
    connectionBuckets,
    connectionLoading,
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
    handleResetUrlCache,
    ensureObjectUrl,
    fetchBuckets,
    fetchObjects,
    deleteObject,
    createFolder,
    createBucket,
    uploadFile,
    // Multi-connection actions
    connectToSavedConnection,
    refreshConnectionBuckets,
    selectConnectionBucket,
    deleteConnectionFromState,
  } as const;
}
