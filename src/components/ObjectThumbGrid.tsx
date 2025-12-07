import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button, Loader, Center } from '@mantine/core';
import { ObjectThumb } from './ObjectThumb';
import { S3ObjectInfo } from '../types';

export type ObjectThumbGridProps = {
  objects: S3ObjectInfo[];
  ensureObjectUrl: (key: string) => Promise<string | undefined>;
  onDelete: (key: string) => void;
  onEnterDir: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
  selectedFileKey?: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

const THUMB_WIDTH = 220; // Width of each thumbnail
const THUMB_GAP = 2; // Gap between thumbnails
const ROW_HEIGHT = 280 + THUMB_GAP * 2; // Estimated height: content + top padding + bottom padding

export const ObjectThumbGrid: React.FC<ObjectThumbGridProps> = ({
  objects,
  ensureObjectUrl,
  onDelete,
  onEnterDir,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
  selectedFileKey,
  hasMore,
  loadingMore,
  onLoadMore,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Monitor container width changes
  useEffect(() => {
    if (!parentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(parentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate columns per row based on container width
  const columnsPerRow = useMemo(() => {
    if (containerWidth === 0) return 1;
    const availableWidth = containerWidth - 16; // Account for padding
    return Math.max(
      1,
      Math.floor((availableWidth + THUMB_GAP) / (THUMB_WIDTH + THUMB_GAP))
    );
  }, [containerWidth]);

  // Group objects into rows
  const rows = useMemo(() => {
    const result: S3ObjectInfo[][] = [];
    for (let i = 0; i < objects.length; i += columnsPerRow) {
      result.push(objects.slice(i, i + columnsPerRow));
    }
    return result;
  }, [objects, columnsPerRow]);

  // Initialize virtualizer with dynamic height measurement
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT, // Initial estimate, will be measured dynamically
    overscan: 2,
    // Generate stable keys based on the first item in each row
    getItemKey: (index) => {
      const row = rows[index];
      return row && row.length > 0 ? row[0].key : `row-${index}`;
    },
    // Enable dynamic height measurement
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined, // Enable dynamic height measurement (except Firefox for performance)
  });

  // Reset scroll position when objects list changes (e.g., switching connections or directories)
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [objects.length > 0 ? objects[0]?.key : '']);

  // Auto scroll to selected item
  useEffect(() => {
    if (selectedFileKey && rows.length > 0) {
      const itemIndex = objects.findIndex((obj) => obj.key === selectedFileKey);
      if (itemIndex !== -1) {
        const rowIndex = Math.floor(itemIndex / columnsPerRow);
        virtualizer.scrollToIndex(rowIndex, {
          align: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedFileKey, objects, columnsPerRow, rows.length, virtualizer]);

  return (
    <div ref={parentRef} className="relative h-full w-full overflow-auto">
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize() + (hasMore ? 70 : 0)}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowObjects = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full px-2"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                paddingTop: `${THUMB_GAP}px`,
                paddingBottom: `${THUMB_GAP}px`,
              }}
            >
              <div
                className="grid justify-center"
                style={{
                  gridTemplateColumns: `repeat(${columnsPerRow}, ${THUMB_WIDTH}px)`,
                  gap: `${THUMB_GAP}px`,
                }}
              >
                {rowObjects.map((obj) => (
                  <ObjectThumb
                    key={obj.key}
                    obj={obj}
                    ensureObjectUrl={ensureObjectUrl}
                    onDelete={onDelete}
                    onEnterDir={onEnterDir}
                    onCopyUrl={onCopyUrl}
                    onPreviewExternal={onPreviewExternal}
                    onSelectFile={onSelectFile}
                    selectedFileKey={selectedFileKey}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Load More Button at bottom of grid */}
        {hasMore && (
          <div
            className="absolute left-0 right-0 px-3 py-3"
            style={{
              top: `${virtualizer.getTotalSize()}px`,
              backgroundColor: 'var(--mantine-color-body)',
              borderTop:
                '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
            }}
          >
            <Center>
              {loadingMore ? (
                <Loader size="sm" />
              ) : (
                <Button variant="light" size="sm" onClick={onLoadMore}>
                  Load More
                </Button>
              )}
            </Center>
          </div>
        )}
      </div>
    </div>
  );
};
