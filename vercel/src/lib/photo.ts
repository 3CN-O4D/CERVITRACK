export function safePhotoSrc(photo: string | null | undefined): string | null {
  if (!photo) return null;
  const value = photo.trim();
  if (!value) return null;
  if (
    value.startsWith('data:image/') ||
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('/')
  ) {
    return value;
  }
  return null;
}
