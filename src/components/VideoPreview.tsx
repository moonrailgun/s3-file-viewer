import React, { useEffect, useRef } from 'react';

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

  // Handle video load error by retrying with ensureObjectUrl
  const handleError = async () => {
    if (ensureObjectUrl && videoRef.current) {
      const url = await ensureObjectUrl(fileKey);
      if (url) {
        videoRef.current.src = url;
        videoRef.current.load();
      }
    }
  };

  return (
    <video
      ref={videoRef}
      style={style}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      onError={handleError}
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
  );
};
