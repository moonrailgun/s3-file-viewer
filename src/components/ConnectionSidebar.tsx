import React, { useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Text,
  UnstyledButton,
  Loader,
  Button,
  Collapse,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconDatabase,
  IconChevronRight,
  IconChevronDown,
  IconPlus,
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
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
            className={`sv-tree-item${active ? ' is-active' : ''}${isDragging ? ' is-dragging' : ''}`}
            {...attributes}
            {...listeners}
          >
            {expanded ? (
              <IconChevronDown size={12} className="sv-tree-chevron" />
            ) : (
              <IconChevronRight size={12} className="sv-tree-chevron" />
            )}
            <span className={`sv-dot${active ? ' is-on' : ''}`} />
            <span className="sv-tree-label">{conn.name}</span>
            {loading && <Loader size={10} />}
            {conn.region && <span className="sv-region">{conn.region}</span>}
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
        <div className="sv-tree-children">
          {loading ? (
            <div className="sv-tree-hint">
              <Loader size={10} />
              Loading...
            </div>
          ) : buckets.length === 0 ? (
            <div className="sv-tree-hint">
              {active ? 'No buckets' : 'Click to connect'}
            </div>
          ) : (
            buckets.map((bucket) => {
              const isSelected = selectedBucket === bucket.name && active;
              return (
                <ContextMenu key={bucket.name}>
                  <ContextMenuTrigger asChild>
                    <UnstyledButton
                      onClick={() => onSelectBucket(conn.id, bucket.name)}
                      className={`sv-tree-item${isSelected ? ' is-selected' : ''}`}
                    >
                      <IconDatabase size={13} className="sv-tree-icon" />
                      <span className="sv-tree-label">{bucket.name}</span>
                      {bucket.region && bucket.region !== conn.region && (
                        <span className="sv-region">{bucket.region}</span>
                      )}
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
        </div>
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
      className="sv-sidebar"
      style={{
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Mobile close button */}
      {isMobile && onCloseMobile && (
        <Box px={6} pt={6} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={onCloseMobile}
            title="Close Sidebar"
          >
            <IconX size={16} />
          </ActionIcon>
        </Box>
      )}

      {/* Favorites Section */}
      <FavoritesSection
        onOpenFavorite={onOpenFavorite}
        onRenameFavorite={onRenameFavorite}
        onDeleteFavorite={onDeleteFavorite}
      />

      <div className="sv-section-head">
        <span className="sv-section-title">Connections</span>
        <Tooltip label="New Connection" withArrow>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            onClick={onCreateConnection}
            aria-label="New Connection"
          >
            <IconPlus size={13} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Connections list */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Box
            style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
            }}
            px={6}
            pb={6}
          >
            {savedConnections.length === 0 ? (
              <Stack align="center" gap={8} mt="md">
                <Text size="xs" c="dimmed">
                  No saved connections
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={onCreateConnection}
                >
                  New Connection
                </Button>
              </Stack>
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
                  <Stack gap={1}>
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
