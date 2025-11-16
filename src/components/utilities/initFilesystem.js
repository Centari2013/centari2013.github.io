const MANIFEST_QUERY = '*[_type == "portfolioManifest"][0]';

function requireEnv(name) {
  const value = import.meta.env?.[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load filesystem manifest: ${response.status} ${response.statusText}`);
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
      console.log('Entry asset before hydration:', asset);
      console.log('Checking entry for asset hydration:', entry);
      if (asset && asset.asset._ref && !asset.url) {
        console.log('Hydrating asset:', asset);
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

export async function initFilesystem(manifestUrl) {
  const manifest = await (manifestUrl ? fetchManifestFromUrl(manifestUrl) : fetchManifestFromSanity());
  hydrateManifestAssets(manifest);

  if (!window.SystemModule || typeof window.SystemModule.initFilesystem !== 'function') {
    throw new Error('SystemModule.initFilesystem is not available.');
  }

  window.SystemModule.initFilesystem(manifest);
  return manifest;
}
