import React, { useRef, useEffect } from 'react';
import { ActionIcon, Group } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Copy, Eye, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { S3ObjectInfo } from '../types';
import { humanFileSize, getFileName, formatDateTime } from '../utils/common';
import { IconTrash, IconCopy, IconEye } from '@tabler/icons-react';
import { getFileIconWithProps } from '../utils/icons';

export type ObjectListTableProps = {
  objects: S3ObjectInfo[];
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
  selectedFileKey?: string;
};

// Virtual row component
const VirtualRow: React.FC<{
  obj: S3ObjectInfo;
  isSelected: boolean;
  index: number;
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
  isMobile: boolean;
}> = ({
  obj,
  isSelected,
  index,
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
  isMobile,
}) => {
  return (
    <ContextMenu key={obj.key}>
      <ContextMenuTrigger asChild>
        <div
          className="grid min-h-8 cursor-pointer items-center gap-1.5 px-3 py-0.5 text-[13px] transition-colors duration-150 select-none"
          style={{
            gridTemplateColumns: isMobile
              ? '20px 1fr 60px'
              : '20px 1fr 80px 130px 100px',
            backgroundColor: isSelected
              ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))'
              : index % 2 === 0
                ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                : 'transparent',
            borderBottom:
              '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor =
                'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor =
                index % 2 === 0
                  ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                  : 'transparent';
            }
          }}
          onClick={() => {
            if (obj.is_dir) {
              onEnterDir(obj.key);
            } else if (onSelectFile) {
              onSelectFile(obj);
            }
          }}
          onDoubleClick={() =>
            !obj.is_dir ? onPreviewExternal(obj.key) : undefined
          }
        >
          <div className="flex items-center">
            {getFileIconWithProps(obj.key, obj.is_dir, {
              size: 16,
              color: 'var(--mantine-color-dimmed)',
            })}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div
              className="text-[13px] font-medium break-words"
              style={{
                color: obj.is_dir
                  ? 'var(--mantine-color-blue-6)'
                  : 'var(--mantine-color-text)',
              }}
            >
              {getFileName(obj.key)}
            </div>
            {obj.key !== getFileName(obj.key) && (
              <div
                className="text-[11px] break-words"
                style={{
                  color: 'var(--mantine-color-dimmed)',
                }}
              >
                {obj.key.replace(`/${getFileName(obj.key)}`, '') || '/'}
              </div>
            )}
            {/* Show size on mobile under filename */}
            {isMobile && !obj.is_dir && (
              <div
                className="text-[11px]"
                style={{
                  color: 'var(--mantine-color-dimmed)',
                }}
              >
                {humanFileSize(obj.size)}
              </div>
            )}
          </div>
          {!isMobile && <div>{obj.is_dir ? '-' : humanFileSize(obj.size)}</div>}
          {!isMobile && (
            <div className="text-nowrap">
              {formatDateTime(obj.last_modified)}
            </div>
          )}
          <div className="flex justify-center">
            {!obj.is_dir && (
              <Group gap="xs" justify="center">
                {!isMobile && (
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onCopyUrl(obj.key);
                    }}
                    title="Copy URL"
                    className="transition-all duration-200 ease-in-out"
                  >
                    <IconCopy size={14} />
                  </ActionIcon>
                )}
                <ActionIcon
                  variant="light"
                  color="grape"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewExternal(obj.key);
                  }}
                  title="Preview"
                  className="transition-all duration-200 ease-in-out"
                >
                  <IconEye size={14} />
                </ActionIcon>
                {!isMobile && (
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(obj.key);
                    }}
                    title="Delete"
                    className="transition-all duration-200 ease-in-out"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                )}
              </Group>
            )}
          </div>
        </div>
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

export const ObjectListTable: React.FC<ObjectListTableProps> = ({
  objects,
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
  selectedFileKey,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Initialize virtualizer with dynamic height measurement
  const virtualizer = useVirtualizer({
    count: objects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Compact layout: reduced to 32px
    overscan: 5, // Render 5 extra items above and below viewport
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined, // Enable dynamic height measurement (except Firefox for performance)
    // Generate stable keys based on object key
    getItemKey: (index) => objects[index]?.key ?? `item-${index}`,
  });

  // Reset scroll position when objects list changes (e.g., switching connections or directories)
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [objects.length > 0 ? objects[0]?.key : '']);

  // Auto scroll to selected item
  useEffect(() => {
    if (selectedFileKey) {
      const index = objects.findIndex((obj) => obj.key === selectedFileKey);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, {
          align: 'center',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedFileKey, objects, virtualizer]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm"
      style={{
        border:
          '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
      {/* Table Header */}
      <div
        className="sticky top-0 z-10 grid gap-1.5 px-3 py-1 text-xs font-semibold"
        style={{
          gridTemplateColumns: isMobile
            ? '20px 1fr 60px'
            : '20px 1fr 80px 130px 100px',
          backgroundColor:
            'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
          borderBottom:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        <div></div>
        <div>Name</div>
        {!isMobile && <div>Size</div>}
        {!isMobile && <div>Modified</div>}
        <div className="text-center">Actions</div>
      </div>

      {/* Scrollable Body */}
      <div ref={parentRef} className="relative flex-1 overflow-auto">
        <div
          className="relative w-full"
          style={{
            height: `${virtualizer.getTotalSize()}px`,
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const obj = objects[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VirtualRow
                  obj={obj}
                  isSelected={selectedFileKey === obj.key}
                  index={virtualRow.index}
                  onEnterDir={onEnterDir}
                  onDelete={onDelete}
                  onCopyUrl={onCopyUrl}
                  onPreviewExternal={onPreviewExternal}
                  onSelectFile={onSelectFile}
                  isMobile={isMobile || false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
