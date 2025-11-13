import { defineStore } from 'pinia';

const defaultManifestUrl = import.meta.env.VITE_MANIFEST_URL ?? '/portfolio-manifest.json';

const randomId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

const normalizeFileEntry = (entry = {}, parentSegments = []) => {
  const safeName = entry.name ?? entry.label ?? 'Untitled';
  const id = entry.id ?? slugify([...parentSegments, safeName].join('-')) ?? randomId();
  const contentMode = entry.contentMode ?? entry.content_mode ?? entry.mode ?? (entry.url ? 'url' : 'data');
  const launchMode = entry.launch ?? entry.viewer;
  const content = entry.content ?? entry.url ?? '';
  const resolvedContentMode = contentMode === 'data' && /^https?:\/\//i.test(content)
    ? 'url'
    : contentMode;

  return {
    id,
    type: 'f',
    name: safeName,
    exten: entry.extension ?? entry.ext ?? '',
    content,
    contentMode: resolvedContentMode,
    is_shortcut: entry.kind === 'shortcut',
    is_link: entry.kind === 'link' || launchMode === 'browser',
    source: 'manifest',
    tags: entry.tags ?? [],
    meta: entry.meta ?? {},
  };
};

const normalizeFolder = (folder = {}, parentSegments = []) => {
  const folderName = folder.name ?? 'Folder';
  const id = folder.id ?? slugify([...parentSegments, folderName].join('-')) ?? randomId();
  const nextSegments = [...parentSegments, folderName];
  const entries = Array.isArray(folder.entries)
    ? folder.entries.map((entry) =>
        entry.entries || entry.kind === 'folder'
          ? normalizeFolder(entry, nextSegments)
          : normalizeFileEntry(entry, nextSegments),
      )
    : [];

  return {
    id,
    type: 'd',
    name: folderName,
    source: 'manifest',
    entries,
  };
};

const normalizeManifest = (payload = {}) => {
  const rootConfig = payload.root ?? {};
  const desktopEntries = Array.isArray(payload.desktop)
    ? payload.desktop.map((entry) => normalizeFileEntry(entry, ['desktop']))
    : [];

  const remoteFolders = Array.isArray(payload.folders)
    ? payload.folders.map((folder) => normalizeFolder(folder, [rootConfig.name ?? 'remote']))
    : [];

  return {
    desktop: desktopEntries,
    remoteRoot: {
      id: rootConfig.id ?? 'remote-root',
      name: rootConfig.name ?? 'Remote Files',
      type: 'd',
      source: 'manifest',
      entries: remoteFolders,
    },
  };
};

export const useFilesStore = defineStore('files', {
  state: () => ({
    status: 'idle',
    error: null,
    manifest: null,
    manifestUrl: defaultManifestUrl,
  }),
  getters: {
    desktopManifestItems: (state) => state.manifest?.desktop ?? [],
    remoteRootFolder: (state) => state.manifest?.remoteRoot ?? null,
    hasManifest: (state) => Boolean(state.manifest),
    remoteRootName: (state) => state.manifest?.remoteRoot?.name ?? 'Remote Files',
  },
  actions: {
    async loadManifest(url) {
      const targetUrl = url ?? this.manifestUrl ?? defaultManifestUrl;
      if (this.status === 'loading' && targetUrl === this.manifestUrl) {
        return;
      }

      if (this.status === 'ready' && this.manifest && targetUrl === this.manifestUrl) {
        return;
      }

      this.status = 'loading';
      this.error = null;

      try {
        const response = await fetch(targetUrl, { cache: 'no-cache' });
        if (!response.ok) {
          throw new Error(`Unable to load manifest (HTTP ${response.status})`);
        }
        const payload = await response.json();
        this.manifestUrl = targetUrl;
        this.manifest = normalizeManifest(payload);
        this.status = 'ready';
      } catch (error) {
        console.error('[filesStore] Failed to load manifest', error);
        this.error = error instanceof Error ? error.message : 'Unknown manifest error';
        this.status = 'error';
        this.manifest = null;
      }
    },
  },
});

