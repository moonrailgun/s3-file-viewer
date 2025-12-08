import React, { useState, useEffect } from 'react';
import {
  Stack,
  Box,
  Group,
  Text,
  UnstyledButton,
  Collapse,
  Badge,
  Divider,
} from '@mantine/core';
import {
  IconStar,
  IconChevronRight,
  IconChevronDown,
} from '@tabler/icons-react';
import { Edit, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { Favorite } from '../types';
import { loadFavorites, reorderFavorites } from '../utils/favoriteManager';
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

// Draggable Favorite Item Component
type DraggableFavoriteItemProps = {
  favorite: Favorite;
  onOpen: (favorite: Favorite) => void;
  onRename: (favorite: Favorite) => void;
  onDelete: (favoriteId: string, favoriteName: string) => void;
};

const DraggableFavoriteItem: React.FC<DraggableFavoriteItemProps> = ({
  favorite,
  onOpen,
  onRename,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} className="pl-8">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <UnstyledButton
            onClick={() => onOpen(favorite)}
            style={{
              width: '100%',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: isDragging ? 'grabbing' : 'pointer',
            }}
            className="connection-sidebar-item border border-red-400"
            {...attributes}
            {...listeners}
          >
            <Group gap={6} wrap="nowrap">
              <Text
                size="xs"
                truncate
                style={{ flex: 1, minWidth: 0 }}
                fw={500}
              >
                {favorite.name}
              </Text>
            </Group>
          </UnstyledButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename(favorite);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(favorite.id, favorite.name);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Favorite
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Box>
  );
};

export type FavoritesSectionProps = {
  onOpenFavorite: (favorite: Favorite) => void;
  onRenameFavorite: (favorite: Favorite) => void;
  onDeleteFavorite: (favoriteId: string, favoriteName: string) => void;
};

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  onOpenFavorite,
  onRenameFavorite,
  onDeleteFavorite,
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [expanded, setExpanded] = useState(true);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load favorites on mount
  useEffect(() => {
    const loadedFavorites = loadFavorites();
    setFavorites(loadedFavorites);
  }, []);

  // Listen for storage changes from other windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 's3-file-viewer-favorites') {
        const loadedFavorites = loadFavorites();
        setFavorites(loadedFavorites);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFavorites((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        reorderFavorites(newOrder);
        return newOrder;
      });
    }
  };

  // Refresh favorites function for external use
  const refreshFavorites = () => {
    const loadedFavorites = loadFavorites();
    setFavorites(loadedFavorites);
  };

  // Expose refresh function to parent via a custom event
  useEffect(() => {
    const handleRefreshEvent = () => {
      refreshFavorites();
    };

    window.addEventListener('refresh-favorites', handleRefreshEvent);
    return () =>
      window.removeEventListener('refresh-favorites', handleRefreshEvent);
  }, []);

  if (favorites.length === 0) {
    return null;
  }

  return (
    <>
      <Box p={4}>
        <UnstyledButton
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%',
            padding: '4px 8px',
            borderRadius: '4px',
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
            <IconStar
              size={14}
              color="var(--mantine-color-yellow-6)"
              style={{ flexShrink: 0 }}
            />
            <Text size="xs" fw={500} style={{ flex: 1 }}>
              Favorites
            </Text>
            <Badge size="xs" variant="light" color="yellow">
              {favorites.length}
            </Badge>
          </Group>
        </UnstyledButton>

        <Collapse in={expanded}>
          <Stack gap={2} mt={4}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={favorites.map((fav) => fav.id)}
                strategy={verticalListSortingStrategy}
              >
                {favorites.map((favorite) => (
                  <DraggableFavoriteItem
                    key={favorite.id}
                    favorite={favorite}
                    onOpen={onOpenFavorite}
                    onRename={onRenameFavorite}
                    onDelete={onDeleteFavorite}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Stack>
        </Collapse>
      </Box>

      <Divider
        style={{
          borderColor:
            'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        }}
      />
    </>
  );
};
