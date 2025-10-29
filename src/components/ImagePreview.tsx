import React, { useEffect, useRef, useState } from 'react';
import { Loader, Box } from '@mantine/core';

export type ImagePreviewProps = {
  fileKey: string;
  alt: string;
  ensureObjectUrl?: (key: string) => Promise<string | undefined>;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
  lazy?: boolean; // Whether to use lazy loading
  inView?: boolean; // For lazy loading, whether the image is in viewport
};

/**
 * Image preview component with lazy loading and error handling
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  fileKey,
  alt,
  ensureObjectUrl,
  style,
  onClick,
  className,
  lazy = false,
  inView = true,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loadedKeyRef = useRef<string>('');
  const [loading, setLoading] = useState(true);
  const errorAttemptedRef = useRef<Set<string>>(new Set()); // Track error retry attempts

  // Load image when component mounts or when in viewport (for lazy loading)
  useEffect(() => {
    // Skip if already loaded this key
    if (loadedKeyRef.current === fileKey) {
      return;
    }

    // Reset image when fileKey changes
    if (imgRef.current) {
      imgRef.current.src = '';
      loadedKeyRef.current = '';
      setLoading(true);
    }

    // Load image if conditions are met
    if (ensureObjectUrl && (!lazy || inView)) {
      (async () => {
        const url = await ensureObjectUrl(fileKey);
        if (url && imgRef.current && loadedKeyRef.current !== fileKey) {
          imgRef.current.src = url;
          loadedKeyRef.current = fileKey;
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey, lazy, inView]);

  // Handle image load success
  const handleLoad = () => {
    setLoading(false);
  };

  // Handle image load error - only retry once per file
  const handleError = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false);

    // Prevent infinite retry loops
    if (errorAttemptedRef.current.has(fileKey)) {
      return;
    }

    errorAttemptedRef.current.add(fileKey);

    if (ensureObjectUrl) {
      const url = await ensureObjectUrl(fileKey);
      if (url) {
        (e.currentTarget as HTMLImageElement).src = url;
      }
    }
  };

  return (
    <Box style={{ position: 'relative', ...style }}>
      {loading && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            borderRadius: 6,
          }}
        >
          <Loader size="sm" />
        </Box>
      )}
      <img
        ref={imgRef}
        alt={alt}
        style={{
          ...style,
          display: loading ? 'none' : 'block',
        }}
        className={className}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
      />
    </Box>
  );
};
