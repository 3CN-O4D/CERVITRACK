import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;
const IMAGES_DIR = `${MEDIA_DIR}images/`;
const AUDIO_DIR = `${MEDIA_DIR}audio/`;

async function ensureDirs() {
  for (const dir of [MEDIA_DIR, IMAGES_DIR, AUDIO_DIR]) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

// ─── Images ───────────────────────────────────────────────────

export async function saveImageLocally(uri: string, messageId: string): Promise<string> {
  await ensureDirs();
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const localPath = `${IMAGES_DIR}${messageId}.${ext}`;
  try {
    if (uri.startsWith('file://') || uri.startsWith('/')) {
      await FileSystem.copyAsync({ from: uri, to: localPath });
    } else if (uri.startsWith('http')) {
      await FileSystem.downloadAsync(uri, localPath);
    } else {
      // base64
      await FileSystem.writeAsStringAsync(localPath, uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    return localPath;
  } catch {
    return uri; // return original if save fails
  }
}

export async function getImageLocal(messageId: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(`${IMAGES_DIR}${messageId}.jpg`);
    if (info.exists) return info.uri;
    // Try other extensions
    for (const ext of ['png', 'jpeg', 'webp', 'gif']) {
      const info2 = await FileSystem.getInfoAsync(`${IMAGES_DIR}${messageId}.${ext}`);
      if (info2.exists) return info2.uri;
    }
    return null;
  } catch { return null; }
}

export async function deleteImageLocal(messageId: string): Promise<void> {
  for (const ext of ['jpg', 'png', 'jpeg', 'webp', 'gif']) {
    try {
      await FileSystem.deleteAsync(`${IMAGES_DIR}${messageId}.${ext}`, { idempotent: true });
    } catch { /* silent */ }
  }
}

// ─── Audio / Voice Notes ──────────────────────────────────────

export async function saveAudioLocally(uri: string, messageId: string): Promise<string> {
  await ensureDirs();
  const localPath = `${AUDIO_DIR}${messageId}.m4a`;
  try {
    if (uri.startsWith('file://') || uri.startsWith('/')) {
      await FileSystem.copyAsync({ from: uri, to: localPath });
    } else if (uri.startsWith('http')) {
      await FileSystem.downloadAsync(uri, localPath);
    }
    return localPath;
  } catch {
    return uri;
  }
}

export async function getAudioLocal(messageId: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(`${AUDIO_DIR}${messageId}.m4a`);
    if (info.exists) return info.uri;
    return null;
  } catch { return null; }
}

export async function deleteAudioLocal(messageId: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(`${AUDIO_DIR}${messageId}.m4a`, { idempotent: true });
  } catch { /* silent */ }
}

// ─── Upload to Cloudinary ─────────────────────────────────────

export async function uploadMediaToCloudinary(localUri: string, type: 'image' | 'video' | 'audio'): Promise<string | null> {
  try {
    const Constants = require('expo-constants').default;
    const cloudName = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'fdusgrsg';
    const uploadPreset = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    const formData = new FormData();
    const ext = localUri.split('.').pop() || 'jpg';
    const mimeType = type === 'image' ? `image/${ext}` : type === 'audio' ? 'audio/m4a' : `video/${ext}`;
    formData.append('file', { uri: localUri, type: mimeType, name: `media.${ext}` } as any);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', type);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  } catch { return null; }
}

// ─── Cleanup old media ────────────────────────────────────────

export async function getMediaDirSize(): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists) return 0;
    return (info as any).size ?? 0;
  } catch { return 0; }
}

export async function clearOldMedia(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const now = Date.now();
    for (const dir of [IMAGES_DIR, AUDIO_DIR]) {
      const items = await FileSystem.readDirectoryAsync(dir);
      for (const item of items) {
        const itemInfo = await FileSystem.getInfoAsync(`${dir}${item}`);
        if (itemInfo.exists && itemInfo.modificationTime) {
          const age = now - itemInfo.modificationTime * 1000;
          if (age > maxAgeMs) {
            await FileSystem.deleteAsync(`${dir}${item}`, { idempotent: true });
          }
        }
      }
    }
  } catch { /* silent */ }
}

export default {
  saveImageLocally,
  getImageLocal,
  deleteImageLocal,
  saveAudioLocally,
  getAudioLocal,
  deleteAudioLocal,
  uploadMediaToCloudinary,
  getMediaDirSize,
  clearOldMedia,
};
