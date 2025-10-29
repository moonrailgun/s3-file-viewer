import { useState, useCallback, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { openUrl as openExternalUrl } from '@tauri-apps/plugin-opener';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface UseFileOperationsProps {
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  deleteObject: (key: string) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  fetchObjects: () => void;
  bucket: string | null;
}

/**
 * Custom hook for file operations (copy, preview, delete, upload, create folder)
 */
export function useFileOperations({
  ensureObjectUrl,
  deleteObject,
  createFolder,
  uploadFile,
  fetchObjects,
  bucket,
}: UseFileOperationsProps) {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const [uploadFileNames, setUploadFileNames] = useState<Map<string, string>>(
    new Map()
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy object URL to clipboard
  const copyObjectUrl = useCallback(
    async (key: string) => {
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
    },
    [ensureObjectUrl]
  );

  // Preview file in new window
  const previewInNewWindow = useCallback(
    async (key: string) => {
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
    },
    [ensureObjectUrl]
  );

  // Download file to local
  const downloadFile = useCallback(
    async (key: string) => {
      try {
        if (!bucket) {
          throw new Error('No bucket selected');
        }

        // Get the file name from the key
        const fileName = key.split('/').pop() || 'download';

        // Extract file extension
        const lastDotIndex = fileName.lastIndexOf('.');
        const hasExtension =
          lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
        const extension = hasExtension
          ? fileName.substring(lastDotIndex + 1)
          : '';

        // Build filters based on file extension
        const filters = hasExtension
          ? [
              {
                name: `${extension.toUpperCase()} Files`,
                extensions: [extension],
              },
            ]
          : undefined;

        // Show save dialog
        const filePath = await save({
          defaultPath: fileName,
          filters,
        });

        if (!filePath) {
          // User cancelled the dialog
          return;
        }

        // Download the file using Rust layer
        await invoke('download_object', {
          bucket,
          key,
          savePath: filePath,
        });

        notifications.show({
          message: 'File downloaded successfully',
          color: 'green',
          position: 'bottom-right',
        });
      } catch (e) {
        console.error('Download failed:', e);
        notifications.show({
          message: `Download failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
          color: 'red',
          position: 'bottom-right',
        });
      }
    },
    [bucket]
  );

  // Delete handlers
  const handleDeleteRequest = useCallback((key: string) => {
    setFileToDelete(key);
    setDeleteModalOpened(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpened(false);
    setFileToDelete(null);
    setDeletingFile(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [fileToDelete, deleteObject, fetchObjects, handleDeleteCancel]);

  // Upload handlers
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    },
    [uploadFile, fetchObjects]
  );

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
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
      fetchObjects();
    },
    [uploadFile, fetchObjects]
  );

  // Create folder handler
  const handleCreateFolder = useCallback(
    async (name: string) => {
      try {
        await createFolder(name);
        notifications.show({
          message: `Folder created: ${name}`,
          color: 'green',
          position: 'bottom-right',
        });
        fetchObjects();
        return true;
      } catch (err: any) {
        notifications.show({
          message: `Create folder failed: ${err}`,
          color: 'red',
          position: 'bottom-right',
        });
        return false;
      }
    },
    [createFolder, fetchObjects]
  );

  return {
    // Delete state
    deleteModalOpened,
    fileToDelete,
    deletingFile,
    // Upload state
    uploadFileNames,
    fileInputRef,
    // Methods
    copyObjectUrl,
    previewInNewWindow,
    downloadFile,
    handleDeleteRequest,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleFileUpload,
    handleUploadFiles,
    handleCreateFolder,
  };
}
