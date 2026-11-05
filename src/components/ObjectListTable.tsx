import React, { useRef, useEffect } from 'react';
import { ActionIcon } from '@mantine/core';
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
import {
  humanFileSize,
  getFileName,
  getFileExtension,
  getFileType,
  formatDateTime,
} from '../utils/common';
import { IconCopy, IconEye, IconTrash } from '@tabler/icons-react';
import { getFileIconWithProps } from '../utils/icons';

export type ObjectListTableProps = {
  objects: S3ObjectInfo[];
  // Prefix being browsed; rows from deeper folders (search hits) show their path
  currentPrefix?: string;
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
  selectedFileKey?: string;
};

// Type chip color per file family (Mantine palette names)
const TYPE_COLORS: Record<ReturnType<typeof getFileType>, string> = {
  image: 'blue',
  video: 'grape',
  audio: 'pink',
  document: 'gray',
  archive: 'orange',
  code: 'teal',
  other: 'gray',
};

// Parent folder of a key, relative to the browsed prefix; '' when it is the prefix itself
function relativeParent(key: string, currentPrefix: string): string {
  const trimmed = key.replace(/\/+$/, '');
  const parent = trimmed.slice(0, trimmed.lastIndexOf('/') + 1);
  if (parent === currentPrefix) return '';
  return parent.startsWith(currentPrefix)
    ? parent.slice(currentPrefix.length)
    : parent || '/';
}

// Virtual row component
const VirtualRow: React.FC<{
  obj: S3ObjectInfo;
  isSelected: boolean;
  currentPrefix: string;
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
}> = ({
  obj,
  isSelected,
  currentPrefix,
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
}) => {
  const name = getFileName(obj.key);
  const ext = obj.is_dir ? '' : getFileExtension(obj.key);
  const base = ext ? name.slice(0, -(ext.length + 1)) : name;
  const parent = relativeParent(obj.key, currentPrefix);
  const chipColor = TYPE_COLORS[getFileType(obj.key)];

  return (
    <ContextMenu key={obj.key}>
      <ContextMenuTrigger asChild>
        <div
          className={`sv-row${obj.is_dir ? ' is-dir' : ''}${isSelected ? ' is-selected' : ''}`}
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
          <span className="sv-row-icon">
            {getFileIconWithProps(obj.key, obj.is_dir, {
              size: 15,
              stroke: 1.75,
            })}
          </span>

          <div className="sv-name-cell">
            <span className="sv-name" title={obj.key}>
              {base}
              {obj.is_dir ? (
                <span className="sv-name-dim">/</span>
              ) : (
                ext && <span className="sv-name-dim">.{ext}</span>
              )}
            </span>
            {parent && <span className="sv-name-path">{parent}</span>}
            {!obj.is_dir && (
              <div className="sv-row-actions">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onCopyUrl(obj.key);
                  }}
                  title="Copy URL"
                  aria-label="Copy URL"
                >
                  <IconCopy size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewExternal(obj.key);
                  }}
                  title="Preview"
                  aria-label="Preview"
                >
                  <IconEye size={14} />
                </ActionIcon>
                <ActionIcon
                  className="sv-row-del"
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(obj.key);
                  }}
                  title="Delete"
                  aria-label="Delete"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            )}
          </div>

          <span className="sv-col-type">
            {obj.is_dir ? (
              <span className="sv-type-dir">Folder</span>
            ) : (
              <span
                className="sv-type"
                style={
                  {
                    '--sv-chip-bg': `var(--mantine-color-${chipColor}-light)`,
                    '--sv-chip-fg': `var(--mantine-color-${chipColor}-light-color)`,
                  } as React.CSSProperties
                }
              >
                {ext ? ext.slice(0, 5).toUpperCase() : 'FILE'}
              </span>
            )}
          </span>
          <span className="sv-size sv-col-r">
            {obj.is_dir ? '—' : humanFileSize(obj.size)}
          </span>
          <span className="sv-date sv-col-date">
            {formatDateTime(obj.last_modified)}
          </span>
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
  currentPrefix = '',
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
  selectedFileKey,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize virtualizer with dynamic height measurement
  const virtualizer = useVirtualizer({
    count: objects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 26, // Dense rows: 26px including the hairline
    overscan: 8, // Render extra items above and below viewport
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

  // Keep the selected item in view (no jump when it is already visible)
  useEffect(() => {
    if (selectedFileKey) {
      const index = objects.findIndex((obj) => obj.key === selectedFileKey);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, {
          align: 'auto',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedFileKey, objects, virtualizer]);

  return (
    <div className="sv-list">
      {/* Table Header */}
      <div className="sv-list-head">
        <span />
        <span>Name</span>
        <span className="sv-col-type">Type</span>
        <span className="sv-col-r">Size</span>
        <span className="sv-col-date">Modified</span>
      </div>

      {/* Scrollable Body */}
      <div ref={parentRef} className="sv-list-body">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
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
                  currentPrefix={currentPrefix}
                  onEnterDir={onEnterDir}
                  onDelete={onDelete}
                  onCopyUrl={onCopyUrl}
                  onPreviewExternal={onPreviewExternal}
                  onSelectFile={onSelectFile}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
