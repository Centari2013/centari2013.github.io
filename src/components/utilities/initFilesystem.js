export async function initFilesystem(manifestUrl = '/portfolioManifest.json') {
  const response = await fetch(manifestUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load filesystem manifest: ${response.status} ${response.statusText}`);
  }

  const manifest = await response.json();
  if (!window.SystemModule || typeof window.SystemModule.initFilesystem !== 'function') {
    throw new Error('SystemModule.initFilesystem is not available.');
  }

  window.SystemModule.initFilesystem(manifest);
  return manifest;
}
