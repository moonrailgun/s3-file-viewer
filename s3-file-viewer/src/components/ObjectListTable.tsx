import React from 'react';
import { ActionIcon, Badge, Group, Table } from '@mantine/core';
import { S3ObjectInfo } from '../types';
import { humanFileSize } from '../utils';
import { IconTrash } from '@tabler/icons-react';

export type ObjectListTableProps = {
  objects: S3ObjectInfo[];
  onEnterDir: (key: string) => void;
  onDelete: (key: string) => Promise<void> | void;
};

export const ObjectListTable: React.FC<ObjectListTableProps> = ({
  objects,
  onEnterDir,
  onDelete,
}) => {
  const rows = objects.map((o) => (
    <Table.Tr
      key={o.key}
      style={{ cursor: o.is_dir ? 'pointer' : 'default' }}
      onClick={() => (o.is_dir ? onEnterDir(o.key) : undefined)}
    >
      <Table.Td>{o.is_dir ? <Badge color="blue">DIR</Badge> : ''}</Table.Td>
      <Table.Td>{o.key}</Table.Td>
      <Table.Td>{o.is_dir ? '-' : humanFileSize(o.size)}</Table.Td>
      <Table.Td>{o.last_modified ?? '-'}</Table.Td>
      <Table.Td>
        {!o.is_dir && (
          <Group gap="xs">
            <ActionIcon
              color="red"
              variant="light"
              onClick={async (e) => {
                e.stopPropagation();
                await onDelete(o.key);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Type</Table.Th>
          <Table.Th>Key</Table.Th>
          <Table.Th>Size</Table.Th>
          <Table.Th>Modified</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};
