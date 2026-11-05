import React, { useState, useEffect } from 'react';
import { Box, UnstyledButton, Collapse } from '@mantine/core';
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
    <Box ref={setNodeRef} style={style}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <UnstyledButton
            onClick={() => onOpen(favorite)}
            style={{ cursor: isDragging ? 'grabbing' : 'default' }}
            className={`sv-tree-item${isDragging ? ' is-dragging' : ''}`}
            title={`${favorite.bucket}/${favorite.prefix}`}
            {...attributes}
            {...listeners}
          >
            <IconStar
              size={13}
              className="sv-tree-icon"
              color="var(--mantine-color-yellow-6)"
            />
            <span className="sv-tree-label">{favorite.name}</span>
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
    <Box px={6} pb={4}>
      <UnstyledButton
        className="sv-section-head"
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '0 4px' }}
      >
        <span className="sv-section-title">Favorites</span>
        <span className="sv-count">{favorites.length}</span>
        {expanded ? (
          <IconChevronDown size={12} className="sv-tree-chevron" />
        ) : (
          <IconChevronRight size={12} className="sv-tree-chevron" />
        )}
      </UnstyledButton>

      <Collapse in={expanded}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
        </div>
      </Collapse>
    </Box>
  );
};
