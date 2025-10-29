import React from 'react';
import { RefreshCw, FolderPlus, Upload } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';

interface ContextMenuWrapperProps {
  children: React.ReactNode;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onUpload: () => void;
}

/**
 * Context menu wrapper for main content area
 * Provides right-click menu with refresh, create folder, and upload options
 */
export const ContextMenuWrapper = React.memo(
  ({
    children,
    onRefresh,
    onCreateFolder,
    onUpload,
  }: ContextMenuWrapperProps) => {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </ContextMenuItem>
          <ContextMenuItem onClick={onCreateFolder}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={onUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

ContextMenuWrapper.displayName = 'ContextMenuWrapper';
