import { registerShortcutManifest, rebuildShortcutPointerIndex } from '@/components/utilities/shortcutMetadata';

function getPublicAssetUrl(filename) {
  const base = import.meta.env?.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${filename}`;
}

async function fetchJson(url, { optional = false } = {}) {
  const response = await fetch(url, { cache: 'no-store' });

  if (optional && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load JSON resource: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchManifestFromUrl(url) {
  return fetchJson(url);
}

function entryPathName(entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  if (entry._type === 'remoteFolder') {
    return entry.name || '';
  }

  if (entry._type === 'portfolioEntry') {
    const extension = typeof entry.extension === 'string' && entry.extension
      ? `.${entry.extension.replace(/^\./, '')}`
      : '';

    return `${entry.name || ''}${extension}`;
  }

  return entry.name || '';
}

function splitPath(path) {
  return String(path || '')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function resolveManifestPath(manifest, path) {
  const segments = splitPath(path);
  let entries = manifest?.filesystem;

  if (!Array.isArray(entries)) {
    return null;
  }

  let entry = null;
  let parentEntries = null;
  let index = -1;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    index = entries.findIndex((candidate) => entryPathName(candidate) === segment);

    if (index < 0) {
      return null;
    }

    entry = entries[index];
    parentEntries = entries;

    if (i < segments.length - 1) {
      if (entry?._type !== 'remoteFolder' || !Array.isArray(entry.entries)) {
        return null;
      }
      entries = entry.entries;
    }
  }

  return { entry, parentEntries, index };
}

function applyManifestOverrides(manifest, overrides) {
  if (!manifest || !Array.isArray(overrides?.operations)) {
    return manifest;
  }

  for (const operation of overrides.operations) {
    if (!operation || typeof operation !== 'object') {
      continue;
    }

    if (operation.op === 'update') {
      const target = resolveManifestPath(manifest, operation.path);
      if (!target?.entry) {
        console.warn('[portfolio overrides] update target not found:', operation.path);
        continue;
      }

      Object.assign(target.entry, operation.changes || {});
      continue;
    }

    if (operation.op === 'remove') {
      const target = resolveManifestPath(manifest, operation.path);
      if (!target?.parentEntries || target.index < 0) {
        console.warn('[portfolio overrides] remove target not found:', operation.path);
        continue;
      }

      target.parentEntries.splice(target.index, 1);
      continue;
    }

    if (operation.op === 'add') {
      const parent = resolveManifestPath(manifest, operation.path);
      if (!parent?.entry || parent.entry._type !== 'remoteFolder') {
        console.warn('[portfolio overrides] add parent not found:', operation.path);
        continue;
      }

      if (!Array.isArray(parent.entry.entries)) {
        parent.entry.entries = [];
      }

      if (operation.entry) {
        parent.entry.entries.push(operation.entry);
      }
    }
  }

  return manifest;
}

async function fetchPortfolioOverrides() {
  return fetchJson(getPublicAssetUrl('portfolioOverrides.json'), { optional: true });
}

export async function initFilesystem(manifestUrl = getPublicAssetUrl('portfolioManifest.json')) {
  const manifest = await fetchManifestFromUrl(manifestUrl);

  const overrides = await fetchPortfolioOverrides();
  applyManifestOverrides(manifest, overrides);

  registerShortcutManifest(manifest);

  if (!window.SystemModule || typeof window.SystemModule.initFilesystem !== 'function') {
    throw new Error('SystemModule.initFilesystem is not available.');
  }

  window.SystemModule.initFilesystem(manifest);
  rebuildShortcutPointerIndex();

  return manifest;
}
