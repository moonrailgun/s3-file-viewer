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
  IconEdit,
} from '@tabler/icons-react';
import { ConnectionParams, SavedConnection } from '../types';
import {
  loadSavedConnections,
  removeSavedConnection,
  toConnectionParams,
} from '../utils/connectionManager';

export type ConnectFormProps = {
  conn: ConnectionParams;
  onChange: (next: ConnectionParams) => void;
  onSubmit: () => Promise<void>;
  onConnectionSuccess?: (conn: ConnectionParams) => void; // Callback when connection succeeds
  loading: boolean;
};

export const ConnectForm: React.FC<ConnectFormProps> = ({
  conn,
  onChange,
  onSubmit,
  onConnectionSuccess,
  loading,
}) => {
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(
    []
  );
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(
    null
  );

  // Load saved connections on component mount
  useEffect(() => {
    setSavedConnections(loadSavedConnections());
  }, []);

  // Handle selecting and connecting to a saved connection
  const handleSelectAndConnect = async (savedConn: SavedConnection) => {
    setSelectedConnectionId(savedConn.id);
    setConnectingId(savedConn.id);
    const connParams = toConnectionParams(savedConn);
    onChange(connParams);

    // Trigger connection immediately
    try {
      await onSubmit();
      // Connection succeeded, save the connection (update last_used)
      onConnectionSuccess?.(connParams);
      setSavedConnections(loadSavedConnections());
    } catch (error) {
      // Connection failed, don't save anything
      console.error('Connection failed:', error);
    }
  };

  // Reset connecting state when loading changes
  useEffect(() => {
    if (!loading) {
      setConnectingId(null);
    }
  }, [loading]);

  // Handle editing a saved connection
  const handleEditConnection = (
    savedConn: SavedConnection,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent triggering the connection selection
    setEditingConnectionId(savedConn.id);
    const connParams = toConnectionParams(savedConn);
    onChange(connParams);
    setSelectedConnectionId(savedConn.id);
  };

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
    if (editingConnectionId === connectionId) {
      setEditingConnectionId(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      await onSubmit();
      // Connection succeeded, save the connection
      onConnectionSuccess?.(conn);
      setSavedConnections(loadSavedConnections());
      // Clear editing state after successful connection
      setEditingConnectionId(null);
    } catch (error) {
      // Connection failed, don't save anything
      console.error('Connection failed:', error);
    }
  };

  // Format last used time
  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) {
      return 'Never used';
    }
    const date = new Date(lastUsed);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString('en-US');
  };

  return (
    <Stack gap="md" maw={520} mx="auto">
      <Title order={3}>Connect to S3</Title>

      {/* Saved Connections Section */}
      {savedConnections.length > 0 && (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" align="center" mb="sm">
            <Text size="sm" fw={500}>
              Saved Connections
            </Text>
            <Text size="xs" c="dimmed">
              Click to connect • Edit to modify
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
                    backgroundColor:
                      editingConnectionId === savedConn.id
                        ? 'var(--mantine-color-yellow-1)'
                        : 'var(--mantine-primary-color-light)',
                    outline: 0,
                    transition: 'all 0.2s ease',
                    width: '100%',
                    opacity: connectingId === savedConn.id ? 0.7 : 1,
                    border:
                      editingConnectionId === savedConn.id
                        ? '2px solid var(--mantine-color-yellow-6)'
                        : '2px solid transparent',
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" align="center" mb={4}>
                        <IconServer size={14} />
                        <Text size="sm" fw={500} truncate>
                          {savedConn.name}
                        </Text>
                        {editingConnectionId === savedConn.id && (
                          <Text size="xs" c="yellow.6" fw={600}>
                            (Editing)
                          </Text>
                        )}
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
                      <Group gap={2} style={{ flexShrink: 0 }}>
                        <ActionIcon
                          size="sm"
                          color="blue"
                          variant="subtle"
                          onClick={(e) => handleEditConnection(savedConn, e)}
                          title="Edit connection"
                        >
                          <IconEdit size={12} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="subtle"
                          onClick={(e) =>
                            handleRemoveConnection(savedConn.id, e)
                          }
                          title="Delete connection"
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Group>
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
