let AsyncStorage: any;

try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  const storage: Record<string, string> = {};
  AsyncStorage = {
    getItem: async (key: string) => storage[key] ?? null,
    setItem: async (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: async (key: string) => {
      delete storage[key];
    },
    clear: async () => {
      Object.keys(storage).forEach((k) => delete storage[k]);
    },
  };
}

import { chatEncrypt, chatDecrypt } from './crypto';

export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // silent
  }
};

export const setItemEnc = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, await chatEncrypt(value));
  } catch {
    // silent
  }
};

export const getItemEnc = async (key: string): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const dec = await chatDecrypt(raw);
    return dec === raw && !raw.includes(':') ? null : dec;
  } catch {
    return null;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silent
  }
};

export default { getItem, setItem, removeItem };
