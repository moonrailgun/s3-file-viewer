import React from 'react';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { ConnectionParams } from '../types';

export type ConnectFormProps = {
  conn: ConnectionParams;
  onChange: (next: ConnectionParams) => void;
  onSubmit: () => Promise<void>;
  onConnectionSuccess?: (conn: ConnectionParams) => void;
  loading: boolean;
};

/**
 * Simplified ConnectForm component for standalone connection window
 * The saved connections list has been moved to ConnectionSidebar
 */
export const ConnectForm: React.FC<ConnectFormProps> = ({
  conn,
  onChange,
  onSubmit,
  onConnectionSuccess,
  loading,
}) => {
  // Handle form submission
  const handleSubmit = async () => {
    try {
      await onSubmit();
      // Connection succeeded, save the connection
      onConnectionSuccess?.(conn);
    } catch (error) {
      // Connection failed, error will be handled by parent
      console.error('Connection failed:', error);
    }
  };

  return (
    <Stack gap="md" maw={520} mx="auto">
      <Title order={3}>Connect to S3</Title>

      {/* Connection Form */}
      <TextInput
        label="Endpoint"
        value={conn.endpoint}
        onChange={(e) => onChange({ ...conn, endpoint: e.currentTarget.value })}
        placeholder="https://s3.amazonaws.com"
        size="sm"
      />
      <Group grow>
        <TextInput
          label="Access Key"
          value={conn.access_key}
          onChange={(e) =>
            onChange({ ...conn, access_key: e.currentTarget.value })
          }
          placeholder="AKIA..."
          size="sm"
        />
        <TextInput
          label="Secret Key"
          type="password"
          value={conn.secret_key}
          onChange={(e) =>
            onChange({ ...conn, secret_key: e.currentTarget.value })
          }
          placeholder="Your secret key"
          size="sm"
        />
      </Group>
      <TextInput
        label="Region"
        value={conn.region}
        onChange={(e) => onChange({ ...conn, region: e.currentTarget.value })}
        placeholder="us-east-1"
        size="sm"
      />

      <Button onClick={handleSubmit} loading={loading} fullWidth size="sm">
        Connect
      </Button>
    </Stack>
  );
};
