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

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // silent
  }
};

export default { getItem, setItem, removeItem };
