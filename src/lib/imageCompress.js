// Client-side image compression: resize max 1280px, output WebP/JPEG quality 0.8.
// Returns a new File. Falls back to the original on any error.

const MAX_SIDE = 1280;
const QUALITY = 0.8;

export async function compressImage(file, { maxSide = MAX_SIDE, quality = QUALITY } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  // GIFs and SVGs: skip (would lose animation / vector)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = fitSize(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    // Prefer WebP, fallback to JPEG
    const outType = supportsWebP() ? 'image/webp' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, outType, quality);
    if (!blob) return file;
    if (blob.size >= file.size) return file; // no improvement
    const newName = renameExt(file.name, outType === 'image/webp' ? 'webp' : 'jpg');
    return new File([blob], newName, { type: outType, lastModified: Date.now() });
  } catch (e) {
    console.warn('compressImage failed, using original:', e);
    return file;
  }
}

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function fitSize(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

let _webpCache = null;
function supportsWebP() {
  if (_webpCache !== null) return _webpCache;
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    _webpCache = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch { _webpCache = false; }
  return _webpCache;
}

function renameExt(name, ext) {
  const base = (name || 'image').replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}
