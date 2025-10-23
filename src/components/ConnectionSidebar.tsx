import React, { useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Group,
  Text,
  UnstyledButton,
  Loader,
  Button,
  Collapse,
  Menu,
} from '@mantine/core';
import {
  IconServer,
  IconDatabase,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconPlugConnected,
} from '@tabler/icons-react';
import { SavedConnection, BucketInfo } from '../types';
import {
  loadSavedConnections,
  removeSavedConnection,
} from '../utils/connectionManager';

export type ConnectionSidebarProps = {
  // Current active connection ID
  activeConnectionId: string | null;
  // Current selected bucket
  selectedBucket: string | null;
  // Map of connection ID to its buckets
  connectionBuckets: Map<string, BucketInfo[]>;
  // Map of connection ID to loading state
  connectionLoading: Map<string, boolean>;
  // Callbacks
  onCreateConnection: () => void;
  onSelectConnection: (connectionId: string) => void;
  onSelectBucket: (connectionId: string, bucketName: string) => void;
  onRefreshBuckets: (connectionId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
};

export const ConnectionSidebar: React.FC<ConnectionSidebarProps> = ({
  activeConnectionId,
  selectedBucket,
  connectionBuckets,
  connectionLoading,
  onCreateConnection,
  onSelectConnection,
  onSelectBucket,
  onRefreshBuckets,
  onDeleteConnection,
}) => {
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(
    []
  );
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );
  const [contextMenuOpened, setContextMenuOpened] = useState<string | null>(
    null
  );

  // Load saved connections
  useEffect(() => {
    const loadConnections = () => {
      const connections = loadSavedConnections();
      setSavedConnections(connections);
    };

    loadConnections();

    // Listen for storage changes from other windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 's3-file-viewer-connections') {
        loadConnections();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-collapse inactive connections when active connection changes
  useEffect(() => {
    if (activeConnectionId) {
      setExpandedConnections((prev) => {
        const newSet = new Set(prev);
        // Remove all expanded connections except the active one
        Array.from(newSet).forEach((connId) => {
          if (connId !== activeConnectionId) {
            newSet.delete(connId);
          }
        });
        // Ensure active connection is expanded
        newSet.add(activeConnectionId);
        return newSet;
      });
    }
  }, [activeConnectionId]);

  const toggleExpanded = (connectionId: string) => {
    setExpandedConnections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
        // Load buckets when expanding
        onSelectConnection(connectionId);
      }
      return newSet;
    });
  };

  const handleDeleteConnection = (
    connectionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    removeSavedConnection(connectionId);
    setSavedConnections(loadSavedConnections());
    onDeleteConnection(connectionId);
  };

  const isExpanded = (connectionId: string) =>
    expandedConnections.has(connectionId);
  const isActive = (connectionId: string) =>
    activeConnectionId === connectionId;
  const isLoading = (connectionId: string) =>
    connectionLoading.get(connectionId) || false;
  const getBuckets = (connectionId: string) =>
    connectionBuckets.get(connectionId) || [];

  return (
    <Stack
      gap={0}
      h="100%"
      style={{
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Header with New Connection button */}
      <Box
        p="xs"
        style={{
          borderBottom:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      >
        <Button
          fullWidth
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={onCreateConnection}
        >
          New Connection
        </Button>
      </Box>

      {/* Connections list */}
      <Box style={{ flex: 1, overflow: 'auto' }} p={4}>
        {savedConnections.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" mt="md">
            No saved connections
          </Text>
        ) : (
          <Stack gap={2}>
            {savedConnections.map((conn) => {
              const expanded = isExpanded(conn.id);
              const active = isActive(conn.id);
              const loading = isLoading(conn.id);
              const buckets = getBuckets(conn.id);

              return (
                <Box key={conn.id}>
                  {/* Connection item */}
                  <Menu
                    position="right-start"
                    withArrow
                    opened={contextMenuOpened === conn.id}
                    onChange={(opened) => {
                      if (!opened) setContextMenuOpened(null);
                    }}
                  >
                    <Menu.Target>
                      <UnstyledButton
                        onClick={() => toggleExpanded(conn.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuOpened(conn.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: active
                            ? 'light-dark(var(--mantine-color-blue-1), var(--mantine-color-dark-5))'
                            : 'transparent',
                          border: active
                            ? '1px solid light-dark(var(--mantine-color-blue-3), var(--mantine-color-blue-7))'
                            : '1px solid transparent',
                        }}
                        className="connection-sidebar-item"
                      >
                        <Group gap={6} wrap="nowrap">
                          <Box style={{ width: 14, flexShrink: 0 }}>
                            {expanded ? (
                              <IconChevronDown size={14} />
                            ) : (
                              <IconChevronRight size={14} />
                            )}
                          </Box>
                          <Box style={{ width: 14, flexShrink: 0 }}>
                            {active ? (
                              <IconPlugConnected
                                size={14}
                                color="var(--mantine-color-green-6)"
                              />
                            ) : (
                              <IconServer
                                size={14}
                                color="var(--mantine-color-gray-6)"
                              />
                            )}
                          </Box>
                          <Text size="xs" fw={500} truncate style={{ flex: 1 }}>
                            {conn.name}
                          </Text>
                          {loading && <Loader size={12} />}
                        </Group>
                      </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconRefresh size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRefreshBuckets(conn.id);
                          setContextMenuOpened(null);
                        }}
                        disabled={!active}
                      >
                        Refresh Buckets
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={(e) => {
                          handleDeleteConnection(conn.id, e);
                          setContextMenuOpened(null);
                        }}
                      >
                        Delete Connection
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  {/* Buckets list */}
                  <Collapse in={expanded}>
                    <Stack gap={2} ml={14} mt={2}>
                      {loading ? (
                        <Group gap={6} p="4px 8px">
                          <Loader size={12} />
                          <Text size="xs" c="dimmed">
                            Loading...
                          </Text>
                        </Group>
                      ) : buckets.length === 0 ? (
                        <Text size="xs" c="dimmed" p="4px 8px">
                          {active ? 'No buckets' : 'Click to connect'}
                        </Text>
                      ) : (
                        buckets.map((bucket) => {
                          const isSelected =
                            selectedBucket === bucket.name && active;
                          return (
                            <UnstyledButton
                              key={bucket.name}
                              onClick={() =>
                                onSelectBucket(conn.id, bucket.name)
                              }
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: isSelected
                                  ? 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))'
                                  : 'transparent',
                              }}
                              className="connection-sidebar-item"
                            >
                              <Group gap={6} wrap="nowrap">
                                <IconDatabase
                                  className="shrink-0"
                                  size={12}
                                  color="var(--mantine-color-blue-6)"
                                />
                                <Text size="xs" truncate>
                                  {bucket.name}
                                </Text>
                              </Group>
                            </UnstyledButton>
                          );
                        })
                      )}
                    </Stack>
                  </Collapse>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};
