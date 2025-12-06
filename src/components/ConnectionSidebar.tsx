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
  ActionIcon,
  Badge,
} from '@mantine/core';
import {
  IconServer,
  IconDatabase,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
  IconPlugConnected,
  IconX,
} from '@tabler/icons-react';
import { RefreshCw, Trash2, Plus, Edit, Database, Info } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { SavedConnection, BucketInfo, Favorite } from '../types';
import {
  loadSavedConnections,
  reorderConnections,
} from '../utils/connectionManager';
import { FavoritesSection } from './FavoritesSection';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Generate a consistent color based on region string
const getRegionColor = (region: string): string => {
  const colors = [
    'blue',
    'cyan',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
    'red',
    'pink',
    'grape',
    'violet',
    'indigo',
  ];

  // Simple hash function for string
  let hash = 0;
  for (let i = 0; i < region.length; i++) {
    hash = region.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Map hash to color index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Draggable Connection Item Component
type DraggableConnectionItemProps = {
  conn: SavedConnection;
  expanded: boolean;
  active: boolean;
  loading: boolean;
  buckets: BucketInfo[];
  selectedBucket: string | null;
  onToggleExpanded: (connectionId: string) => void;
  onRefreshBuckets: (connectionId: string) => void;
  onCreateBucket: (connectionId: string) => void;
  onEditConnection: (connectionId: string) => void;
  onDeleteConnectionRequest: (
    connectionId: string,
    connectionName: string,
    event: React.MouseEvent
  ) => void;
  onSelectBucket: (connectionId: string, bucketName: string) => void;
  onShowBucketDetails: (bucket: BucketInfo) => void;
};

const DraggableConnectionItem: React.FC<DraggableConnectionItemProps> = ({
  conn,
  expanded,
  active,
  loading,
  buckets,
  selectedBucket,
  onToggleExpanded,
  onRefreshBuckets,
  onCreateBucket,
  onEditConnection,
  onDeleteConnectionRequest,
  onSelectBucket,
  onShowBucketDetails,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conn.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box key={conn.id} ref={setNodeRef} style={style}>
      {/* Connection item */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <UnstyledButton
            onClick={() => onToggleExpanded(conn.id)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '4px',
              border: active ? undefined : '1px solid transparent',
              cursor: isDragging ? 'grabbing' : 'default',
            }}
            className={`connection-sidebar-item ${active ? 'connection-active' : ''} ${isDragging ? 'connection-dragging' : ''}`}
            {...attributes}
            {...listeners}
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
                  <IconServer size={14} color="var(--mantine-color-gray-6)" />
                )}
              </Box>
              <Text
                size="xs"
                fw={500}
                truncate
                style={{ flex: 1, minWidth: 0 }}
              >
                {conn.name}
              </Text>
              {loading && <Loader size={12} />}
              {conn.region && (
                <Badge
                  size="xs"
                  variant="light"
                  color="gray"
                  style={{ flexShrink: 0 }}
                >
                  {conn.region}
                </Badge>
              )}
            </Group>
          </UnstyledButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            disabled={!active}
            onClick={(e) => {
              e.stopPropagation();
              onRefreshBuckets(conn.id);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Buckets
          </ContextMenuItem>
          <ContextMenuItem
            disabled={!active}
            onClick={(e) => {
              e.stopPropagation();
              onCreateBucket(conn.id);
            }}
          >
            <Database className="mr-2 h-4 w-4" />
            Create Bucket
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEditConnection(conn.id);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Connection
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={(e) => {
              onDeleteConnectionRequest(conn.id, conn.name, e);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Connection
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

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
              const isSelected = selectedBucket === bucket.name && active;
              return (
                <ContextMenu key={bucket.name}>
                  <ContextMenuTrigger asChild>
                    <UnstyledButton
                      onClick={() => onSelectBucket(conn.id, bucket.name)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                      className={`connection-sidebar-item ${isSelected ? 'bucket-selected' : ''}`}
                    >
                      <Group gap={6} wrap="nowrap">
                        <IconDatabase
                          className="shrink-0"
                          size={12}
                          color="var(--mantine-color-blue-6)"
                        />
                        <Text
                          size="xs"
                          truncate
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          {bucket.name}
                        </Text>
                        {bucket.region && (
                          <Badge
                            size="xs"
                            color={getRegionColor(bucket.region)}
                            style={{ flexShrink: 0 }}
                          >
                            {bucket.region}
                          </Badge>
                        )}
                      </Group>
                    </UnstyledButton>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowBucketDetails(bucket);
                      }}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Bucket Details
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })
          )}
        </Stack>
      </Collapse>
    </Box>
  );
};

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
  onCreateBucket: (connectionId: string) => void;
  onEditConnection: (connectionId: string) => void;
  onRequestDeleteConnection: (
    connectionId: string,
    connectionName: string
  ) => void;
  onShowBucketDetails: (bucket: BucketInfo) => void;
  // Favorites
  onOpenFavorite: (favorite: Favorite) => void;
  onRenameFavorite: (favorite: Favorite) => void;
  onDeleteFavorite: (favoriteId: string, favoriteName: string) => void;
  // Mobile support
  onCloseMobile?: () => void;
  isMobile?: boolean;
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
  onCreateBucket,
  onEditConnection,
  onRequestDeleteConnection,
  onShowBucketDetails,
  onOpenFavorite,
  onRenameFavorite,
  onDeleteFavorite,
  onCloseMobile,
  isMobile = false,
}) => {
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>(
    []
  );
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(
    new Set()
  );

  // Setup sensors for drag and drop
  // Add activation constraint to distinguish between click and drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to activate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

    // Listen for connection-created event from connection form window
    const unlistenConnectionCreated = listen('connection-created', () => {
      // Reload connections when a new connection is created
      loadConnections();
    });

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unlistenConnectionCreated.then((fn) => fn());
    };
  }, []);

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSavedConnections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        // Persist the new order to localStorage
        reorderConnections(newOrder);
        return newOrder;
      });
    }
  };

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

  const handleDeleteConnectionRequest = (
    connectionId: string,
    connectionName: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    onRequestDeleteConnection(connectionId, connectionName);
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
        <Group gap="xs">
          <Button
            style={{ flex: 1 }}
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={onCreateConnection}
          >
            New Connection
          </Button>
          {/* Mobile close button */}
          {isMobile && onCloseMobile && (
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={onCloseMobile}
              title="Close Sidebar"
            >
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* Favorites Section */}
      <FavoritesSection
        onOpenFavorite={onOpenFavorite}
        onRenameFavorite={onRenameFavorite}
        onDeleteFavorite={onDeleteFavorite}
      />

      {/* Connections list */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Box
            style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
            }}
            p={4}
          >
            {savedConnections.length === 0 ? (
              <Text size="xs" c="dimmed" ta="center" mt="md">
                No saved connections
              </Text>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={savedConnections.map((conn) => conn.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack gap={2}>
                    {savedConnections.map((conn) => {
                      const expanded = isExpanded(conn.id);
                      const active = isActive(conn.id);
                      const loading = isLoading(conn.id);
                      const buckets = getBuckets(conn.id);

                      return (
                        <DraggableConnectionItem
                          key={conn.id}
                          conn={conn}
                          expanded={expanded}
                          active={active}
                          loading={loading}
                          buckets={buckets}
                          selectedBucket={selectedBucket}
                          onToggleExpanded={toggleExpanded}
                          onRefreshBuckets={onRefreshBuckets}
                          onCreateBucket={onCreateBucket}
                          onEditConnection={onEditConnection}
                          onDeleteConnectionRequest={
                            handleDeleteConnectionRequest
                          }
                          onSelectBucket={onSelectBucket}
                          onShowBucketDetails={onShowBucketDetails}
                        />
                      );
                    })}
                  </Stack>
                </SortableContext>
              </DndContext>
            )}
          </Box>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              const connections = loadSavedConnections();
              setSavedConnections(connections);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Connections
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onCreateConnection();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Connection
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Stack>
  );
};
