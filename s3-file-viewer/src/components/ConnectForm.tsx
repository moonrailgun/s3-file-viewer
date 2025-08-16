import React from 'react';
import { Button, Group, Stack, TextInput, Title } from '@mantine/core';
import { ConnectionParams } from '../types';

export type ConnectFormProps = {
  conn: ConnectionParams;
  onChange: (next: ConnectionParams) => void;
  onSubmit: () => void;
  loading: boolean;
};

export const ConnectForm: React.FC<ConnectFormProps> = ({
  conn,
  onChange,
  onSubmit,
  loading,
}) => {
  return (
    <Stack gap="md" maw={520} mx="auto">
      <Title order={3}>Connect to S3</Title>
      <TextInput
        label="Endpoint"
        value={conn.endpoint}
        onChange={(e) => onChange({ ...conn, endpoint: e.currentTarget.value })}
      />
      <Group grow>
        <TextInput
          label="Access Key"
          value={conn.access_key}
          onChange={(e) =>
            onChange({ ...conn, access_key: e.currentTarget.value })
          }
        />
        <TextInput
          label="Secret Key"
          type="password"
          value={conn.secret_key}
          onChange={(e) =>
            onChange({ ...conn, secret_key: e.currentTarget.value })
          }
        />
      </Group>
      <TextInput
        label="Region"
        value={conn.region}
        onChange={(e) => onChange({ ...conn, region: e.currentTarget.value })}
      />
      <Button onClick={onSubmit} loading={loading}>
        Connect
      </Button>
    </Stack>
  );
};
