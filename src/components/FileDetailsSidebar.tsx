import React from 'react';
import { Button, ActionIcon } from '@mantine/core';
import {
  IconX,
  IconCopy,
  IconEye,
  IconDownload,
  IconTrash,
} from '@tabler/icons-react';
import { S3ObjectInfo } from '../types';
import {
  humanFileSize,
  getFileName,
  getFileExtension,
  getFileType,
  isImageKey,
  isVideoKey,
  isAudioKey,
  formatDateTime,
} from '../utils/common';
import { getFileIconWithProps } from '../utils/icons';
import { isMobilePlatform } from '../utils/platform';
import { ImagePreview } from './ImagePreview';
import { VideoPreview } from './VideoPreview';
import { AudioPreview } from './AudioPreview';

export type FileDetailsSidebarProps = {
  file: S3ObjectInfo | null;
  onClose: () => void;
  onCopyUrl?: (key: string) => void | Promise<void>;
  onPreview?: (key: string) => void | Promise<void>;
  onDownload?: (key: string) => void | Promise<void>;
  onDelete?: (key: string) => void;
  ensureObjectUrl?: (key: string) => Promise<string | undefined>;
  onImagePreview?: (key: string, url: string) => void;
};

const TYPE_LABELS: Record<ReturnType<typeof getFileType>, string> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  archive: 'archive',
  code: 'source file',
  other: 'file',
};

export const FileDetailsSidebar: React.FC<FileDetailsSidebarProps> = ({
  file,
  onClose,
  onCopyUrl,
  onPreview,
  onDownload,
  onDelete,
  ensureObjectUrl,
  onImagePreview,
}) => {
  if (!file) {
    return null;
  }

  const fileName = getFileName(file.key);
  const ext = getFileExtension(file.key).toUpperCase();
  const typeText = file.is_dir
    ? 'Folder'
    : `${ext ? `${ext} ` : ''}${TYPE_LABELS[getFileType(file.key)]}`;
  const bigIcon = getFileIconWithProps(file.key, file.is_dir, {
    size: 56,
    stroke: 1.25,
  });

  const openImageModal = async () => {
    const url = await ensureObjectUrl?.(file.key);
    if (url) {
      onImagePreview?.(file.key, url);
    }
  };

  return (
    <div className="sv-insp">
      {/* Header */}
      <div className="sv-insp-head">
        <span>Details</span>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={onClose}
          aria-label="Close details"
        >
          <IconX size={15} />
        </ActionIcon>
      </div>

      <div className="sv-insp-body">
        {/* Preview */}
        {!file.is_dir && isImageKey(file.key) ? (
          <div className="sv-insp-preview">
            <ImagePreview
              fileKey={file.key}
              alt={fileName}
              ensureObjectUrl={ensureObjectUrl}
              style={{ width: '100%', height: '100%' }}
              className="cursor-zoom-in object-contain"
              onClick={openImageModal}
            />
          </div>
        ) : !file.is_dir && isVideoKey(file.key) ? (
          <div className="sv-insp-preview">
            <VideoPreview
              fileKey={file.key}
              ensureObjectUrl={ensureObjectUrl}
              style={{ width: '100%', height: '100%' }}
              className="object-contain"
              controls
            />
          </div>
        ) : !file.is_dir && isAudioKey(file.key) ? (
          <>
            <div className="sv-insp-preview">{bigIcon}</div>
            <AudioPreview
              fileKey={file.key}
              ensureObjectUrl={ensureObjectUrl}
              style={{ width: '100%' }}
              controls
            />
          </>
        ) : (
          <div className="sv-insp-preview">{bigIcon}</div>
        )}

        {/* Name */}
        <div>
          <div className="sv-insp-name">{fileName}</div>
          <div className="sv-insp-sub">
            {file.is_dir ? typeText : `${typeText} · ${humanFileSize(file.size)}`}
          </div>
        </div>

        {/* Actions */}
        {!file.is_dir && (
          <div className="sv-insp-actions">
            {onCopyUrl && (
              <Button
                size="xs"
                leftSection={<IconCopy size={14} />}
                onClick={() => onCopyUrl(file.key)}
                fullWidth
              >
                Copy URL
              </Button>
            )}
            <div className="sv-insp-pair">
              {onPreview && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconEye size={14} />}
                  onClick={() => onPreview(file.key)}
                >
                  Preview
                </Button>
              )}
              {onDownload && (
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => onDownload(file.key)}
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <dl className="sv-insp-meta">
          <dt>Key</dt>
          <dd className="is-mono">{file.key}</dd>
          <dt>Type</dt>
          <dd>{typeText}</dd>
          {!file.is_dir && (
            <>
              <dt>Size</dt>
              <dd>
                {humanFileSize(file.size)}
                {file.size >= 1024 &&
                  ` (${file.size.toLocaleString()} bytes)`}
              </dd>
            </>
          )}
          {file.last_modified && (
            <>
              <dt>Modified</dt>
              <dd>{formatDateTime(file.last_modified)}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Footer */}
      {(!file.is_dir && onDelete) || !isMobilePlatform() ? (
        <div className="sv-insp-foot">
          {!file.is_dir && onDelete ? (
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => onDelete(file.key)}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          {!isMobilePlatform() && (
            <span className="sv-keys">
              <span className="sv-kbd">↑</span>
              <span className="sv-kbd">↓</span> select
              <span className="sv-kbd">↵</span> preview
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
};
