import React from 'react';
import { ActionIcon, Group, Table } from '@mantine/core';
import { S3ObjectInfo } from '../types';
import { humanFileSize, getFileName } from '../utils/common';
import { IconTrash, IconCopy, IconEye } from '@tabler/icons-react';
import { getFileIconWithProps } from '../utils/icons';

export type ObjectListTableProps = {
  objects: S3ObjectInfo[];
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => Promise<void> | void;
  onCopyUrl: (key: string) => void | Promise<void>;
  onPreviewExternal: (key: string) => void | Promise<void>;
};

export const ObjectListTable: React.FC<ObjectListTableProps> = ({
  objects,
  onEnterDir,
  onDelete,
  onCopyUrl,
  onPreviewExternal,
}) => {
  const rows = objects.map((o) => (
    <Table.Tr
      key={o.key}
      style={{ cursor: o.is_dir ? 'pointer' : 'default' }}
      onClick={() => (o.is_dir ? onEnterDir(o.key) : undefined)}
    >
      <Table.Td style={{ width: '24px' }}>
        {getFileIconWithProps(o.key, o.is_dir, {
          size: 20,
          color: 'var(--mantine-color-dimmed)',
        })}
      </Table.Td>
      <Table.Td>
        <div>
          <div
            style={{
              fontWeight: 500,
              color: o.is_dir
                ? 'var(--mantine-color-blue-6)'
                : 'var(--mantine-color-text)',
            }}
          >
            {getFileName(o.key)}
          </div>
          {o.key !== getFileName(o.key) && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--mantine-color-dimmed)',
                marginTop: '2px',
              }}
            >
              {o.key.replace(`/${getFileName(o.key)}`, '') || '/'}
            </div>
          )}
        </div>
      </Table.Td>
      <Table.Td>{o.is_dir ? '-' : humanFileSize(o.size)}</Table.Td>
      <Table.Td>{o.last_modified ?? '-'}</Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        {!o.is_dir && (
          <Group gap="xs" justify="center">
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                await onCopyUrl(o.key);
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
                onPreviewExternal(o.key);
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
              onClick={async (e) => {
                e.stopPropagation();
                await onDelete(o.key);
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
  ));

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
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};
