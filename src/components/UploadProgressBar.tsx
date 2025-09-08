import React from 'react';
import { Progress, Text, Group, Stack, Box } from '@mantine/core';
import { IconUpload, IconCheck } from '@tabler/icons-react';
import { humanFileSize } from '../utils/common';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  uploaded: number;
  total: number;
  isCompleted?: boolean;
}

export const UploadProgressBar: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  uploaded,
  total,
  isCompleted = false,
}) => {
  return (
    <Box
      p="md"
      style={{
        border: '1px solid var(--mantine-color-gray-4)',
        borderRadius: '8px',
        backgroundColor: 'var(--mantine-color-body)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            {isCompleted ? (
              <IconCheck size={16} color="var(--mantine-color-green-6)" />
            ) : (
              <IconUpload size={16} color="var(--mantine-color-blue-6)" />
            )}
            <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>
              {fileName}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {progress}%
          </Text>
        </Group>

        <Progress
          value={progress}
          size="sm"
          color={isCompleted ? 'green' : 'blue'}
          style={{
            '& .mantine-Progress-bar': {
              transition: 'width 0.3s ease',
            },
          }}
        />

        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {humanFileSize(uploaded)} / {humanFileSize(total)}
          </Text>
          <Text size="xs" c={isCompleted ? 'green' : 'dimmed'}>
            {isCompleted ? 'Completed' : 'Uploading...'}
          </Text>
        </Group>
      </Stack>
    </Box>
  );
};

interface UploadProgressListProps {
  uploads: Map<
    string,
    { progress: number; uploaded: number; total: number; fileName: string }
  >;
}

export const UploadProgressList: React.FC<UploadProgressListProps> = ({
  uploads,
}) => {
  if (uploads.size === 0) return null;

  return (
    <Stack
      gap="sm"
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 320,
        zIndex: 1000,
      }}
    >
      {Array.from(uploads.entries()).map(([uploadId, upload]) => (
        <UploadProgressBar
          key={uploadId}
          fileName={upload.fileName}
          progress={upload.progress}
          uploaded={upload.uploaded}
          total={upload.total}
          isCompleted={upload.progress >= 100}
        />
      ))}
    </Stack>
  );
};
