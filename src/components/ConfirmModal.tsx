import React from 'react';
import { Modal, Text, Button, Group, Stack } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  confirmLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmLabel = 'Confirm',
  confirmColor = 'red',
  loading = false,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered size="sm">
      <Stack gap="md">
        <Group gap="sm" align="flex-start">
          <IconAlertTriangle
            size={24}
            color="var(--mantine-color-orange-6)"
            style={{ marginTop: 2 }}
          />
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500} mb="xs">
              {message}
            </Text>
            {itemName && (
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
                {itemName}
              </Text>
            )}
            <Text size="xs" c="orange" mt="xs">
              This action cannot be undone.
            </Text>
          </div>
        </Group>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
