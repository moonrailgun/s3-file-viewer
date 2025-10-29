import React, { useEffect, useRef, useState } from 'react';
import { Loader, Box, Text, Stack, Group } from '@mantine/core';
import { IconFileMusic } from '@tabler/icons-react';
import { getFileName } from '../utils/common';

export type AudioPreviewProps = {
  fileKey: string;
  ensureObjectUrl?: (key: string) => Promise<string | undefined>;
  style?: React.CSSProperties;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
};

/**
 * Format duration in seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Audio preview component with lazy loading and error handling
 */
export const AudioPreview: React.FC<AudioPreviewProps> = ({
  fileKey,
  ensureObjectUrl,
  style,
  className,
  controls = true,
  autoPlay = false,
  loop = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedKeyRef = useRef<string>('');
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number | null>(null);

  const fileName = getFileName(fileKey);
  const fileExtension = fileName.includes('.')
    ? fileName.split('.').pop()?.toUpperCase()
    : '';

  // Load audio when component mounts or fileKey changes
  useEffect(() => {
    // Skip if already loaded this key
    if (loadedKeyRef.current === fileKey) {
      return;
    }

    // Reset audio when fileKey changes
    if (audioRef.current) {
      audioRef.current.src = '';
      audioRef.current.load();
      loadedKeyRef.current = '';
      setLoading(true);
      setDuration(null);
    }

    // Load audio if ensureObjectUrl is provided
    if (ensureObjectUrl) {
      (async () => {
        const url = await ensureObjectUrl(fileKey);
        if (url && audioRef.current && loadedKeyRef.current !== fileKey) {
          audioRef.current.src = url;
          audioRef.current.load();
          loadedKeyRef.current = fileKey;
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  // Handle audio load success (when metadata is loaded)
  const handleLoadedData = () => {
    setLoading(false);
    if (audioRef.current && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio load error by retrying with ensureObjectUrl
  const handleError = async () => {
    setLoading(false);
    if (ensureObjectUrl && audioRef.current) {
      const url = await ensureObjectUrl(fileKey);
      if (url) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    }
  };

  return (
    <Box style={{ position: 'relative', ...style }} className={className}>
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

      <Stack
        gap="sm"
        style={{
          background:
            'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
          borderRadius: 6,
          padding: '16px',
          border:
            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* Icon and Info Section */}
        <Group gap="sm" align="center">
          <IconFileMusic
            size={32}
            style={{
              color: 'var(--mantine-color-blue-6)',
              flexShrink: 0,
            }}
          />
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text
              size="sm"
              fw={500}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={fileName}
            >
              {fileName}
            </Text>
            <Group gap="xs">
              {fileExtension && (
                <Text size="xs" c="dimmed">
                  {fileExtension}
                </Text>
              )}
              {duration !== null && (
                <>
                  <Text size="xs" c="dimmed">
                    •
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDuration(duration)}
                  </Text>
                </>
              )}
            </Group>
          </Stack>
        </Group>

        {/* Audio Player */}
        <audio
          ref={audioRef}
          style={{
            width: '100%',
          }}
          controls={controls}
          autoPlay={autoPlay}
          loop={loop}
          onLoadedData={handleLoadedData}
          onError={handleError}
          preload="metadata"
        >
          Your browser does not support the audio tag.
        </audio>
      </Stack>
    </Box>
  );
};
