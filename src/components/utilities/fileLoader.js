const EXTENSION_MIME_MAP = {
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  json: 'application/json',
  js: 'application/javascript',
  ts: 'application/typescript',
  css: 'text/css',
  html: 'text/html',
  htm: 'text/html',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  webm: 'video/webm'
};

const TEXT_EXTENSIONS = new Set(['txt', 'json', 'js', 'ts', 'css', 'html', 'htm']);
const TEXT_MIME_TYPES = new Set([
  'application/json',
  'application/javascript',
  'application/typescript',
  'text/javascript',
  'text/css',
  'text/html',
  'application/xml',
  'text/xml'
]);

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export function inferMimeType(extension = '') {
  const normalized = extension ? extension.toLowerCase() : '';
  if (!normalized) {
    return 'text/plain';
  }
  return EXTENSION_MIME_MAP[normalized] || 'application/octet-stream';
}

function determineRenderMode(mimeType = '', extension = '') {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedExt = (extension || '').toLowerCase();

  if (normalizedExt === 'md' || normalizedMime === 'text/markdown') {
    return 'markdown';
  }
  if (normalizedMime.startsWith('image/')) {
    return 'image';
  }
  if (normalizedMime.startsWith('audio/')) {
    return 'audio';
  }
  if (normalizedMime.startsWith('video/')) {
    return 'video';
  }
  if (normalizedMime === 'application/pdf' || normalizedExt === 'pdf') {
    return 'pdf';
  }
  if (normalizedMime.startsWith('text/')) {
    return 'text';
  }
  if (TEXT_EXTENSIONS.has(normalizedExt) || TEXT_MIME_TYPES.has(normalizedMime)) {
    return 'text';
  }
  return 'binary';
}

function isTextRenderMode(renderMode) {
  return renderMode === 'text' || renderMode === 'markdown';
}

function detectContentMode(entry = {}) {
  if (entry.contentMode === 'data' || entry.contentMode === 'url') {
    return entry.contentMode;
  }

  const content = entry.content || '';
  if (typeof content === 'string' && content.trim().startsWith('data:')) {
    return 'data';
  }

  if (typeof content === 'string' && /^https?:\/\//i.test(content)) {
    return 'url';
  }

  return 'data';
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function parseDataUri(content) {
  const commaIndex = content.indexOf(',');
  if (commaIndex === -1) {
    return {
      mimeType: inferMimeType(),
      data: content,
      isBase64: false
    };
  }

  const meta = content.slice(5, commaIndex);
  const data = content.slice(commaIndex + 1);
  const parts = meta.split(';').filter(Boolean);
  const mimeType = parts[0] || 'text/plain';
  const isBase64 = parts.includes('base64');
  return { mimeType, data, isBase64 };
}

function decodeTextPayload(data, isBase64) {
  if (isBase64) {
    return textDecoder.decode(base64ToUint8Array(data));
  }
  return decodeURIComponent(data);
}

function decodeBinaryPayload(data, isBase64) {
  if (isBase64) {
    return base64ToUint8Array(data).buffer;
  }
  const decoded = decodeURIComponent(data);
  return textEncoder.encode(decoded).buffer;
}

function loadFromData(entry) {
  const hasContent = entry?.content !== undefined && entry?.content !== null;
  const content = hasContent ? entry.content : '';

  if (typeof content === 'string' && content.startsWith('data:')) {
    const { mimeType, data, isBase64 } = parseDataUri(content);
    const renderMode = determineRenderMode(mimeType, entry?.exten);
    const rawData = isTextRenderMode(renderMode)
      ? decodeTextPayload(data, isBase64)
      : decodeBinaryPayload(data, isBase64);
    return {
      mimeType,
      rawData,
      renderMode
    };
  }

  const mimeType = inferMimeType(entry?.exten);
  const renderMode = determineRenderMode(mimeType, entry?.exten);
  const rawData = isTextRenderMode(renderMode)
    ? content
    : textEncoder.encode(String(content || '')).buffer;
  if (!hasContent && !isTextRenderMode(renderMode)) {
    // Provide an empty ArrayBuffer so downstream renderers don't crash.
    return {
      mimeType,
      rawData: new ArrayBuffer(0),
      renderMode
    };
  }
  return {
    mimeType,
    rawData,
    renderMode
  };
}

async function loadFromUrl(entry) {
  const url = entry?.assetUrl || entry?.asset?.url || entry?.content;
  if (!url) {
    throw new Error(`Missing asset URL for "${entry?.name || 'file'}".`);
  }

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
  }

  const headerMime = response.headers.get('Content-Type');
  const mimeType = headerMime?.split(';')[0]?.trim() || inferMimeType(entry?.exten);
  const renderMode = determineRenderMode(mimeType, entry?.exten);
  const rawData = isTextRenderMode(renderMode) ? await response.text() : await response.arrayBuffer();
  return {
    mimeType,
    rawData,
    renderMode,
    sourceUrl: url
  };
}

export async function loadFileContents(entry) {
  if (!entry) {
    throw new Error('No file entry provided.');
  }

  const mode = detectContentMode(entry);
  if (mode === 'url') {
    return loadFromUrl(entry);
  }

  return loadFromData(entry);
}
