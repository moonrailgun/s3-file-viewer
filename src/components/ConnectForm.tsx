import React, { useState, useEffect } from 'react';
import {
  Button,
  Group,
  Stack,
  TextInput,
  Title,
  ActionIcon,
  Text,
  Card,
  Divider,
  ScrollArea,
  UnstyledButton,
  Box,
  Loader,
} from '@mantine/core';
import {
  IconTrash,
  IconServer,
  IconClock,
} from '@tabler/icons-react';
import { ConnectionParams, SavedConnection } from '../types';
import {
  loadSavedConnections,
  saveConnection,
  removeSavedConnection,
  toConnectionParams,
} from '../utils/connectionManager';

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
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(
    []
  );
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Load saved connections on component mount
  useEffect(() => {
    setSavedConnections(loadSavedConnections());
  }, []);

  // Handle selecting and connecting to a saved connection
  const handleSelectAndConnect = (savedConn: SavedConnection) => {
    setSelectedConnectionId(savedConn.id);
    setConnectingId(savedConn.id);
    onChange(toConnectionParams(savedConn));
    // Trigger connection immediately
    setTimeout(() => {
      onSubmit();
    }, 100); // Small delay to ensure state is updated
  };

  // Reset connecting state when loading changes
  useEffect(() => {
    if (!loading) {
      setConnectingId(null);
    }
  }, [loading]);

  // Handle removing a saved connection
  const handleRemoveConnection = (
    connectionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the connection selection
    removeSavedConnection(connectionId);
    setSavedConnections(loadSavedConnections());
    if (selectedConnectionId === connectionId) {
      setSelectedConnectionId(null);
    }
  };

  // Handle form submission with auto-save
  const handleSubmit = () => {
    onSubmit();
    // Auto-save connection on submit
    saveConnection(conn);
    setSavedConnections(loadSavedConnections());
  };

  // Format last used time
  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return '从未使用';
    const date = new Date(lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Stack gap="md" maw={520} mx="auto">
      <Title order={3}>Connect to S3</Title>

      {/* Saved Connections Section */}
      {savedConnections.length > 0 && (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" align="center" mb="sm">
            <Text size="sm" fw={500}>
              保存的连接
            </Text>
            <Text size="xs" c="dimmed">
              单击直接连接
            </Text>
          </Group>

          <ScrollArea.Autosize mah={200}>
            <Stack gap="xs">
              {savedConnections.map((savedConn) => (
                <UnstyledButton
                  key={savedConn.id}
                  onClick={() => handleSelectAndConnect(savedConn)}
                  disabled={connectingId === savedConn.id}
                  className={`connection-item ${selectedConnectionId === savedConn.id ? 'selected' : ''}`}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--mantine-primary-color-light)',
                    outline: 0,
                    transition: 'all 0.2s ease',
                    width: '100%',
                    opacity: connectingId === savedConn.id ? 0.7 : 1,
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" align="center" mb={4}>
                        <IconServer size={14} />
                        <Text size="sm" fw={500} truncate>
                          {savedConn.name}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" truncate>
                        {savedConn.endpoint}
                      </Text>
                      <Group gap="xs" align="center" mt={4}>
                        <IconClock size={12} />
                        <Text size="xs" c="dimmed">
                          {formatLastUsed(savedConn.last_used)}
                        </Text>
                      </Group>
                    </Box>
                    {connectingId === savedConn.id ? (
                      <Loader size="sm" />
                    ) : (
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        onClick={(e) => handleRemoveConnection(savedConn.id, e)}
                        style={{ flexShrink: 0 }}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Card>
      )}

      <Divider />

      {/* Connection Form */}
      <TextInput
        label="Endpoint"
        value={conn.endpoint}
        onChange={(e) => onChange({ ...conn, endpoint: e.currentTarget.value })}
        placeholder="https://s3.amazonaws.com"
      />
      <Group grow>
        <TextInput
          label="Access Key"
          value={conn.access_key}
          onChange={(e) =>
            onChange({ ...conn, access_key: e.currentTarget.value })
          }
          placeholder="AKIA..."
        />
        <TextInput
          label="Secret Key"
          type="password"
          value={conn.secret_key}
          onChange={(e) =>
            onChange({ ...conn, secret_key: e.currentTarget.value })
          }
          placeholder="Your secret key"
        />
      </Group>
      <TextInput
        label="Region"
        value={conn.region}
        onChange={(e) => onChange({ ...conn, region: e.currentTarget.value })}
        placeholder="us-east-1"
      />

      <Button onClick={handleSubmit} loading={loading} fullWidth>
        Connect
      </Button>
    </Stack>
  );
};
