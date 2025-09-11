/**
 * MIME type inference utilities
 * Infer MIME type based on file extension and fallback to browser's File.type
 */

// Common MIME type mappings based on file extensions
const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
  '.odp': 'application/vnd.oasis.opendocument.presentation',

  // Text files
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.rtf': 'application/rtf',

  // Programming languages
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'application/javascript',
  '.py': 'text/x-python',
  '.java': 'text/x-java-source',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.h': 'text/x-chdr',
  '.php': 'application/x-httpd-php',
  '.rb': 'application/x-ruby',
  '.go': 'text/x-go',
  '.rs': 'text/rust',
  '.swift': 'text/x-swift',
  '.kt': 'text/x-kotlin',
  '.scala': 'text/x-scala',
  '.sh': 'application/x-sh',
  '.ps1': 'application/x-powershell',
  '.bat': 'application/x-msdos-program',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.wma': 'audio/x-ms-wma',

  // Video
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.3gp': 'video/3gpp',
  '.m4v': 'video/x-m4v',

  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.bz2': 'application/x-bzip2',
  '.xz': 'application/x-xz',
  '.dmg': 'application/x-apple-diskimage',
  '.iso': 'application/x-iso9660-image',

  // Executables
  '.exe': 'application/vnd.microsoft.portable-executable',
  '.msi': 'application/x-msdownload',
  '.deb': 'application/vnd.debian.binary-package',
  '.rpm': 'application/x-rpm',
  '.appimage': 'application/x-executable',

  // Fonts
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',

  // Configuration files
  '.ini': 'text/plain',
  '.conf': 'text/plain',
  '.cfg': 'text/plain',
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',
  '.toml': 'application/toml',
  '.env': 'text/plain',

  // Other common files
  '.log': 'text/plain',
  '.bin': 'application/octet-stream',
  '.dat': 'application/octet-stream',
  '.sqlite': 'application/vnd.sqlite3',
  '.db': 'application/octet-stream',
  '.psd': 'image/vnd.adobe.photoshop',
  '.ai': 'application/postscript',
  '.eps': 'application/postscript',
  '.sketch': 'application/x-sketch',
};

/**
 * Get file extension from filename, normalized to lowercase
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Infer MIME type from file extension
 */
function inferMimeTypeFromExtension(filename: string): string | null {
  const extension = getFileExtension(filename);
  return MIME_TYPE_MAP[extension] || null;
}

/**
 * Infer MIME type for a file
 * Priority: 1. File.type (browser native), 2. Extension mapping, 3. Default fallback
 */
export function inferMimeType(file: File): string {
  // First try to use the browser's native MIME type detection
  if (file.type && file.type !== '') {
    return file.type;
  }

  // Fallback to extension-based inference
  const mimeFromExtension = inferMimeTypeFromExtension(file.name);
  if (mimeFromExtension) {
    return mimeFromExtension;
  }

  // Default fallback for unknown file types
  return 'application/octet-stream';
}

/**
 * Check if a MIME type represents a text file
 */
export function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/x-yaml' ||
    mimeType === 'application/toml'
  );
}

/**
 * Check if a MIME type represents an image file
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if a MIME type represents a video file
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if a MIME type represents an audio file
 */
export function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

/**
 * Get a human-readable description of a MIME type
 */
export function getMimeTypeDescription(mimeType: string): string {
  const descriptions: Record<string, string> = {
    'application/octet-stream': 'Binary file',
    'text/plain': 'Text file',
    'application/json': 'JSON file',
    'application/javascript': 'JavaScript file',
    'application/typescript': 'TypeScript file',
    'text/html': 'HTML file',
    'text/css': 'CSS file',
    'image/jpeg': 'JPEG image',
    'image/png': 'PNG image',
    'image/gif': 'GIF image',
    'application/pdf': 'PDF document',
    'application/zip': 'ZIP archive',
    'video/mp4': 'MP4 video',
    'audio/mpeg': 'MP3 audio',
  };

  return descriptions[mimeType] || mimeType;
}
