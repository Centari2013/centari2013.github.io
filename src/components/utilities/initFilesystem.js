import { registerShortcutManifest, rebuildShortcutPointerIndex } from '@/components/utilities/shortcutMetadata';

const MANIFEST_QUERY = '*[_type == "portfolioManifest"][0]';

function requireEnv(name) {
  const value = import.meta.env?.[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

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

async function fetchManifestFromSanity() {
  const projectId = requireEnv('VITE_SANITY_PROJECT_ID');
  const dataset = requireEnv('VITE_SANITY_DATASET');
  const apiVersion = requireEnv('VITE_SANITY_API_VERSION');

  const encodedQuery = encodeURIComponent(MANIFEST_QUERY);
  const url = `https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}?query=${encodedQuery}`;
  const payload = await fetchJson(url);

  if (!payload.result) {
    throw new Error('Sanity manifest query returned no results.');
  }

  return payload.result;
}

async function fetchManifestFromUrl(url) {
  return fetchJson(url);
}

function buildSanityAssetUrl(ref, projectId, dataset) {
  if (!ref || !projectId || !dataset) {
    return null;
  }

  const fileMatch = /^file-([^-]+)-([a-zA-Z0-9]+)$/.exec(ref);
  if (fileMatch) {
    const [, hash, extension] = fileMatch;
    return `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.${extension}`;
  }

  const imageMatch = /^image-([^-]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(ref);
  if (imageMatch) {
    const [, hash, dimensions, extension] = imageMatch;
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dimensions}.${extension}`;
  }

  console.warn('Unrecognized Sanity asset ref. Unable to build CDN URL.', ref);
  return null;
}

function hydrateEntries(entries, buildUrl) {
  if (!Array.isArray(entries)) {
    return;
  }

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    if (entry._type === 'portfolioEntry') {
      const asset = entry.asset;
      if (asset?.asset?._ref && !asset.url) {
        const assetUrl = buildUrl(asset.asset._ref);
        if (assetUrl) {
          asset.url = assetUrl;
          entry.assetUrl = assetUrl;
          if (!entry.content) {
            entry.content = assetUrl;
            entry.contentMode = 'url';
          }
        }
      }
    }

    if (Array.isArray(entry.entries)) {
      hydrateEntries(entry.entries, buildUrl);
    }
  }
}

function hydrateManifestAssets(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return manifest;
  }

  const projectId = requireEnv('VITE_SANITY_PROJECT_ID');
  const dataset = requireEnv('VITE_SANITY_DATASET');
  const buildUrl = (ref) => buildSanityAssetUrl(ref, projectId, dataset);

  hydrateEntries(manifest.desktop, buildUrl);
  hydrateEntries(manifest.filesystem, buildUrl);

  return manifest;
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

export async function initFilesystem(manifestUrl) {
  const manifest = await (manifestUrl ? fetchManifestFromUrl(manifestUrl) : fetchManifestFromSanity());

  hydrateManifestAssets(manifest);

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
