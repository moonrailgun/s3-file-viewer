import { useEffect } from 'react';
import type { S3ObjectInfo } from '../types';

interface UseKeyboardNavigationProps {
  bucket: string | null;
  objects: S3ObjectInfo[];
  selectedFile: S3ObjectInfo | null;
  view: string;
  modalsOpen: boolean;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  onSetSelectedFile: (file: S3ObjectInfo | null) => void;
  onEnterFolder: (key: string) => void;
  onPreviewFile: (key: string) => void;
}

/**
 * Custom hook for keyboard navigation in file list/grid
 * Handles arrow keys and Enter key for navigation and preview
 */
export function useKeyboardNavigation({
  bucket,
  objects,
  selectedFile,
  view,
  modalsOpen,
  gridContainerRef,
  onSetSelectedFile,
  onEnterFolder,
  onPreviewFile,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if there's no bucket or objects, or if modals are open
      if (!bucket || objects.length === 0 || modalsOpen) {
        return;
      }

      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const currentIndex = selectedFile
        ? objects.findIndex((o) => o.key === selectedFile.key)
        : -1;

      // Handle Enter key - open folder or preview file
      if (e.key === 'Enter') {
        if (selectedFile) {
          e.preventDefault();
          if (selectedFile.is_dir) {
            onEnterFolder(selectedFile.key);
            onSetSelectedFile(null);
          } else {
            onPreviewFile(selectedFile.key);
          }
        }
        return;
      }

      // Navigation logic based on view mode
      if (view === 'list') {
        // List view: up/down navigation
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentIndex > 0) {
            onSetSelectedFile(objects[currentIndex - 1]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentIndex < objects.length - 1) {
            onSetSelectedFile(objects[currentIndex + 1]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        }
      } else {
        // Grid view: 4-directional navigation
        // Calculate columns based on container width
        const containerWidth = gridContainerRef.current?.clientWidth || 0;
        const itemWidth = 220; // ObjectThumb width
        const gap = 2; // gap value from Group
        const columns = Math.max(
          1,
          Math.floor(containerWidth / (itemWidth + gap))
        );

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (currentIndex > 0) {
            onSetSelectedFile(objects[currentIndex - 1]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (currentIndex < objects.length - 1) {
            onSetSelectedFile(objects[currentIndex + 1]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const newIndex = currentIndex - columns;
          if (newIndex >= 0) {
            onSetSelectedFile(objects[newIndex]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const newIndex = currentIndex + columns;
          if (newIndex < objects.length) {
            onSetSelectedFile(objects[newIndex]);
          } else if (currentIndex === -1 && objects.length > 0) {
            onSetSelectedFile(objects[0]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    bucket,
    objects,
    selectedFile,
    view,
    modalsOpen,
    onSetSelectedFile,
    onEnterFolder,
    onPreviewFile,
  ]);
}
