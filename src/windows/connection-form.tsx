import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  MantineProvider,
  Stack,
  TextInput,
  Button,
  Group,
  Title,
  Box,
} from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import { ConnectionParams } from '../types';
import {
  saveConnection,
  loadSavedConnections,
  updateConnection,
} from '../utils/connectionManager';
// Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '../global.css';

const ConnectionFormWindow: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState<boolean | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [conn, setConn] = useState<ConnectionParams>({
    endpoint: 'https://s3.amazonaws.com',
    access_key: '',
    secret_key: '',
    region: 'us-east-1',
  });
  const [editMode, setEditMode] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  // Load connection data if editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connId = urlParams.get('connectionId');

    if (connId) {
      const connections = loadSavedConnections();
      const existingConn = connections.find((c) => c.id === connId);

      if (existingConn) {
        setEditMode(true);
        setConnectionId(connId);
        setConnectionName(existingConn.name);
        setConn({
          endpoint: existingConn.endpoint,
          access_key: existingConn.access_key,
          secret_key: existingConn.secret_key,
          region: existingConn.region,
        });
      }
    }
  }, []);

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestPassed(null);

      // Test connection without saving
      await invoke('connect', { params: conn });

      setTestPassed(true);
      notifications.show({
        message: 'Connection test succeeded!',
        color: 'green',
      });
    } catch (err: any) {
      setTestPassed(false);
      notifications.show({
        message: `Connection test failed: ${err}`,
        color: 'red',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Test connection
      await invoke('connect', { params: conn });

      let savedConnId: string;

      if (editMode && connectionId) {
        // Update existing connection
        updateConnection(connectionId, {
          ...conn,
          name: connectionName.trim() || connectionId,
        });
        savedConnId = connectionId;

        notifications.show({
          message: 'Connection updated successfully!',
          color: 'green',
        });
      } else {
        // Save new connection
        const savedConn = saveConnection(
          conn,
          connectionName.trim() || undefined
        );
        savedConnId = savedConn.id;

        notifications.show({
          message: 'Connected successfully!',
          color: 'green',
        });
      }

      // Emit event to main window
      await emit('connection-created', { connectionId: savedConnId });

      // Close window after a short delay
      setTimeout(() => {
        getCurrentWindow().close();
      }, 500);
    } catch (err: any) {
      notifications.show({
        message: `Connection failed: ${err}`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset test status when connection params change
  const updateConn = (updates: Partial<ConnectionParams>) => {
    setConn({ ...conn, ...updates });
    setTestPassed(null); // Reset test status
  };

  // Handle window close
  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <MantineProvider defaultColorScheme="auto">
      <Notifications position="top-right" />
      <Box p="md">
        <Stack gap="md">
          <Title order={4}>
            {editMode ? 'Edit S3 Connection' : 'New S3 Connection'}
          </Title>

          <TextInput
            label="Connection Name"
            value={connectionName}
            onChange={(e) => {
              setConnectionName(e.currentTarget.value);
              setTestPassed(null);
            }}
            placeholder="e.g., My S3 Storage"
            size="sm"
            description="Optional, displayed in sidebar"
            spellCheck={false}
          />

          <TextInput
            label="Endpoint"
            value={conn.endpoint}
            onChange={(e) => updateConn({ endpoint: e.currentTarget.value })}
            placeholder="https://s3.amazonaws.com"
            size="sm"
            required
            spellCheck={false}
          />

          <TextInput
            label="Access Key"
            value={conn.access_key}
            onChange={(e) => updateConn({ access_key: e.currentTarget.value })}
            placeholder="AKIA..."
            size="sm"
            required
            spellCheck={false}
          />

          <TextInput
            label="Secret Key"
            type="password"
            value={conn.secret_key}
            onChange={(e) => updateConn({ secret_key: e.currentTarget.value })}
            placeholder="Your secret key"
            size="sm"
            required
            spellCheck={false}
          />

          <TextInput
            label="Region"
            value={conn.region}
            onChange={(e) => updateConn({ region: e.currentTarget.value })}
            placeholder="us-east-1"
            size="sm"
            required
            spellCheck={false}
          />

          <Group justify="space-between" mt="md">
            <Button
              variant="light"
              onClick={handleTest}
              loading={testing}
              size="sm"
              color={
                testPassed === true
                  ? 'green'
                  : testPassed === false
                    ? 'red'
                    : 'blue'
              }
            >
              {testPassed === true
                ? '✓ Test Passed'
                : testPassed === false
                  ? '✗ Test Failed'
                  : 'Test Connection'}
            </Button>
            <Group gap="xs">
              <Button
                variant="default"
                onClick={handleClose}
                size="sm"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={loading} size="sm">
                {editMode ? 'Update & Save' : 'Connect & Save'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Box>
    </MantineProvider>
  );
};

// Mount the component
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionFormWindow />
  </React.StrictMode>
);
