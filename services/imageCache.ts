import * as FileSystem from 'expo-file-system/legacy';

const PHOTO_DIR = `${FileSystem.documentDirectory}photos/`;

async function ensureDir(): Promise<void> {
  const dir = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dir.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function cacheProfileImage(userId: string, imageUrl: string): Promise<string | null> {
  if (!imageUrl) return null;
  await ensureDir();
  const localPath = `${PHOTO_DIR}${userId}.jpg`;
  try {
    const result = await FileSystem.downloadAsync(imageUrl, localPath);
    return result.uri;
  } catch {
    return null;
  }
}

export async function getCachedProfileImage(userId: string): Promise<string | null> {
  const localPath = `${PHOTO_DIR}${userId}.jpg`;
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
    return null;
  } catch {
    return null;
  }
}

export async function deleteCachedProfileImage(userId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(`${PHOTO_DIR}${userId}.jpg`, { idempotent: true });
  } catch {
    // silent
  }
}

export async function cacheBase64Image(userId: string, base64: string): Promise<string> {
  await ensureDir();
  const localPath = `${PHOTO_DIR}${userId}.jpg`;
  await FileSystem.writeAsStringAsync(localPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return localPath;
}

export default {
  cacheProfileImage,
  getCachedProfileImage,
  deleteCachedProfileImage,
  cacheBase64Image,
};
