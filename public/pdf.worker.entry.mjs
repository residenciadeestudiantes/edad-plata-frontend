// pdfjs-dist 6.x calls the TC39 Uint8Array hex/base64 methods (Chrome 137+, 2025)
// from inside the worker too, so the polyfill must run in this global scope as well.
if (typeof Uint8Array.prototype.toHex !== "function") {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this, (b) => b.toString(16).padStart(2, "0")).join("");
  };
}

if (typeof Uint8Array.fromHex !== "function") {
  Uint8Array.fromHex = function (hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  };
}

if (typeof Uint8Array.prototype.toBase64 !== "function") {
  Uint8Array.prototype.toBase64 = function () {
    let binary = "";
    for (let i = 0; i < this.length; i++) binary += String.fromCharCode(this[i]);
    return btoa(binary);
  };
}

if (typeof Uint8Array.fromBase64 !== "function") {
  Uint8Array.fromBase64 = function (base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };
}

for (const ctor of [Map, WeakMap]) {
  if (typeof ctor.prototype.getOrInsert !== "function") {
    ctor.prototype.getOrInsert = function (key, value) {
      if (!this.has(key)) this.set(key, value);
      return this.get(key);
    };
  }

  if (typeof ctor.prototype.getOrInsertComputed !== "function") {
    ctor.prototype.getOrInsertComputed = function (key, callbackfn) {
      if (!this.has(key)) this.set(key, callbackfn(key));
      return this.get(key);
    };
  }
}

import "./pdf.worker.min.mjs";
