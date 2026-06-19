// pdfjs-dist 6.x relies on a batch of very recent TC39 proposals
// (Uint8Array hex/base64, Map/WeakMap getOrInsertComputed) that Chrome's
// stable channel still doesn't ship. Polyfill them so rendering doesn't
// break on mainstream Chrome while still using the native implementation
// once browsers catch up.
export function applyPdfJsCompatPolyfills() {
  const u8proto = Uint8Array.prototype as unknown as Record<string, unknown>;
  const u8ctor = Uint8Array as unknown as Record<string, unknown>;

  if (typeof u8proto.toHex !== "function") {
    u8proto.toHex = function (this: Uint8Array) {
      return Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("");
    };
  }

  if (typeof u8ctor.fromHex !== "function") {
    u8ctor.fromHex = function (hex: string) {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    };
  }

  if (typeof u8proto.toBase64 !== "function") {
    u8proto.toBase64 = function (this: Uint8Array) {
      let binary = "";
      for (let i = 0; i < this.length; i++) binary += String.fromCharCode(this[i]);
      return btoa(binary);
    };
  }

  if (typeof u8ctor.fromBase64 !== "function") {
    u8ctor.fromBase64 = function (base64: string) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    };
  }

  for (const ctor of [Map, WeakMap] as const) {
    const proto = ctor.prototype as unknown as Record<string, unknown>;

    if (typeof proto.getOrInsert !== "function") {
      proto.getOrInsert = function (this: Map<unknown, unknown>, key: unknown, value: unknown) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      };
    }

    if (typeof proto.getOrInsertComputed !== "function") {
      proto.getOrInsertComputed = function (
        this: Map<unknown, unknown>,
        key: unknown,
        callbackfn: (key: unknown) => unknown
      ) {
        if (!this.has(key)) this.set(key, callbackfn(key));
        return this.get(key);
      };
    }
  }
}
