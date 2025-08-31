import React from 'react';
import { Breadcrumbs, Button, Group } from '@mantine/core';
import { IconFolderPlus, IconUpload } from '@tabler/icons-react';

export type ToolbarProps = {
  connected: boolean;
  breadcrumbItems: React.ReactNode[];
  onCreateFolder: (name: string) => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  connected,
  breadcrumbItems,
  onCreateFolder,
  onUpload,
}) => {
  return (
    <Group justify="space-between">
      {connected && <Breadcrumbs separator="/">{breadcrumbItems}</Breadcrumbs>}
      <Group>
        <Button
          leftSection={<IconFolderPlus size={16} />}
          variant="light"
          onClick={async () => {
            const name = prompt('Folder name');
            if (!name) return;
            await onCreateFolder(name);
          }}
        >
          New Folder
        </Button>
        <Button
          leftSection={<IconUpload size={16} />}
          variant="light"
          onClick={async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              await onUpload(file);
            };
            input.click();
          }}
        >
          Upload
        </Button>
      </Group>
    </Group>
  );
};
