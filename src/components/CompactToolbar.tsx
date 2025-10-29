import React, { useState } from 'react';
import {
  Group,
  Breadcrumbs,
  ActionIcon,
  SegmentedControl,
  Text,
  Box,
} from '@mantine/core';
import {
  IconRefresh,
  IconFolderPlus,
  IconUpload,
  IconLayoutList,
  IconLayoutGrid,
  IconDatabase,
  IconMenu2,
} from '@tabler/icons-react';
import { CreateFolderModal } from './CreateFolderModal';

export type CompactToolbarProps = {
  // Breadcrumb navigation
  breadcrumbItems: React.ReactNode[];
  // Current bucket name
  bucketName?: string | null;
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
};

export const CompactToolbar: React.FC<CompactToolbarProps> = ({
  breadcrumbItems,
  bucketName,
  view,
  onChangeView,
  onRefresh,
  onCreateFolder,
  onUpload,
  loading = false,
  hasBucket,
  onToggleNavbar,
  isMobile = false,
}) => {
  const [createFolderModalOpened, setCreateFolderModalOpened] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

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

  return (
    <>
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

          {hasBucket && bucketName ? (
            <Box
              className="flex items-center gap-2"
              style={{ flex: 1, minWidth: 0 }}
            >
              {/* Bucket name */}
              <Group gap={6}>
                <IconDatabase size={14} color="var(--mantine-color-blue-6)" />
                <Text
                  size="xs"
                  fw={600}
                  c="blue"
                  className={isMobile ? 'hidden sm:inline' : ''}
                >
                  {bucketName}
                </Text>
              </Group>
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

      <CreateFolderModal
        opened={createFolderModalOpened}
        onClose={() => setCreateFolderModalOpened(false)}
        onConfirm={handleCreateFolder}
        loading={creatingFolder}
      />
    </>
  );
};
