import { useMemo } from 'react';
import { Anchor } from '@mantine/core';

/**
 * Custom hook to generate breadcrumb navigation items
 */
export function useBreadcrumbs(
  prefix: string,
  onNavigate: (path: string) => void
): React.ReactNode[] {
  return useMemo(() => {
    const parts = (prefix || '').replace(/\/+$/, '').split('/').filter(Boolean);
    const items: React.ReactNode[] = [];

    items.push(
      <Anchor key="/" onClick={() => onNavigate('')} size="sm">
        /
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
  }, [prefix, onNavigate]);
}
