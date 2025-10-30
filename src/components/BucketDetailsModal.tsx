import React, { useEffect, useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  CopyButton,
  ActionIcon,
  Box,
  Tooltip,
  Loader,
  Badge,
  Alert,
  Tabs,
} from '@mantine/core';
import {
  IconCopy,
  IconCheck,
  IconDatabase,
  IconAlertCircle,
  IconInfoCircle,
  IconSettings,
} from '@tabler/icons-react';
import { invoke } from '@tauri-apps/api/core';
import { BucketInfo, BucketDetails } from '../types';

interface BucketDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  bucket: BucketInfo | null;
}

/**
 * Format ISO date string to a readable format
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return dateString;
  }
};

/**
 * Generate AWS ARN for bucket
 */
const getBucketArn = (bucketName: string): string => {
  return `arn:aws:s3:::${bucketName}`;
};

/**
 * Modal to display detailed information about a bucket
 * Shows bucket name, region, creation date, ARN, and advanced configurations
 */
export const BucketDetailsModal: React.FC<BucketDetailsModalProps> = ({
  opened,
  onClose,
  bucket,
}) => {
  const [activeTab, setActiveTab] = useState<string | null>('basic');
  const [details, setDetails] = useState<BucketDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsFetched, setDetailsFetched] = useState(false);

  // Fetch bucket details only when switching to advanced tab
  useEffect(() => {
    if (opened && bucket && activeTab === 'advanced' && !detailsFetched) {
      setLoading(true);
      setError(null);
      invoke<BucketDetails>('get_bucket_details', { bucket: bucket.name })
        .then((data) => {
          setDetails(data);
          setDetailsFetched(true);
        })
        .catch((err) => {
          console.error('Failed to fetch bucket details:', err);
          setError(String(err));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [opened, bucket, activeTab, detailsFetched]);

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setActiveTab('basic');
      setDetails(null);
      setError(null);
      setDetailsFetched(false);
    }
  }, [opened]);

  if (!bucket) return null;

  const bucketArn = getBucketArn(bucket.name);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconDatabase size={20} />
          <Text fw={600}>Bucket Details</Text>
        </Group>
      }
      size="md"
      centered
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<IconInfoCircle size={16} />}>
            Basic Info
          </Tabs.Tab>
          <Tabs.Tab value="advanced" leftSection={<IconSettings size={16} />}>
            Advanced
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <Stack gap="md">
            {/* Bucket Name */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                Bucket Name
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text
                  size="sm"
                  style={{
                    flex: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    padding: '6px 10px',
                    backgroundColor:
                      'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                    borderRadius: '4px',
                  }}
                >
                  {bucket.name}
                </Text>
                <CopyButton value={bucket.name} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? 'Copied' : 'Copy'}
                      withArrow
                      position="right"
                    >
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>

            {/* Region */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                Region
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text
                  size="sm"
                  style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    padding: '6px 10px',
                    backgroundColor:
                      'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                    borderRadius: '4px',
                  }}
                >
                  {bucket.region}
                </Text>
                <CopyButton value={bucket.region} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? 'Copied' : 'Copy'}
                      withArrow
                      position="right"
                    >
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>

            {/* Creation Date */}
            {bucket.creation_date && (
              <Box>
                <Text size="xs" c="dimmed" fw={500} mb={4}>
                  Created
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <Text
                    size="sm"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      backgroundColor:
                        'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                      borderRadius: '4px',
                    }}
                  >
                    {formatDate(bucket.creation_date)}
                  </Text>
                  <CopyButton value={bucket.creation_date} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? 'Copied' : 'Copy'}
                        withArrow
                        position="right"
                      >
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                        >
                          {copied ? (
                            <IconCheck size={16} />
                          ) : (
                            <IconCopy size={16} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </Box>
            )}

            {/* Bucket ARN */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb={4}>
                ARN (Amazon Resource Name)
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Text
                  size="sm"
                  style={{
                    flex: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    padding: '6px 10px',
                    backgroundColor:
                      'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                    borderRadius: '4px',
                  }}
                >
                  {bucketArn}
                </Text>
                <CopyButton value={bucketArn} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? 'Copied' : 'Copy'}
                      withArrow
                      position="right"
                    >
                      <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        variant="subtle"
                        onClick={copy}
                      >
                        {copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="advanced" pt="md">
          {loading && (
            <Group gap="xs">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Loading configuration...
              </Text>
            </Group>
          )}

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error"
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          {details && !loading && !error && (
            <Stack gap="sm">
              {/* Versioning */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Versioning
                </Text>
                <Badge
                  color={details.versioning_enabled ? 'green' : 'gray'}
                  variant="light"
                >
                  {details.versioning_enabled ? 'Enabled' : 'Suspended'}
                </Badge>
              </Group>

              {/* Encryption */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Encryption
                </Text>
                <Badge
                  color={details.encryption_enabled ? 'green' : 'gray'}
                  variant="light"
                >
                  {details.encryption_enabled
                    ? details.encryption_type || 'Enabled'
                    : 'Disabled'}
                </Badge>
              </Group>

              {/* Public Access Block */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Block Public Access
                </Text>
                <Badge
                  color={
                    details.block_public_acls &&
                    details.block_public_policy &&
                    details.ignore_public_acls &&
                    details.restrict_public_buckets
                      ? 'green'
                      : 'orange'
                  }
                  variant="light"
                >
                  {details.block_public_acls &&
                  details.block_public_policy &&
                  details.ignore_public_acls &&
                  details.restrict_public_buckets
                    ? 'All Blocked'
                    : 'Partially Configured'}
                </Badge>
              </Group>

              {/* Lifecycle Rules */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Lifecycle Rules
                </Text>
                <Badge
                  color={details.lifecycle_rules_count > 0 ? 'blue' : 'gray'}
                  variant="light"
                >
                  {details.lifecycle_rules_count}{' '}
                  {details.lifecycle_rules_count === 1 ? 'Rule' : 'Rules'}
                </Badge>
              </Group>

              {/* Tags */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Tags
                </Text>
                <Badge
                  color={details.tags_count > 0 ? 'blue' : 'gray'}
                  variant="light"
                >
                  {details.tags_count}{' '}
                  {details.tags_count === 1 ? 'Tag' : 'Tags'}
                </Badge>
              </Group>

              {/* CORS */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  CORS
                </Text>
                <Badge
                  color={details.cors_enabled ? 'green' : 'gray'}
                  variant="light"
                >
                  {details.cors_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </Group>

              {/* Logging */}
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Server Access Logging
                </Text>
                <Badge
                  color={details.logging_enabled ? 'green' : 'gray'}
                  variant="light"
                >
                  {details.logging_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </Group>

              {details.logging_enabled && details.logging_target_bucket && (
                <Box>
                  <Text size="xs" c="dimmed" mb={4}>
                    Logging Target Bucket
                  </Text>
                  <Text
                    size="sm"
                    style={{
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      backgroundColor:
                        'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                      borderRadius: '4px',
                    }}
                  >
                    {details.logging_target_bucket}
                  </Text>
                </Box>
              )}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};
