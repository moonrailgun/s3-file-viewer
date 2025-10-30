import React, { useState, useCallback } from 'react';
import {
  Group,
  Breadcrumbs,
  ActionIcon,
  SegmentedControl,
  Text,
  Box,
  Collapse,
} from '@mantine/core';
import {
  IconRefresh,
  IconFolderPlus,
  IconUpload,
  IconLayoutList,
  IconLayoutGrid,
  IconMenu2,
  IconSearch,
} from '@tabler/icons-react';
import { CreateFolderModal } from './CreateFolderModal';
import { SearchBar } from './SearchBar';
import { SearchMode } from '../types';

export type CompactToolbarProps = {
  // Breadcrumb navigation
  breadcrumbItems: React.ReactNode[];
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
};

const CompactToolbarComponent: React.FC<CompactToolbarProps> = ({
  breadcrumbItems,
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
}) => {
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  // Search is collapsed by default for both mobile and desktop
  const [searchExpanded, setSearchExpanded] = useState(false);

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

  // Handle ESC key - clear and collapse
  const handleSearchEscape = useCallback(() => {
    setSearchExpanded(false);
  }, []);

  return (
    <>
      <Box>
        <Group
          justify="space-between"
          p="xs"
          style={{
            borderBottom:
              '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
            backgroundColor:
              'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
          }}
        >
          {/* Left: Mobile menu button + Bucket name and Breadcrumbs */}
          <Box
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* Mobile hamburger menu */}
            {isMobile && onToggleNavbar && (
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onToggleNavbar}
                title="Toggle Sidebar"
              >
                <IconMenu2 size={16} />
              </ActionIcon>
            )}

            {hasBucket ? (
              <Box
                className="flex items-center gap-2"
                style={{ flex: 1, minWidth: 0 }}
              >
                {/* Breadcrumbs */}
                {breadcrumbItems.length > 0 ? (
                  <Breadcrumbs
                    separator="/"
                    separatorMargin={4}
                    className={isMobile ? 'hidden sm:flex' : ''}
                  >
                    {breadcrumbItems}
                  </Breadcrumbs>
                ) : (
                  <Text
                    size="sm"
                    c="dimmed"
                    className={isMobile ? 'hidden sm:inline' : ''}
                  >
                    /
                  </Text>
                )}
              </Box>
            ) : (
              <Text
                size="sm"
                c="dimmed"
                className={isMobile ? 'hidden sm:inline' : ''}
              >
                {hasBucket ? '/' : 'Please select a bucket'}
              </Text>
            )}
          </Box>

          {/* Right: Actions */}
          {hasBucket && (
            <Group gap={4}>
              {/* Search button - toggle search bar visibility */}
              {onSearch && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSearchExpanded(!searchExpanded)}
                  title="Search"
                  color={searchExpanded || searchQuery ? 'blue' : undefined}
                >
                  <IconSearch size={14} />
                </ActionIcon>
              )}

              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
              >
                <IconRefresh size={14} />
              </ActionIcon>

              {!isMobile && (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setCreateFolderModalOpened(true)}
                  title="New Folder"
                >
                  <IconFolderPlus size={14} />
                </ActionIcon>
              )}

              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={handleUploadClick}
                title="Upload File"
              >
                <IconUpload size={14} />
              </ActionIcon>

              <Box ml={4}>
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
              </Box>
            </Group>
          )}
        </Group>

        {/* Search bar - collapsible for both desktop and mobile */}
        {hasBucket && onSearch && onClearSearch && (
          <Collapse in={searchExpanded}>
            <Box
              p="xs"
              style={{
                borderBottom:
                  '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                backgroundColor:
                  'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
              }}
            >
              <SearchBar
                value={searchQuery}
                mode={searchMode}
                loading={isSearching}
                onSearch={onSearch}
                onClear={onClearSearch}
                onEscape={handleSearchEscape}
                compact={isMobile}
              />
            </Box>
          </Collapse>
        )}
      </Box>

      <CreateFolderModal
        opened={createFolderModalOpened}
        onClose={() => setCreateFolderModalOpened(false)}
        onConfirm={handleCreateFolder}
        loading={creatingFolder}
      />
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const CompactToolbar = React.memo(
  CompactToolbarComponent,
  (prevProps, nextProps) => {
    // Compare primitive values and check if breadcrumb items array length changed
    return (
      prevProps.view === nextProps.view &&
      prevProps.loading === nextProps.loading &&
      prevProps.hasBucket === nextProps.hasBucket &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.searchQuery === nextProps.searchQuery &&
      prevProps.searchMode === nextProps.searchMode &&
      prevProps.isSearching === nextProps.isSearching &&
      prevProps.breadcrumbItems.length === nextProps.breadcrumbItems.length
      // Function props are not compared (should be stable from useCallback)
    );
  }
);

CompactToolbar.displayName = 'CompactToolbar';
