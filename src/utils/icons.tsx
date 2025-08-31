import React from 'react';
import {
  IconFile,
  IconFileText,
  IconFileCode,
  IconFileZip,
  IconFileMusic,
  IconVideo,
  IconFolder,
  IconPhoto,
} from '@tabler/icons-react';
import { getFileType } from './common';

// Icon component mapping
const ICON_COMPONENTS = {
  folder: IconFolder,
  image: IconPhoto,
  document: IconFileText,
  code: IconFileCode,
  archive: IconFileZip,
  audio: IconFileMusic,
  video: IconVideo,
  other: IconFile,
} as const;

export type FileTypeIconKey = keyof typeof ICON_COMPONENTS;

/**
 * Get the appropriate icon component for a file type
 * @param key - File key/path
 * @param isDir - Whether the item is a directory
 * @returns Icon component
 */
export function getFileIcon(key: string, isDir: boolean) {
  if (isDir) return ICON_COMPONENTS.folder;

  const fileType = getFileType(key);
  return ICON_COMPONENTS[fileType] || ICON_COMPONENTS.other;
}

/**
 * Get file type icon component with custom props
 * @param key - File key/path
 * @param isDir - Whether the item is a directory
 * @param props - Icon props (size, color, etc.)
 * @returns Icon component with props
 */
export function getFileIconWithProps(
  key: string,
  isDir: boolean,
  props: React.ComponentProps<typeof IconFile>
) {
  const IconComponent = getFileIcon(key, isDir);
  return <IconComponent {...props} />;
}
