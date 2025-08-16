import React, { useEffect, useRef } from 'react';
import { Group, Stack, Text, ActionIcon } from '@mantine/core';
import { useInViewport } from 'ahooks';
import { IconCopy, IconEye, IconTrash } from '@tabler/icons-react';
import { S3ObjectInfo } from '../types';
import { humanFileSize, isImageKey } from '../utils';

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
