import React, { useState } from 'react';
import { Modal, TextInput, Button, Group, Stack, Text } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';

interface CreateBucketModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (bucketName: string, region: string) => void;
  loading?: boolean;
  currentRegion?: string;
}

/**
 * Validate S3 bucket name according to AWS rules
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html
 */
function validateBucketName(name: string): string | null {
  // Check length
  if (name.length < 3) {
    return 'Bucket name must be at least 3 characters';
  }
  if (name.length > 63) {
    return 'Bucket name must not exceed 63 characters';
  }

  // Check if starts and ends with lowercase letter or number
  if (!/^[a-z0-9]/.test(name)) {
    return 'Bucket name must start with a lowercase letter or number';
  }
  if (!/[a-z0-9]$/.test(name)) {
    return 'Bucket name must end with a lowercase letter or number';
  }

  // Check for valid characters only (lowercase letters, numbers, dots, hyphens)
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return 'Bucket name can only contain lowercase letters, numbers, dots, and hyphens';
  }

  // Check for consecutive dots
  if (/\.\./.test(name)) {
    return 'Bucket name cannot contain two adjacent periods';
  }

  // Check if it looks like an IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return 'Bucket name cannot be formatted as an IP address';
  }

  return null;
}

export const CreateBucketModal: React.FC<CreateBucketModalProps> = ({
  opened,
  onClose,
  onConfirm,
  loading = false,
  currentRegion = 'us-east-1',
}) => {
  const [bucketName, setBucketName] = useState('');
  const [region, setRegion] = useState(currentRegion);
  const [error, setError] = useState('');

  // Update region when currentRegion prop changes (when modal opens)
  React.useEffect(() => {
    if (opened && currentRegion) {
      setRegion(currentRegion);
    }
  }, [opened, currentRegion]);

  const handleSubmit = () => {
    const trimmedName = bucketName.trim().toLowerCase();
    const trimmedRegion = region.trim();

    // Validation
    if (!trimmedName) {
      setError('Bucket name cannot be empty');
      return;
    }

    if (!trimmedRegion) {
      setError('Region cannot be empty');
      return;
    }

    const validationError = validateBucketName(trimmedName);
    if (validationError) {
      setError(validationError);
      return;
    }

    onConfirm(trimmedName, trimmedRegion);
  };

  const handleClose = () => {
    setBucketName('');
    setRegion(currentRegion);
    setError('');
    onClose();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (
      event.key === 'Enter' &&
      bucketName.trim() &&
      region.trim() &&
      !loading
    ) {
      handleSubmit();
    }
  };

  const handleBucketNameChange = (value: string) => {
    // Convert to lowercase automatically
    setBucketName(value.toLowerCase());
    setError(''); // Clear error when user types
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconDatabase size={20} color="var(--mantine-color-blue-6)" />
          <Text fw={600}>Create New Bucket</Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Bucket Name
          </Text>
          <TextInput
            placeholder="my-bucket-name"
            value={bucketName}
            onChange={(event) =>
              handleBucketNameChange(event.currentTarget.value)
            }
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
            Must be 3-63 characters, lowercase letters, numbers, dots, and
            hyphens only.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Region
          </Text>
          <TextInput
            value={region}
            onChange={(event) => setRegion(event.currentTarget.value)}
            disabled={loading}
            placeholder="us-east-1"
            styles={{
              input: {
                fontSize: '14px',
              },
            }}
          />
          <Text size="xs" c="dimmed">
            Enter the region where the bucket will be created (e.g., us-east-1,
            cn-north-1, oss-cn-hangzhou).
          </Text>
        </Stack>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconDatabase size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!bucketName.trim() || !region.trim()}
          >
            Create Bucket
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
