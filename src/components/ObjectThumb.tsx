import React, { useRef } from 'react';
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
import { VideoPreview } from './VideoPreview';

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

  // Get file icon props
  const iconProps = { size: 48, color: 'var(--mantine-color-dimmed)' };

  const borderColor =
    'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))';
  const hoverBorderColor = 'var(--mantine-color-blue-6)';

  return (
    <ContextMenu key={obj.key}>
      <ContextMenuTrigger asChild>
        <Stack
          p="xs"
          gap="xs"
          style={{
            border: `2px solid ${selectedFileKey === obj.key ? hoverBorderColor : borderColor}`,
            borderRadius: 12,
            width: 220,
            cursor: 'pointer',
            background:
              selectedFileKey === obj.key
                ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))'
                : 'var(--mantine-color-body)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
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
              style={{
                width: '100%',
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                borderRadius: 6,
                border: `2px dashed ${borderColor}`,
              }}
            >
              {getFileIconWithProps(obj.key, obj.is_dir, iconProps)}
            </Box>
          ) : isImageKey(obj.key) ? (
            <Box ref={imgRef} style={{ width: '100%', height: 140 }}>
              <ImagePreview
                fileKey={obj.key}
                alt={obj.key}
                ensureObjectUrl={ensureObjectUrl}
                lazy={true}
                inView={inView}
                style={{
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 6,
                  background: 'var(--mantine-color-body)',
                  cursor: 'pointer',
                }}
              />
            </Box>
          ) : isVideoKey(obj.key) ? (
            <Box
              ref={imgRef}
              style={{
                width: '100%',
                height: 140,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 6,
              }}
            >
              <VideoPreview
                fileKey={obj.key}
                ensureObjectUrl={ensureObjectUrl}
                style={{
                  width: '100%',
                  height: 140,
                  objectFit: 'cover',
                  borderRadius: 6,
                  background: 'var(--mantine-color-body)',
                }}
                controls={false}
                muted
              />
              {/* Play button overlay */}
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  pointerEvents: 'none',
                }}
              >
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play
                    size={24}
                    style={{ marginLeft: 4 }}
                    color="var(--mantine-color-blue-6)"
                  />
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              style={{
                width: '100%',
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                borderRadius: 6,
                border: `1px solid ${borderColor}`,
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
