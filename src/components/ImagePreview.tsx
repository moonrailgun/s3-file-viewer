import React, { useEffect, useRef } from 'react';

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

  // Handle image load error by retrying with ensureObjectUrl
  const handleError = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (ensureObjectUrl) {
      const url = await ensureObjectUrl(fileKey);
      if (url) {
        (e.currentTarget as HTMLImageElement).src = url;
      }
    }
  };

  return (
    <img
      ref={imgRef}
      alt={alt}
      style={style}
      className={className}
      onClick={onClick}
      onError={handleError}
    />
  );
};
