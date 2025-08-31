// Generic utilities

export function humanFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isImageKey(key: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)$/i.test(key);
}

export function getFileType(
  key: string
): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'code' | 'other' {
  // const ext = key.toLowerCase().split('.').pop() || '';

  // Image files
  if (/\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif)$/i.test(key)) {
    return 'image';
  }

  // Document files
  if (
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|md|html|htm|xml|json|csv)$/i.test(
      key
    )
  ) {
    return 'document';
  }

  // Video files
  if (/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv)$/i.test(key)) {
    return 'video';
  }

  // Audio files
  if (/\.(mp3|wav|flac|aac|ogg|wma|m4a|opus)$/i.test(key)) {
    return 'audio';
  }

  // Archive files
  if (/\.(zip|rar|7z|tar|gz|bz2|xz|iso|dmg)$/i.test(key)) {
    return 'archive';
  }

  // Code files
  if (
    /\.(js|ts|jsx|tsx|py|java|c|cpp|h|hpp|cs|php|rb|go|rs|swift|kt|scala|r|sql|sh|bat|ps1|yml|yaml|toml|ini|cfg|conf)$/i.test(
      key
    )
  ) {
    return 'code';
  }

  return 'other';
}

export function getFileName(key: string): string {
  // Remove path and get just the filename
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

// File type icons mapping
export const FILE_TYPE_ICONS = {
  folder: 'IconFolder',
  image: 'IconPhoto',
  document: 'IconFileText',
  code: 'IconFileCode',
  archive: 'IconFileZip',
  audio: 'IconFileMusic',
  video: 'IconVideo',
  other: 'IconFile',
} as const;

export type FileTypeIconKey = keyof typeof FILE_TYPE_ICONS;
