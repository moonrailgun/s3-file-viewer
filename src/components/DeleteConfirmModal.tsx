import React from 'react';
import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface DeleteConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  opened,
  onClose,
  onConfirm,
  fileName,
  loading = false,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirm Delete"
      centered
      size="sm"
    >
      <Stack gap="md">
        <Group gap="sm" align="flex-start">
          <IconAlertTriangle
            size={24}
            color="var(--mantine-color-orange-6)"
            style={{ marginTop: 2 }}
          />
          <div>
            <Text size="sm" fw={500} mb="xs">
              Are you sure you want to delete this file?
            </Text>
            <Text
              size="sm"
              c="dimmed"
              style={{
                wordBreak: 'break-all',
                backgroundColor:
                  'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
                padding: '8px',
                borderRadius: '4px',
                border:
                  '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
              }}
            >
              {fileName}
            </Text>
            <Text size="xs" c="orange" mt="xs">
              This action cannot be undone.
            </Text>
          </div>
        </Group>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={loading}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
