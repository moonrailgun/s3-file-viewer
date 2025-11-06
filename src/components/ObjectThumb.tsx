import React, { useRef, useEffect } from 'react';
import { Group, Stack, Text, ActionIcon, Box } from '@mantine/core';
import { useInViewport } from 'ahooks';
import { IconCopy, IconEye, IconTrash } from '@tabler/icons-react';
import { Copy, Eye, Trash2, Play } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { S3ObjectInfo } from '../types';
import {
  humanFileSize,
  isImageKey,
  isVideoKey,
  getFileType,
  getFileName,
} from '../utils/common';
import { getFileIconWithProps } from '../utils/icons';
import { ImagePreview } from './ImagePreview';

export type ObjectThumbProps = {
  obj: S3ObjectInfo;
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  onDelete: (key: string) => void;
  onEnterDir: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
  selectedFileKey?: string;
};

export const ObjectThumb: React.FC<ObjectThumbProps> = ({
  obj,
  ensureObjectUrl,
  onDelete,
  onEnterDir,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
  selectedFileKey,
}) => {
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [inView] = useInViewport(imgRef);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to selected item
  useEffect(() => {
    if (selectedFileKey === obj.key && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [selectedFileKey, obj.key]);

  // Get file icon props
  const iconProps = { size: 48, color: 'var(--mantine-color-dimmed)' };

  const borderColor =
    'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))';
  const hoverBorderColor = 'var(--mantine-color-blue-6)';

  return (
    <ContextMenu key={obj.key}>
      <ContextMenuTrigger asChild>
        <Stack
          ref={containerRef}
          p="xs"
          gap="xs"
          className="w-[220px] cursor-pointer rounded-xl border-2 transition-all duration-200 select-none"
          style={{
            borderColor:
              selectedFileKey === obj.key ? hoverBorderColor : borderColor,
            background:
              selectedFileKey === obj.key
                ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))'
                : 'var(--mantine-color-body)',
          }}
          onClick={() => {
            if (obj.is_dir) {
              onEnterDir(obj.key);
            } else if (onSelectFile) {
              onSelectFile(obj);
            }
          }}
          onDoubleClick={() => {
            if (!obj.is_dir) {
              onPreviewExternal(obj.key);
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.borderColor = hoverBorderColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = borderColor;
          }}
        >
          {obj.is_dir ? (
            <Box
              className="flex h-[140px] w-full flex-col items-center justify-center rounded-md border-2 border-dashed"
              style={{
                background:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                borderColor: borderColor,
              }}
            >
              {getFileIconWithProps(obj.key, obj.is_dir, iconProps)}
            </Box>
          ) : isImageKey(obj.key) ? (
            <Box ref={imgRef} className="h-[140px] w-full">
              <ImagePreview
                fileKey={obj.key}
                alt={obj.key}
                ensureObjectUrl={ensureObjectUrl}
                lazy={true}
                inView={inView}
                className="h-[140px] w-full cursor-pointer rounded-md object-cover"
                style={{
                  background: 'var(--mantine-color-body)',
                }}
              />
            </Box>
          ) : isVideoKey(obj.key) ? (
            <Box
              className="relative flex h-[140px] w-full flex-col items-center justify-center rounded-md border"
              style={{
                background:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                borderColor: borderColor,
              }}
            >
              {getFileIconWithProps(obj.key, obj.is_dir, iconProps)}
              {/* Play button overlay to indicate it's a video */}
              <Box
                className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md"
                style={{
                  background: 'var(--mantine-color-blue-6)',
                }}
              >
                <Play size={16} className="ml-0.5" color="white" />
              </Box>
            </Box>
          ) : (
            <Box
              className="flex h-[140px] w-full flex-col items-center justify-center rounded-md border"
              style={{
                background:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                borderColor: borderColor,
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
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(obj.key);
                }}
                title="Delete"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          )}
        </Stack>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {!obj.is_dir && (
          <>
            <ContextMenuItem
              onClick={async () => {
                await onCopyUrl(obj.key);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                onPreviewExternal(obj.key);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            onDelete(obj.key);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
