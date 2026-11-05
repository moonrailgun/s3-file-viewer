import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Box, Group, MantineProvider, Paper, Progress, Text } from '@mantine/core';
import { Channel, convertFileSrc, invoke } from '@tauri-apps/api/core';
import { getFileName, humanFileSize } from '../utils/common';
import { theme } from '../theme';
import '@mantine/core/styles.css';
import '../global.css';

const params = new URLSearchParams(window.location.search);
const bucket = params.get('bucket') ?? '';
const key = params.get('key') ?? '';
const name = getFileName(key);
const ext = name.includes('.') ? name.split('.').pop()!.slice(0, 4).toUpperCase() : 'FILE';

type DownloadProgress = { downloaded: number; total: number };

function formatEta(secs: number) {
  return secs < 60 ? `${secs}s left` : `${Math.ceil(secs / 60)} min left`;
}

const PreviewWindow: React.FC = () => {
  const [progress, setProgress] = useState<DownloadProgress>({ downloaded: 0, total: 0 });
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string>();
  const sample = useRef({ time: performance.now(), bytes: 0 });

  useEffect(() => {
    const channel = new Channel<DownloadProgress>();
    channel.onmessage = (p) => {
      const now = performance.now();
      const dt = (now - sample.current.time) / 1000;
      if (dt >= 0.3) {
        const s = (p.downloaded - sample.current.bytes) / dt;
        setSpeed((prev) => (prev ? prev * 0.6 + s * 0.4 : s));
        sample.current = { time: now, bytes: p.downloaded };
      }
      setProgress(p);
    };

    invoke<string>('download_for_preview', { bucket, key, onProgress: channel })
      // Hand the local copy to the webview so it renders natively (image, video, pdf, text...)
      .then((path) => window.location.replace(convertFileSrc(path)))
      .catch((e) => setError(String(e)));
  }, []);

  const { downloaded, total } = progress;
  const known = total > 0;
  const pct = known ? (downloaded / total) * 100 : 100;
  const rate = Math.round(speed);

  return (
    <Box h="100vh" style={{ display: 'grid', placeItems: 'center' }}>
      <Paper withBorder shadow="sm" radius="md" p="md" w={340} maw="85vw">
        <Group gap="sm" wrap="nowrap" mb="sm">
          <Box
            style={{
              flex: 'none',
              width: 34,
              height: 40,
              borderRadius: 6,
              display: 'grid',
              placeItems: 'end center',
              paddingBottom: 6,
              fontSize: 8.5,
              fontWeight: 700,
              fontFamily: 'var(--mantine-font-family-monospace)',
              background: `var(--mantine-color-${error ? 'red' : 'blue'}-light)`,
              color: `var(--mantine-color-${error ? 'red' : 'blue'}-light-color)`,
            }}
          >
            {ext}
          </Box>
          <Box miw={0}>
            <Text size="sm" fw={600} truncate="end" title={key}>
              {name}
            </Text>
            <Text size="xs" c={error ? 'red' : 'dimmed'}>
              {error ? 'Failed to load' : 'Loading'}
            </Text>
          </Box>
        </Group>

        <Progress
          value={error ? 100 : pct}
          color={error ? 'red' : undefined}
          size={4}
          striped={!known && !error}
          animated={!known && !error}
          transitionDuration={150}
        />

        {error ? (
          <Text size="xs" c="red" mt="xs" lineClamp={4}>
            {error}
          </Text>
        ) : (
          // Single line always: 340px fits the longest case ("1023.99 MB / 1023.99 MB" + "1023.99 KB/s · 59 min left")
          <Group
            justify="space-between"
            wrap="nowrap"
            mt="xs"
            gap="xs"
            ff="monospace"
            fz={11}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Text inherit c="dimmed">
              {humanFileSize(downloaded)}
              {known && ` / ${humanFileSize(total)}`}
            </Text>
            {rate > 0 && (
              <Text inherit c="dimmed">
                {humanFileSize(rate)}/s
                {known && ` · ${formatEta(Math.ceil((total - downloaded) / rate))}`}
              </Text>
            )}
          </Group>
        )}
      </Paper>
    </Box>
  );
};

// No StrictMode: its double effect run in dev would start the download twice
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <MantineProvider defaultColorScheme="auto" theme={theme}>
    <PreviewWindow />
  </MantineProvider>
);
