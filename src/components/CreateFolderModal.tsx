import React, { useState } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text } from '@mantine/core';
import { IconFolderPlus } from '@tabler/icons-react';

interface CreateFolderModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
  loading?: boolean;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  opened,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmedName = folderName.trim();

    // Validation
    if (!trimmedName) {
      setError('Folder name cannot be empty');
      return;
    }

    if (trimmedName.includes('/')) {
      setError('Folder name cannot contain "/"');
      return;
    }

    if (trimmedName.includes('\\')) {
      setError('Folder name cannot contain "\\"');
      return;
    }

    if (trimmedName.length > 255) {
      setError('Folder name is too long (max 255 characters)');
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(trimmedName)) {
      setError('Folder name contains invalid characters');
      return;
    }

    onConfirm(trimmedName);
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && folderName.trim() && !loading) {
      handleSubmit();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconFolderPlus size={20} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>Create New Folder</Text>
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="md">
        <Group gap="sm" align="flex-start">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="sm">Enter a name for the new folder:</Text>
            <TextInput
              placeholder="Folder name"
              value={folderName}
              onChange={(event) => {
                setFolderName(event.currentTarget.value);
                setError(''); // Clear error when user types
              }}
              onKeyPress={handleKeyPress}
              error={error}
              disabled={loading}
              autoFocus
              styles={{
                input: {
                  fontSize: '14px',
                },
              }}
            />
            <Text size="xs" c="dimmed">
              The folder will be created in the current directory.
            </Text>
          </Stack>
        </Group>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconFolderPlus size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!folderName.trim()}
          >
            Create Folder
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
