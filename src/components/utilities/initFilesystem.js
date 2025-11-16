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

export async function initFilesystem(manifestUrl) {
  const manifest = await (manifestUrl ? fetchManifestFromUrl(manifestUrl) : fetchManifestFromSanity());

  if (!window.SystemModule || typeof window.SystemModule.initFilesystem !== 'function') {
    throw new Error('SystemModule.initFilesystem is not available.');
  }

  window.SystemModule.initFilesystem(manifest);
  return manifest;
}
