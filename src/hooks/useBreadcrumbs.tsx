import { useMemo } from 'react';
import { Anchor, Group, Text } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';

/**
 * Custom hook to generate breadcrumb navigation items
 */
export function useBreadcrumbs(
  prefix: string,
  bucketName: string | null,
  onNavigate: (path: string) => void
): React.ReactNode[] {
  return useMemo(() => {
    const parts = (prefix || '').replace(/\/+$/, '').split('/').filter(Boolean);
    const items: React.ReactNode[] = [];

    // Show bucket name as the root instead of "/"
    items.push(
      <Anchor key="/" onClick={() => onNavigate('')} size="sm">
        <Group gap={6}>
          <IconDatabase size={14} color="var(--mantine-color-blue-6)" />
          <Text size="xs" fw={600} c="blue">
            {bucketName}
          </Text>
        </Group>
      </Anchor>
    );

    let acc = '';
    parts.forEach((part) => {
      acc = acc ? `${acc}/${part}` : part;
      const target = `${acc}/`;

      items.push(
        <Anchor key={acc} onClick={() => onNavigate(target)} size="sm">
          {part}
        </Anchor>
      );
    });

    return items;
  }, [prefix, bucketName, onNavigate]);
}
