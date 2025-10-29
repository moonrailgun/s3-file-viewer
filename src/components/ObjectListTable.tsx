import React, { useRef, useEffect } from 'react';
import { ActionIcon, Group, Table } from '@mantine/core';
import { Copy, Eye, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { S3ObjectInfo } from '../types';
import { humanFileSize, getFileName } from '../utils/common';
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

// Row component with auto-scroll support
const TableRow: React.FC<{
  obj: S3ObjectInfo;
  isSelected: boolean;
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
  onSelectFile?: (file: S3ObjectInfo) => void;
}> = ({
  obj,
  isSelected,
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
  onSelectFile,
}) => {
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  // Auto scroll to selected item
  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [isSelected]);

  return (
    <ContextMenu key={obj.key}>
      <ContextMenuTrigger asChild>
        <Table.Tr
          ref={rowRef}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            backgroundColor: isSelected
              ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))'
              : undefined,
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
          <Table.Td style={{ width: '24px' }}>
            {getFileIconWithProps(obj.key, obj.is_dir, {
              size: 20,
              color: 'var(--mantine-color-dimmed)',
            })}
          </Table.Td>
          <Table.Td>
            <div>
              <div
                style={{
                  fontWeight: 500,
                  color: obj.is_dir
                    ? 'var(--mantine-color-blue-6)'
                    : 'var(--mantine-color-text)',
                }}
              >
                {getFileName(obj.key)}
              </div>
              {obj.key !== getFileName(obj.key) && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--mantine-color-dimmed)',
                    marginTop: '2px',
                  }}
                >
                  {obj.key.replace(`/${getFileName(obj.key)}`, '') || '/'}
                </div>
              )}
            </div>
          </Table.Td>
          <Table.Td>{obj.is_dir ? '-' : humanFileSize(obj.size)}</Table.Td>
          <Table.Td>{obj.last_modified ?? '-'}</Table.Td>
          <Table.Td style={{ textAlign: 'center' }}>
            {!obj.is_dir && (
              <Group gap="xs" justify="center">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onCopyUrl(obj.key);
                  }}
                  title="Copy URL"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <IconCopy size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="grape"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewExternal(obj.key);
                  }}
                  title="Preview"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <IconEye size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(obj.key);
                  }}
                  title="Delete"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            )}
          </Table.Td>
        </Table.Tr>
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
  return (
    <Table
      striped
      highlightOnHover
      withTableBorder
      style={{
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: '24px' }}></Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Modified</Table.Th>
          <Table.Th style={{ width: '120px' }}>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {objects.map((o) => (
          <TableRow
            key={o.key}
            obj={o}
            isSelected={selectedFileKey === o.key}
            onEnterDir={onEnterDir}
            onDelete={onDelete}
            onCopyUrl={onCopyUrl}
            onPreviewExternal={onPreviewExternal}
            onSelectFile={onSelectFile}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
};
