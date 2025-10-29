import React from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  Divider,
  Box,
  ActionIcon,
} from '@mantine/core';
import { X, Copy, Eye, Trash2, Download } from 'lucide-react';
import { S3ObjectInfo } from '../types';
import {
  humanFileSize,
  getFileName,
  isImageKey,
  isVideoKey,
  isAudioKey,
  formatDateTime,
} from '../utils/common';
import { getFileIconWithProps } from '../utils/icons';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';
import { AudioPreview } from './AudioPreview';

export type FileDetailsSidebarProps = {
  file: S3ObjectInfo | null;
  onClose: () => void;
  onCopyUrl?: (key: string) => void | Promise<void>;
  onPreview?: (key: string) => void | Promise<void>;
  onDownload?: (key: string) => void | Promise<void>;
  onDelete?: (key: string) => void;
  ensureObjectUrl?: (key: string) => Promise<string | undefined>;
  onImagePreview?: (key: string, url: string) => void;
};

export const FileDetailsSidebar: React.FC<FileDetailsSidebarProps> = ({
  file,
  onClose,
  onCopyUrl,
  onPreview,
  onDownload,
  onDelete,
  ensureObjectUrl,
  onImagePreview,
}) => {
  if (!file) {
    return null;
  }

  const fileName = getFileName(file.key);
  const fileExtension = fileName.includes('.')
    ? fileName.split('.').pop()?.toUpperCase()
    : 'Unknown';

  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor:
          'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
      }}
    >
      {/* Header */}
      <Group
        justify="space-between"
        p="md"
        style={{
          borderBottom:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        <Text size="lg" fw={600}>
          File Details
        </Text>
        <ActionIcon variant="subtle" onClick={onClose}>
          <X size={18} />
        </ActionIcon>
      </Group>

      {/* Content */}
      <Stack p="md" gap="md" style={{ flex: 1, overflow: 'auto' }}>
        {/* File Preview or Icon */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          {file.is_dir ? (
            // Show icon for directories
            getFileIconWithProps(file.key, file.is_dir, {
              size: 64,
              color: 'var(--mantine-color-blue-6)',
            })
          ) : isImageKey(file.key) ? (
            // Show image preview for images
            <ImagePreview
              fileKey={file.key}
              alt={fileName}
              ensureObjectUrl={ensureObjectUrl}
              className="max-h-[300px] max-w-full cursor-pointer rounded-lg border border-solid border-[light-dark(var(--mantine-color-gray-3),var(--mantine-color-dark-4))] bg-[var(--mantine-color-body)] object-contain"
              onClick={async () => {
                const url = await ensureObjectUrl?.(file.key);
                if (url) {
                  onImagePreview?.(file.key, url);
                }
              }}
            />
          ) : isVideoKey(file.key) ? (
            // Show video player for videos
            <VideoPreview
              fileKey={file.key}
              ensureObjectUrl={ensureObjectUrl}
              className="max-h-[300px] w-full rounded-lg border border-solid border-[light-dark(var(--mantine-color-gray-3),var(--mantine-color-dark-4))] bg-[var(--mantine-color-body)]"
              controls
            />
          ) : isAudioKey(file.key) ? (
            // Show audio player for audio files
            <AudioPreview
              fileKey={file.key}
              ensureObjectUrl={ensureObjectUrl}
              style={{ width: '100%' }}
              controls
            />
          ) : (
            // Show icon for other file types
            getFileIconWithProps(file.key, file.is_dir, {
              size: 64,
              color: 'var(--mantine-color-blue-6)',
            })
          )}
        </Box>

        {/* File Name */}
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            File Name
          </Text>
          <Text
            size="sm"
            fw={500}
            style={{
              wordBreak: 'break-word',
            }}
          >
            {fileName}
          </Text>
        </Box>

        <Divider />

        {/* File Type */}
        {!file.is_dir && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              File Type
            </Text>
            <Text size="sm">{fileExtension}</Text>
          </Box>
        )}

        {/* File Size */}
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            File Size
          </Text>
          <Text size="sm">{file.is_dir ? '-' : humanFileSize(file.size)}</Text>
        </Box>

        {/* Last Modified */}
        {file.last_modified && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Last Modified
            </Text>
            <Text size="sm">{formatDateTime(file.last_modified)}</Text>
          </Box>
        )}

        {/* Full Path */}
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Full Path
          </Text>
          <Text
            size="sm"
            style={{
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: '11px',
            }}
          >
            {file.key}
          </Text>
        </Box>

        <Divider />

        {/* Actions */}
        {!file.is_dir && (
          <Stack gap="xs">
            <Text size="xs" c="dimmed" mb={4}>
              Actions
            </Text>
            {onCopyUrl && (
              <Button
                variant="light"
                leftSection={<Copy size={16} />}
                onClick={() => onCopyUrl(file.key)}
                fullWidth
              >
                Copy URL
              </Button>
            )}
            {onPreview && (
              <Button
                variant="light"
                color="grape"
                leftSection={<Eye size={16} />}
                onClick={() => onPreview(file.key)}
                fullWidth
              >
                Preview
              </Button>
            )}
            {onDownload && (
              <Button
                variant="light"
                color="green"
                leftSection={<Download size={16} />}
                onClick={() => onDownload(file.key)}
                fullWidth
              >
                Download
              </Button>
            )}
            {onDelete && (
              <Button
                variant="light"
                color="red"
                leftSection={<Trash2 size={16} />}
                onClick={() => onDelete(file.key)}
                fullWidth
              >
                Delete
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
