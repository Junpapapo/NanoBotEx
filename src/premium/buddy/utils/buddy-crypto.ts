/**
 * ArrayBuffer를 Base64 문자열로 변환합니다.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 ArrayBuffer로 변환합니다.
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 최초 1회 랜덤 AES-256 키를 생성하여 Base64로 인코딩된 문자열을 반환합니다.
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(exported);
}

/**
 * 주어진 키(Base64)를 사용하여 데이터를 AES-GCM으로 암호화합니다.
 * @returns 암호화된 Base64 데이터 및 IV(Base64)
 */
export async function encryptData(
  data: string,
  keyBase64: string
): Promise<{ encrypted: string; iv: string }> {
  const rawKey = base64ToBuffer(keyBase64);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // 12바이트 IV 생성
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    encodedData
  );

  return {
    encrypted: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * 주어진 키(Base64)와 IV(Base64)를 사용하여 암호화된 데이터를 복호화합니다.
 */
export async function decryptData(
  encryptedBase64: string,
  ivBase64: string,
  keyBase64: string
): Promise<string> {
  const rawKey = base64ToBuffer(keyBase64);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const encryptedBuffer = base64ToBuffer(encryptedBase64);
  const iv = new Uint8Array(base64ToBuffer(ivBase64));

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    encryptedBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * 비밀번호를 SHA-256 해시값(16진수 문자열)으로 변환합니다.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
