(function() {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  async function getKey() {
    const passphrase = 'extension-encrypt-passphrase';
    const salt = new TextEncoder().encode('extension-salt');
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function fromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function encryptApiKey(plain) {
    if (!plain) return '';
    try {
      const key = await getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
      const combined = new Uint8Array(iv.length + ct.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(ct), iv.length);
      return toBase64(combined);
    } catch (e) {
      return btoa(plain);
    }
  }

  async function decryptApiKey(cipherTextB64) {
    if (!cipherTextB64) return '';
    try {
      const key = await getKey();
      const data = fromBase64(cipherTextB64);
      const iv = data.slice(0, 12);
      const ct = data.slice(12);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      return dec.decode(pt);
    } catch (e) {
      try {
        return atob(cipherTextB64);
      } catch {
        return '';
      }
    }
  }



  // Expose to global for other scripts
  (typeof window !== 'undefined' ? window : self)._extEncryptApiKey = encryptApiKey;
  (typeof window !== 'undefined' ? window : self)._extDecryptApiKey = decryptApiKey;
})();