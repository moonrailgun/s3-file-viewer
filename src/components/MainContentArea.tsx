import React from 'react';
import { Box, Center, Loader, Group, Stack, Text } from '@mantine/core';
import { Upload } from 'lucide-react';
import { ObjectListTable } from './ObjectListTable';
import { ObjectThumb } from './ObjectThumb';
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
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
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
    gridContainerRef,
  }: MainContentAreaProps) => {
    return (
      <Box
        style={{ flex: 1, overflow: 'auto', position: 'relative' }}
        p="xs"
        {...dragHandlers}
      >
        {/* Drag and drop overlay */}
        {isDragging && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              backdropFilter: 'blur(2px)',
              border: '3px dashed var(--mantine-color-blue-6)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              pointerEvents: 'none',
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
          />
        ) : (
          <Group ref={gridContainerRef} justify="start" align="normal" gap={2}>
            {objects.map((o) => (
              <ObjectThumb
                key={o.key}
                obj={o}
                ensureObjectUrl={ensureObjectUrl}
                onDelete={onDelete}
                onEnterDir={onEnterDir}
                onCopyUrl={onCopyUrl}
                onPreviewExternal={onPreviewExternal}
                onSelectFile={onSelectFile}
                selectedFileKey={selectedFile?.key}
              />
            ))}
          </Group>
        )}
      </Box>
    );
  }
);

MainContentArea.displayName = 'MainContentArea';
