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
