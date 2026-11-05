import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ActionIcon,
  SegmentedControl,
  Collapse,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconRefresh,
  IconFolderPlus,
  IconUpload,
  IconLayoutList,
  IconLayoutGrid,
  IconMenu2,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconCopy,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { CreateFolderModal } from './CreateFolderModal';
import { SearchBar } from './SearchBar';
import { SearchMode } from '../types';
import { useGlobalHotkeys, getHotkeyDisplay } from '../hooks/useGlobalHotkeys';

export type CompactToolbarProps = {
  // Current location, rendered as an s3:// path bar
  bucket: string;
  prefix: string;
  // Navigate to a prefix in the current bucket ('' = bucket root)
  onNavigate: (prefix: string) => void;
  // View mode
  view: string;
  onChangeView: (view: string) => void;
  // Actions
  onRefresh: () => void;
  onCreateFolder: (name: string) => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
  // Loading state
  loading?: boolean;
  // Whether a bucket is selected
  hasBucket: boolean;
  // Mobile navigation
  onToggleNavbar?: () => void;
  isMobile?: boolean;
  // Search
  searchQuery?: string;
  searchMode?: SearchMode;
  isSearching?: boolean;
  onSearch?: (query: string, mode: SearchMode) => void;
  onClearSearch?: () => void;
  // Favorites
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
};

const CompactToolbarComponent: React.FC<CompactToolbarProps> = ({
  bucket,
  prefix,
  onNavigate,
  view,
  onChangeView,
  onRefresh,
  onCreateFolder,
  onUpload,
  loading = false,
  hasBucket,
  onToggleNavbar,
  isMobile = false,
  searchQuery = '',
  searchMode = 'fuzzy',
  isSearching = false,
  onSearch,
  onClearSearch,
  isFavorited = false,
  onToggleFavorite,
}) => {
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  // On mobile the search field lives in a collapsible row below the toolbar
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathScrollRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(() => prefix.split('/').filter(Boolean), [prefix]);

  // Keep the deepest segment in view when the path overflows, including
  // when the bar narrows (inspector opening, window resize)
  useEffect(() => {
    const el = pathScrollRef.current;
    if (!el) return;
    const toEnd = () => {
      el.scrollLeft = el.scrollWidth;
    };
    toEnd();
    const observer = new ResizeObserver(toEnd);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bucket, prefix]);

  const handleCreateFolder = async (folderName: string) => {
    try {
      setCreatingFolder(true);
      await onCreateFolder(folderName);
      setCreateFolderModalOpened(false);
    } catch (error) {
      // Error will be handled by parent component
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await onUpload(file);
    };
    input.click();
  };

  const handleCopyPath = async () => {
    try {
      await writeText(`s3://${bucket}/${prefix}`);
      notifications.show({
        message: 'Path copied to clipboard',
        color: 'green',
        position: 'bottom-right',
      });
    } catch (e) {
      notifications.show({
        message: `Copy failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
        color: 'red',
        position: 'bottom-right',
      });
    }
  };

  // Handle ESC key - clear and collapse
  const handleSearchEscape = useCallback(() => {
    setSearchExpanded(false);
  }, []);

  // Setup global hotkeys
  const isMac = useMemo(
    () => navigator.platform.toUpperCase().indexOf('MAC') >= 0,
    []
  );

  useGlobalHotkeys(
    [
      {
        key: 'f',
        metaKey: isMac,
        ctrlKey: !isMac,
        handler: () => {
          if (hasBucket) {
            setSearchExpanded(true);
            // The mobile row needs a moment to expand before it can take focus
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }
        },
      },
      {
        key: 'r',
        metaKey: isMac,
        ctrlKey: !isMac,
        handler: () => {
          if (hasBucket && onRefresh) {
            onRefresh();
          }
        },
      },
      {
        key: 'o',
        metaKey: isMac,
        ctrlKey: !isMac,
        handler: () => {
          if (hasBucket) {
            handleUploadClick();
          }
        },
      },
    ],
    hasBucket
  );

  const hasSearch = hasBucket && !!onSearch && !!onClearSearch;
  const searchBar = hasSearch && (
    <SearchBar
      value={searchQuery}
      mode={searchMode}
      loading={isSearching}
      onSearch={onSearch!}
      onClear={onClearSearch!}
      onEscape={handleSearchEscape}
      fullWidth={isMobile}
      shortcutHint={isMobile ? undefined : getHotkeyDisplay('F')}
      inputRef={searchInputRef}
    />
  );

  return (
    <>
      <div className="sv-toolbar">
        {/* Mobile hamburger menu */}
        {isMobile && onToggleNavbar && (
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={onToggleNavbar}
            title="Toggle Sidebar"
          >
            <IconMenu2 size={16} />
          </ActionIcon>
        )}

        {/* Path bar: s3://bucket/segment/segment/ */}
        <div className="sv-pathbar">
          {hasBucket ? (
            <>
              <div className="sv-pathbar-scroll" ref={pathScrollRef}>
                {!isMobile && <span className="sv-path-scheme">s3://</span>}
                <UnstyledButton
                  className={`sv-path-seg${segments.length === 0 ? ' is-current' : ''}`}
                  onClick={() => onNavigate('')}
                >
                  {bucket}
                </UnstyledButton>
                {segments.map((seg, i) => (
                  <React.Fragment key={i}>
                    <span className="sv-path-sep">/</span>
                    <UnstyledButton
                      className={`sv-path-seg${i === segments.length - 1 ? ' is-current' : ''}`}
                      onClick={() =>
                        onNavigate(`${segments.slice(0, i + 1).join('/')}/`)
                      }
                    >
                      {seg}
                    </UnstyledButton>
                  </React.Fragment>
                ))}
                <span className="sv-path-sep">/</span>
              </div>
              <Tooltip label="Copy path" withArrow>
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={handleCopyPath}
                  aria-label="Copy path"
                >
                  <IconCopy size={12} />
                </ActionIcon>
              </Tooltip>
            </>
          ) : (
            <span className="sv-path-scheme">Please select a bucket</span>
          )}
        </div>

        {/* Desktop: search sits inline */}
        {!isMobile && searchBar}

        {/* Right: Actions */}
        {hasBucket && (
          <div className="sv-toolbar-actions">
            {isMobile && hasSearch && (
              <Tooltip label={`Search (${getHotkeyDisplay('F')})`} withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color={searchExpanded || searchQuery ? undefined : 'gray'}
                  onClick={() => setSearchExpanded(!searchExpanded)}
                >
                  <IconSearch size={15} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip label={`Refresh (${getHotkeyDisplay('R')})`} withArrow>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={onRefresh}
                disabled={loading}
              >
                <IconRefresh size={15} />
              </ActionIcon>
            </Tooltip>

            <span className="sv-toolbar-sep" />

            {!isMobile && (
              <Tooltip label="New Folder" withArrow>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setCreateFolderModalOpened(true)}
                >
                  <IconFolderPlus size={15} />
                </ActionIcon>
              </Tooltip>
            )}

            <Tooltip
              label={`Upload File (${getHotkeyDisplay('O')})`}
              withArrow
            >
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={handleUploadClick}
              >
                <IconUpload size={15} />
              </ActionIcon>
            </Tooltip>

            {/* Favorite button */}
            {onToggleFavorite && (
              <Tooltip
                label={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                withArrow
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={onToggleFavorite}
                  color={isFavorited ? 'yellow' : 'gray'}
                >
                  {isFavorited ? (
                    <IconStarFilled size={15} />
                  ) : (
                    <IconStar size={15} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}

            <span className="sv-toolbar-sep" />

            <SegmentedControl
              size="xs"
              value={view}
              onChange={onChangeView}
              data={[
                {
                  value: 'list',
                  label: <IconLayoutList size={14} />,
                },
                {
                  value: 'thumb',
                  label: <IconLayoutGrid size={14} />,
                },
              ]}
            />
          </div>
        )}
      </div>

      {/* Mobile: search in a collapsible row */}
      {isMobile && hasSearch && (
        <Collapse in={searchExpanded}>
          <div className="sv-search-row">{searchBar}</div>
        </Collapse>
      )}

      <CreateFolderModal
        opened={createFolderModalOpened}
        onClose={() => setCreateFolderModalOpened(false)}
        onConfirm={handleCreateFolder}
        loading={creatingFolder}
      />
    </>
  );
};

// Default shallow compare: callbacks close over the current connection, bucket
// and prefix, so a custom comparator that skips them can keep stale copies
export const CompactToolbar = React.memo(CompactToolbarComponent);

CompactToolbar.displayName = 'CompactToolbar';
