import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const KEY_NAME = 'cervitrack_chat_key';
const DELIM = ':';

let cachedKey: string | null = null;

async function loadOrCreateKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
    await SecureStore.setItemAsync(KEY_NAME, key);
  }
  cachedKey = key;
  return key;
}

export async function initChatCrypto(): Promise<void> {
  try {
    await loadOrCreateKey();
  } catch {
    cachedKey = null;
  }
}

export async function chatEncrypt(plain: string): Promise<string> {
  if (!plain || !cachedKey) return plain;
  try {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plain, CryptoJS.enc.Base64.parse(cachedKey), {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return iv.toString(CryptoJS.enc.Base64) + DELIM + encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  } catch {
    return plain;
  }
}

export async function chatDecrypt(cipher: string): Promise<string> {
  if (!cipher || !cachedKey) return cipher;
  const parts = cipher.split(DELIM);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return cipher;
  try {
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const ct = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(parts[1]),
    });
    const decrypted = CryptoJS.AES.decrypt(
      ct,
      CryptoJS.enc.Base64.parse(cachedKey),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );
    return decrypted.toString(CryptoJS.enc.Utf8) || '';
  } catch {
    return cipher;
  }
}

export function chatEncryptSync(plain: string): string {
  if (!plain || !cachedKey) return plain;
  try {
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plain, CryptoJS.enc.Base64.parse(cachedKey), {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return iv.toString(CryptoJS.enc.Base64) + DELIM + encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  } catch {
    return plain;
  }
}

export function chatDecryptSync(cipher: string): string {
  if (!cipher || !cachedKey) return cipher;
  const parts = cipher.split(DELIM);
  if (parts.length !== 2 || !parts[0] || !parts[1]) return cipher;
  try {
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const ct = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(parts[1]),
    });
    const decrypted = CryptoJS.AES.decrypt(
      ct,
      CryptoJS.enc.Base64.parse(cachedKey),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );
    return decrypted.toString(CryptoJS.enc.Utf8) || '';
  } catch {
    return cipher;
  }
}