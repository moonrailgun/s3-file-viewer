import React from 'react';
import { Center, Text, Button, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { openConnectionForm } from '../utils/connectionWindow';

/**
 * Empty state component shown when no bucket is selected
 */
export const EmptyState = React.memo(() => {
  return (
    <Center h="100%" p="sm" style={{ flexDirection: 'column', gap: '1rem' }}>
      <Stack align="center" gap="md">
        <Text size="lg" c="dimmed">
          Welcome to S3 File Viewer
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Please select a connection and bucket from the left sidebar to start
          browsing
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openConnectionForm}
          size="md"
          mt="md"
        >
          Create New Connection
        </Button>
      </Stack>
    </Center>
  );
});

EmptyState.displayName = 'EmptyState';
