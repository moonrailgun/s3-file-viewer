import { useState, useEffect, useCallback } from 'react';

interface UseFileDropOptions {
  onFilesDropped: (files: File[]) => void;
  enabled?: boolean;
}

interface UseFileDropReturn {
  isDragging: boolean;
  dragHandlers: {
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  };
}

/**
 * Custom hook for handling file drag and drop functionality
 * @param onFilesDropped - Callback function to handle dropped files
 * @param enabled - Whether drag and drop is enabled (default: true)
 * @returns Object containing isDragging state and drag event handlers
 */
export function useFileDrop({
  onFilesDropped,
  enabled = true,
}: UseFileDropOptions): UseFileDropReturn {
  const [isDragging, setIsDragging] = useState(false);

  // Prevent default drag and drop behavior globally to avoid browser opening files
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent browser from opening files when dropped outside the upload zone
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Drag] Enter event triggered');
      if (enabled && e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    },
    [enabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Drag] Leave event triggered');

    // Only set isDragging to false if we're leaving the container itself
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('[Drag] Drop event triggered');
      setIsDragging(false);

      if (!enabled) {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      console.log('[Drag] Files dropped:', files.length);

      if (files.length === 0) {
        return;
      }

      // Call the callback with dropped files
      onFilesDropped(files);
    },
    [enabled, onFilesDropped]
  );

  return {
    isDragging,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
