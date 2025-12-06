import React, { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Group, Stack } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

interface RenameFavoriteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  currentName: string;
  loading?: boolean;
}

export const RenameFavoriteModal: React.FC<RenameFavoriteModalProps> = ({
  opened,
  onClose,
  onConfirm,
  currentName,
  loading = false,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (opened) {
      setName(currentName);
    }
  }, [opened, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Rename Favorite"
      centered
      size="sm"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Favorite Name"
            placeholder="Enter favorite name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            leftSection={<IconStar size={16} />}
            autoFocus
            data-autofocus
            disabled={loading}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!name.trim()}>
              Rename
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
