import React, { useEffect, useRef } from 'react';
import { Group, Stack, Text, ActionIcon, Box } from '@mantine/core';
import { useInViewport } from 'ahooks';
import { IconCopy, IconEye, IconTrash } from '@tabler/icons-react';
import { S3ObjectInfo } from '../types';
import {
  humanFileSize,
  isImageKey,
  getFileType,
  getFileName,
} from '../utils/common';
import { getFileIconWithProps } from '../utils/icons';

export type ObjectThumbProps = {
  obj: S3ObjectInfo;
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  onPreview: (key: string, url: string) => void;
  onDelete: (key: string) => Promise<void> | void;
  onEnterDir: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
};

export const ObjectThumb: React.FC<ObjectThumbProps> = ({
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

  // Get file icon props
  const iconProps = { size: 48, color: '#6c757d' };

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
      p="xs"
      gap="xs"
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        width: 220,
        cursor: obj.is_dir ? 'pointer' : 'default',
        background: 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderColor: '#007bff',
        },
      }}
      onClick={() => {
        if (obj.is_dir) onEnterDir(obj.key);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = '#007bff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#eee';
      }}
    >
      {obj.is_dir ? (
        <Box
          style={{
            width: '100%',
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
            borderRadius: 6,
            border: '2px dashed #dee2e6',
          }}
        >
          {getFileIconWithProps(obj.key, obj.is_dir, iconProps)}
        </Box>
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
            const url = await ensureObjectUrl(obj.key);
            if (url) (e.currentTarget as HTMLImageElement).src = url;
          }}
          onClick={async () => {
            const url = await ensureObjectUrl(obj.key);
            if (url) onPreview(obj.key, url);
          }}
        />
      ) : (
        <Box
          style={{
            width: '100%',
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8f9fa',
            borderRadius: 6,
            border: '1px solid #e9ecef',
          }}
        >
          {getFileIconWithProps(obj.key, obj.is_dir, iconProps)}
        </Box>
      )}

      {/* Always show filename */}
      <Text fw={600} size="sm" lineClamp={2} ta="center">
        {getFileName(obj.key)}
      </Text>
      <Text c="dimmed" size="xs" ta="center">
        {obj.is_dir
          ? 'Folder'
          : `${getFileType(obj.key).toUpperCase()} • ${humanFileSize(obj.size)}`}
      </Text>
      {!obj.is_dir && (
        <Group gap="xs" justify="center" mt="xs">
          <ActionIcon
            variant="light"
            color="blue"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCopyUrl(obj.key);
            }}
            title="Copy URL"
          >
            <IconCopy size={14} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="grape"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewExternal(obj.key);
            }}
            title="Preview"
          >
            <IconEye size={14} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation();
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
