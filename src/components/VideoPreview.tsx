import React, { useEffect, useRef, useState } from 'react';
import { Loader, Box } from '@mantine/core';

export type VideoPreviewProps = {
  fileKey: string;
  ensureObjectUrl?: (key: string) => Promise<string | undefined>;
  style?: React.CSSProperties;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

/**
 * Video preview component with lazy loading and error handling
 */
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  fileKey,
  ensureObjectUrl,
  style,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadedKeyRef = useRef<string>('');
  const [loading, setLoading] = useState(true);
  const errorAttemptedRef = useRef<Set<string>>(new Set()); // Track error retry attempts

  // Load video when component mounts or fileKey changes
  useEffect(() => {
    // Skip if already loaded this key
    if (loadedKeyRef.current === fileKey) {
      return;
    }

    // Reset video when fileKey changes
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
      loadedKeyRef.current = '';
      setLoading(true);
    }

    // Load video if ensureObjectUrl is provided
    if (ensureObjectUrl) {
      (async () => {
        const url = await ensureObjectUrl(fileKey);
        if (url && videoRef.current && loadedKeyRef.current !== fileKey) {
          videoRef.current.src = url;
          videoRef.current.load();
          loadedKeyRef.current = fileKey;
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  // Handle video load success (when metadata is loaded)
  const handleLoadedData = () => {
    setLoading(false);
  };

  // Handle video load error - only retry once per file
  const handleError = async () => {
    setLoading(false);

    // Prevent infinite retry loops
    if (errorAttemptedRef.current.has(fileKey)) {
      return;
    }

    errorAttemptedRef.current.add(fileKey);

    if (ensureObjectUrl && videoRef.current) {
      const url = await ensureObjectUrl(fileKey);
      if (url) {
        videoRef.current.src = url;
        videoRef.current.load();
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
            zIndex: 1,
          }}
        >
          <Loader size="sm" />
        </Box>
      )}
      <video
        ref={videoRef}
        style={{
          ...style,
          display: loading ? 'none' : 'block',
        }}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        onLoadedData={handleLoadedData}
        onError={handleError}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </Box>
  );
};
