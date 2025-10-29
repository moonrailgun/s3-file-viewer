import React from 'react';
import { Center, Text } from '@mantine/core';

/**
 * Empty state component shown when no bucket is selected
 */
export const EmptyState = React.memo(() => {
  return (
    <Center h="100%" style={{ flexDirection: 'column', gap: '1rem' }}>
      <Text size="lg" c="dimmed">
        Welcome to S3 File Viewer
      </Text>
      <Text size="sm" c="dimmed">
        Please select a connection and bucket from the left sidebar to start
        browsing
      </Text>
    </Center>
  );
});

EmptyState.displayName = 'EmptyState';
