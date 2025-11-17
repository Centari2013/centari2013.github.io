const manifestFileEntriesByPath = new Map();
const directoryPathToPtr = new Map();
const directoryPtrToPath = new Map();
const filePtrMetadata = new Map();

let homeDirectoryPath = null;

function getPointerId(node) {
  return node?.$$?.ptr ?? null;
}

function normalizePathSegment(segment) {
  if (!segment) {
    return '';
  }
  return segment.replace(/^\/+|\/+$/g, '');
}

function joinPaths(base, segment) {
  const cleanSegment = normalizePathSegment(segment);
  if (!base || base === '/') {
    return cleanSegment ? `/${cleanSegment}` : '/';
  }
  return cleanSegment ? `${base}/${cleanSegment}` : base;
}

function buildFileNameFromManifest(entry) {
  if (!entry) {
    return '';
  }
  const extension = normalizePathSegment(entry.extension);
  return extension ? `${entry.name}.${extension}` : entry.name;
}

function buildFileNameFromRuntime(file) {
  if (!file) {
    return '';
  }
  const extension = normalizePathSegment(file.extension_abbr);
  return extension ? `${file.name}.${extension}` : file.name;
}

function collectManifestEntries(entries, currentPath) {
  if (!Array.isArray(entries)) {
    return;
  }

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    if (entry._type === 'remoteFolder') {
      const nextPath = joinPaths(currentPath, entry.name);
      collectManifestEntries(entry.entries, nextPath);
    } else if (entry._type === 'portfolioEntry') {
      const fileName = buildFileNameFromManifest(entry);
      const filePath = joinPaths(currentPath, fileName);
      manifestFileEntriesByPath.set(filePath, entry);
    }
  }
}

export function primeFilesystemMetadataFromManifest(manifest) {
  manifestFileEntriesByPath.clear();
  if (!manifest || typeof manifest !== 'object') {
    return;
  }

  collectManifestEntries(manifest.filesystem, '/');
}

function storeDirectoryInfo(dirPtr, path) {
  const dirId = getPointerId(dirPtr);
  if (dirId == null) {
    return;
  }
  directoryPtrToPath.set(dirId, path);
  directoryPathToPtr.set(path, dirPtr);
}

function traverseDirectory(dirPtr, currentPath) {
  if (!dirPtr || !globalThis.SystemModule) {
    return;
  }

  const path = currentPath || '/';
  storeDirectoryInfo(dirPtr, path);

  const files = globalThis.SystemModule.list_files(dirPtr);
  if (files && typeof files.size === 'function') {
    for (let i = 0; i < files.size(); i += 1) {
      const file = files.get(i);
      const ptrId = getPointerId(file);
      if (ptrId == null) {
        continue;
      }
      const fileName = buildFileNameFromRuntime(file);
      const filePath = joinPaths(path, fileName);
      filePtrMetadata.set(ptrId, {
        path: filePath,
        manifest: manifestFileEntriesByPath.get(filePath) || null,
      });
    }
  }

  const subdirs = globalThis.SystemModule.list_directories(dirPtr);
  if (subdirs && typeof subdirs.size === 'function') {
    for (let i = 0; i < subdirs.size(); i += 1) {
      const child = subdirs.get(i);
      const childPath = joinPaths(path, child?.name);
      traverseDirectory(child, childPath);
    }
  }
}

export function rebuildFilesystemMetadataSnapshot() {
  filePtrMetadata.clear();
  directoryPathToPtr.clear();
  directoryPtrToPath.clear();
  homeDirectoryPath = null;

  if (!globalThis.SystemModule || typeof globalThis.SystemModule.get_root_dir_ptr !== 'function') {
    return;
  }

  const root = globalThis.SystemModule.get_root_dir_ptr();
  traverseDirectory(root, '/');

  if (typeof globalThis.SystemModule.get_home_dir_ptr === 'function') {
    const homePtr = globalThis.SystemModule.get_home_dir_ptr();
    const homeId = getPointerId(homePtr);
    if (homeId != null) {
      homeDirectoryPath = directoryPtrToPath.get(homeId) || null;
    }
  }
}

export function getFileManifestEntry(file) {
  const id = getPointerId(file);
  return id == null ? null : filePtrMetadata.get(id)?.manifest || null;
}

export function shortcutTargetsDirectory(file) {
  const entry = getFileManifestEntry(file);
  if (!entry) {
    return false;
  }
  const type = (entry.shortcutTargetType || entry.shortcut_target_type || '').toLowerCase();
  return type === 'directory' || type === 'dir';
}

export function getShortcutTargetPath(file) {
  const entry = getFileManifestEntry(file);
  return entry?.shortcutTargetPath || entry?.shortcut_target_path || null;
}

function normalizeAbsolutePath(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  let value = path.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith('~')) {
    if (!homeDirectoryPath) {
      return null;
    }
    value = `${homeDirectoryPath}${value.slice(1)}`;
  }

  if (!value.startsWith('/')) {
    value = `/${value.replace(/^\/+/, '')}`;
  }

  value = value.replace(/\/+/, '/');
  if (value.length > 1 && value.endsWith('/')) {
    value = value.slice(0, -1);
  }

  return value;
}

export function resolveDirectoryPointerFromPath(path) {
  const normalized = normalizeAbsolutePath(path);
  if (!normalized) {
    return null;
  }
  return directoryPathToPtr.get(normalized) || null;
}

export function getDirectoryPathFromPointer(ptr) {
  const id = getPointerId(ptr);
  return id == null ? null : directoryPtrToPath.get(id) || null;
}
