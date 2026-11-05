import React from 'react';
import { Loader, UnstyledButton } from '@mantine/core';
import type { S3ObjectInfo } from '../types';
import { humanFileSize } from '../utils/common';

interface StatusBarProps {
  objects: S3ObjectInfo[];
  searchQuery: string;
  hasSelection: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/**
 * Bottom status line: item count / total size, and "Load more" for truncated listings
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  objects,
  searchQuery,
  hasSelection,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const n = objects.length;
  // Load more pages the folder listing, so it would mix into search results
  const canLoadMore = hasMore && !searchQuery;
  const bytes = objects.reduce((sum, o) => (o.is_dir ? sum : sum + o.size), 0);

  return (
    <div className="sv-statusbar">
      <span>
        {searchQuery
          ? `${n} result${n === 1 ? '' : 's'} for "${searchQuery}"`
          : `${n}${canLoadMore ? '+' : ''} item${n === 1 ? '' : 's'} · ${humanFileSize(bytes)}`}
      </span>
      {hasSelection && <span>1 selected</span>}
      {canLoadMore && (
        <span className="sv-statusbar-end">
          {loadingMore ? (
            <Loader size={10} />
          ) : (
            <UnstyledButton className="sv-statusbar-more" onClick={onLoadMore}>
              Load more
            </UnstyledButton>
          )}
        </span>
      )}
    </div>
  );
};
