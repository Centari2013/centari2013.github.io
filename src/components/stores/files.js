import { defineStore } from 'pinia';
import { syncManifestToFs } from '@/components/utilities/syncManifestToFs';

const defaultManifestUrl = import.meta.env.VITE_MANIFEST_URL ?? '/portfolio-manifest.json';

const sanityConfig = {
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET ?? 'production',
  apiVersion: import.meta.env.VITE_SANITY_API_VERSION ?? 'v2021-10-21',
  query:
    import.meta.env.VITE_SANITY_QUERY ??
    `*[_type == "portfolioManifest"][0]{
      root,
      desktop[]{
        "id": coalesce(id, _key),
        name,
        extension,
        kind,
        content,
        contentMode,
        launch,
        viewer,
        url,
        fileUrl,
        href,
        assetUrl,
        "asset": asset->{url},
        "assetFileUrl": asset.asset->url,
        tags,
        meta
      },
      folders[]{
        "id": coalesce(id, _key),
        name,
        entries[]{
          ...,
          "id": coalesce(id, _key)
        }
      }
    }`,
  token: import.meta.env.VITE_SANITY_TOKEN,
  params: import.meta.env.VITE_SANITY_QUERY_PARAMS,
};

const hasSanityConfig = Boolean(sanityConfig.projectId && sanityConfig.dataset);

const parseSanityParams = () => {
  if (!sanityConfig.params) {
    return null;
  }
  try {
    return JSON.parse(sanityConfig.params);
  } catch (error) {
    console.warn('[filesStore] Unable to parse VITE_SANITY_QUERY_PARAMS', error);
    return null;
  }
};

const fetchSanityManifest = async () => {
  const { projectId, dataset, apiVersion, query, token } = sanityConfig;
  const params = parseSanityParams();
  const encodedQuery = encodeURIComponent(query.trim());
  const encodedParams = params ? `&${new URLSearchParams(Object.entries(params)).toString()}` : '';
  const endpoint = `https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}?query=${encodedQuery}${encodedParams}`;

  const response = await fetch(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Sanity query failed (HTTP ${response.status})`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error(payload.error.description ?? 'Sanity query returned an error');
  }

  if (!payload.result) {
    throw new Error('Sanity response did not include a result');
  }

  if (Array.isArray(payload.result)) {
    return payload.result[0] ?? {};
  }

  return payload.result;
};

const fetchManifestFromUrl = async (targetUrl) => {
  const response = await fetch(targetUrl, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Unable to load manifest (HTTP ${response.status})`);
  }
  return response.json();
};

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

const isNullOrWhitespace = (value) => {
  if (value == null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
};

const coalesceContentValue = (...values) => {
  for (const candidate of values) {
    if (isNullOrWhitespace(candidate)) {
      continue;
    }
    return candidate;
  }
  return '';
};

const normalizeFileEntry = (entry = {}, parentSegments = []) => {
  const safeName = entry.name ?? entry.label ?? 'Untitled';
  const id = entry.id ?? slugify([...parentSegments, safeName].join('-')) ?? randomId();
  const explicitModeRaw = entry.contentMode ?? entry.content_mode ?? entry.mode;
  const explicitMode =
    typeof explicitModeRaw === 'string' && explicitModeRaw.trim().length > 0 ? explicitModeRaw.trim() : null;
  const launchMode = entry.launch ?? entry.viewer;
  const content = coalesceContentValue(
    entry.content,
    entry.url,
    entry.fileUrl,
    entry.href,
    entry.assetUrl,
    entry.assetFileUrl,
    entry.asset?.url,
    entry.asset?.asset?.url,
  );
  const resolvedContentMode =
    explicitMode ??
    (/^https?:\/\//i.test(content) ? 'url' : 'data');

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

const shouldNormalizeAsFolder = (entry) => {
  if (!entry) {
    return false;
  }
  if (Array.isArray(entry.entries)) {
    return true;
  }
  const kind = typeof entry.kind === 'string' ? entry.kind.toLowerCase() : null;
  const type = typeof entry.type === 'string' ? entry.type.toLowerCase() : null;
  return kind === 'folder' || type === 'd';
};

const KNOWN_SYSTEM_ROLES = new Set([
  'bin',
  'custom',
  'desktop',
  'documents',
  'downloads',
  'etc',
  'home',
  'pictures',
  'sbin',
  'tmp',
  'usr',
  'usr/bin',
  'usr/sbin',
  'users',
  'var',
]);

const detectFolderRole = (folder = {}) => {
  const rawRole = folder.role ?? folder.systemRole;
  if (typeof rawRole === 'string') {
    const normalized = rawRole.trim().toLowerCase();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  const derivedName = typeof folder.name === 'string' ? folder.name.trim().toLowerCase() : '';
  if (KNOWN_SYSTEM_ROLES.has(derivedName)) {
    return derivedName;
  }

  return null;
};

const normalizeFolder = (folder = {}, parentSegments = []) => {
  const folderName = folder.name ?? 'Folder';
  const id = folder.id ?? slugify([...parentSegments, folderName].join('-')) ?? randomId();
  const nextSegments = [...parentSegments, folderName];
  const role = detectFolderRole(folder);
  const entries = Array.isArray(folder.entries)
    ? folder.entries.map((entry) =>
        shouldNormalizeAsFolder(entry)
          ? normalizeFolder(entry, nextSegments)
          : normalizeFileEntry(entry, nextSegments),
      )
    : [];

  return {
    id,
    type: 'd',
    name: folderName,
    source: 'manifest',
    role,
    entries,
  };
};

const normalizeManifest = (payload = {}) => {
  const rootConfig = payload.root ?? {};
  const rootName = rootConfig.name ?? 'Filesystem';
  const filesystemEntries = Array.isArray(payload.filesystem)
    ? payload.filesystem.map((folder) => normalizeFolder(folder, [rootName]))
    : [];
  const desktopEntries = Array.isArray(payload.desktop)
    ? payload.desktop.map((entry) => normalizeFileEntry(entry, ['desktop']))
    : [];

  return {
    desktop: desktopEntries,
    filesystem: filesystemEntries,
    remoteRoot: {
      id: rootConfig.id ?? 'remote-root',
      name: rootName,
      type: 'd',
      source: 'manifest',
      entries: filesystemEntries,
    },
  };
};

export const useFilesStore = defineStore('files', {
  state: () => ({
    status: 'idle',
    error: null,
    manifest: null,
    manifestUrl: defaultManifestUrl,
    fsSyncVersion: 0,
    remoteRootDir: null,
  }),
  getters: {
    desktopManifestItems: (state) => state.manifest?.desktop ?? [],
    hasManifest: (state) => Boolean(state.manifest),
    remoteRootName: (state) => state.manifest?.remoteRoot?.name ?? 'Remote Files',
    remoteRootDirPtr: (state) => state.remoteRootDir,
  },
  actions: {
    async loadManifest(url) {
      const targetUrl = url ?? this.manifestUrl ?? defaultManifestUrl;
      const sourceKey = hasSanityConfig ? 'sanity' : targetUrl;

      if (this.status === 'loading' && sourceKey === this.manifestUrl) {
        return;
      }

      if (this.status === 'ready' && this.manifest && sourceKey === this.manifestUrl) {
        return;
      }

      this.status = 'loading';
      this.error = null;

      try {
        const payload = hasSanityConfig
          ? await fetchSanityManifest()
          : await fetchManifestFromUrl(targetUrl);

        this.manifestUrl = sourceKey;
        this.manifest = normalizeManifest(payload);
        const syncResult = await syncManifestToFs(this.manifest);
        this.remoteRootDir = syncResult?.remoteRootDir ?? null;
        this.fsSyncVersion += 1;
        this.status = 'ready';
      } catch (error) {
        console.error('[filesStore] Failed to load manifest', error);
        this.error = error instanceof Error ? error.message : 'Unknown manifest error';
        this.status = 'error';
        this.manifest = null;
        this.remoteRootDir = null;
      }
    },
  },
});

