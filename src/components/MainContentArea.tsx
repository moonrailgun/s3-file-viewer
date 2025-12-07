import React from 'react';
import { Box, Center, Loader, Stack, Text } from '@mantine/core';
import { Upload } from 'lucide-react';
import { ObjectListTable } from './ObjectListTable';
import { ObjectThumbGrid } from './ObjectThumbGrid';
import type { S3ObjectInfo } from '../types';

interface MainContentAreaProps {
  loading: boolean;
  view: string;
  objects: S3ObjectInfo[];
  isDragging: boolean;
  dragHandlers: Record<string, any>;
  selectedFile: S3ObjectInfo | null;
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void;
  onPreviewExternal: (key: string) => void;
  onSelectFile: (file: S3ObjectInfo | null) => void;
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/**
 * Main content area component for displaying S3 objects
 * Handles both list and grid view modes
 */
export const MainContentArea = React.memo(
  ({
    loading,
    view,
    objects,
    isDragging,
    dragHandlers,
    selectedFile,
    onEnterDir,
    onDelete,
    onCopyUrl,
    onPreviewExternal,
    onSelectFile,
    ensureObjectUrl,
    hasMore,
    loadingMore,
    onLoadMore,
  }: MainContentAreaProps) => {
    return (
      <Box className="relative flex-1 overflow-auto" p="xs" {...dragHandlers}>
        {/* Drag and drop overlay */}
        {isDragging && (
          <Box
            className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center rounded-lg backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              border: '3px dashed var(--mantine-color-blue-6)',
            }}
          >
            <Stack align="center" gap="md">
              <Upload size={48} color="var(--mantine-color-blue-6)" />
              <Text size="xl" fw={600} c="blue">
                Drop files here to upload
              </Text>
            </Stack>
          </Box>
        )}

        {loading ? (
          <Center h="100%">
            <Loader type="dots" />
          </Center>
        ) : view === 'list' ? (
          <ObjectListTable
            objects={objects}
            onEnterDir={onEnterDir}
            onDelete={onDelete}
            onCopyUrl={onCopyUrl}
            onPreviewExternal={onPreviewExternal}
            onSelectFile={onSelectFile}
            selectedFileKey={selectedFile?.key}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        ) : (
          <ObjectThumbGrid
            objects={objects}
            ensureObjectUrl={ensureObjectUrl}
            onDelete={onDelete}
            onEnterDir={onEnterDir}
            onCopyUrl={onCopyUrl}
            onPreviewExternal={onPreviewExternal}
            onSelectFile={onSelectFile}
            selectedFileKey={selectedFile?.key}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        )}
      </Box>
    );
  }
);

MainContentArea.displayName = 'MainContentArea';
