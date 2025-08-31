import React from 'react';
import {
  AppShell,
  Container,
  Group,
  Title,
  Select,
  SegmentedControl,
  ActionIcon,
} from '@mantine/core';
import { IconRefresh, IconLogout } from '@tabler/icons-react';
import { BucketInfo } from '../types';

export type HeaderBarProps = {
  connected: boolean;
  buckets: BucketInfo[];
  bucket: string | null;
  onSelectBucket: (v: string | null) => void;
  view: string;
  onChangeView: (v: string) => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  loading: boolean;
};

export const HeaderBar: React.FC<HeaderBarProps> = ({
  connected,
  buckets,
  bucket,
  onSelectBucket,
  view,
  onChangeView,
  onRefresh,
  onDisconnect,
  loading,
}) => {
  return (
    <AppShell.Header>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between">
          <Group>
            <Title order={4}>S3 File Viewer</Title>
            {connected && (
              <Select
                searchable={true}
                data={buckets.map((b) => ({
                  value: b.name,
                  label: `${b.name} (${b.region})`,
                }))}
                value={bucket}
                onChange={onSelectBucket}
                placeholder="Select bucket"
              />
            )}
          </Group>
          {connected && (
            <Group>
              <SegmentedControl
                value={view}
                onChange={onChangeView}
                data={[
                  { label: 'List', value: 'list' },
                  { label: 'Thumbs', value: 'thumb' },
                ]}
              />
              <ActionIcon variant="light" onClick={onRefresh} disabled={loading}>
                <IconRefresh size={18} />
              </ActionIcon>
              <ActionIcon variant="light" color="red" onClick={onDisconnect}>
                <IconLogout size={18} />
              </ActionIcon>
            </Group>
          )}
        </Group>
      </Container>
    </AppShell.Header>
  );
};
