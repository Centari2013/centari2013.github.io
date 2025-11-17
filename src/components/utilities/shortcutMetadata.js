const manifestShortcutMap = new Map();
const pointerShortcutMap = new Map();

function sanitizeSegment(segment = '') {
  if (typeof segment !== 'string') {
    return '';
  }
  return segment.trim().replace(/^\/+|\/+$/g, '');
}

function buildChildPath(parentPath, childName) {
  const child = sanitizeSegment(childName);
  const parentIsRoot = !parentPath || parentPath === '/';
  if (!child) {
    return parentIsRoot ? '/' : parentPath;
  }
  if (parentIsRoot) {
    return `/${child}`;
  }
  const parent = parentPath.replace(/\/+$/, '');
  return `${parent}/${child}`;
}

function buildFilePath(parentPath, entry) {
  const extension = typeof entry?.extension === 'string' && entry.extension.length
    ? entry.extension.replace(/^\./, '')
    : '';
  const fileName = extension ? `${entry.name}.${extension}` : entry.name;
  return buildChildPath(parentPath, fileName);
}

function walkManifestEntries(entries, parentPath) {
  if (!Array.isArray(entries)) {
    return;
  }

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    if (entry._type === 'portfolioEntry') {
      if (entry.kind === 'shortcut') {
        const shortcutPath = buildFilePath(parentPath, entry);
        manifestShortcutMap.set(shortcutPath, {
          targetPath: entry.shortcutTargetPath || entry.shortcut_target_path || null,
          targetType: (entry.shortcutTargetType || entry.shortcut_target_type || 'file').toLowerCase(),
        });
      }
      continue;
    }

    if (entry._type === 'remoteFolder') {
      const nextPath = buildChildPath(parentPath, entry.name || '');
      walkManifestEntries(entry.entries, nextPath);
    }
  }
}

export function registerShortcutManifest(manifest) {
  manifestShortcutMap.clear();
  pointerShortcutMap.clear();

  if (!manifest || typeof manifest !== 'object') {
    return;
  }

  walkManifestEntries(manifest.filesystem, '/');
}

function buildFileName(file) {
  const extension = typeof file?.extension_abbr === 'string' && file.extension_abbr.length
    ? `.${file.extension_abbr}`
    : '';
  return `${file?.name ?? ''}${extension}`;
}

function traverseFilesystem(moduleRef, dirPtr, currentPath) {
  const files = moduleRef.list_files(dirPtr);
  if (files && typeof files.size === 'function') {
    for (let i = 0; i < files.size(); i++) {
      const file = files.get(i);
      if (!file) continue;
      const filePath = buildChildPath(currentPath, buildFileName(file));
      const metadata = manifestShortcutMap.get(filePath);
      if (metadata) {
        const ptr = file?.$$?.ptr;
        if (ptr) {
          pointerShortcutMap.set(ptr, metadata);
        }
      }
    }
  }

  const directories = moduleRef.list_directories(dirPtr);
  if (directories && typeof directories.size === 'function') {
    for (let i = 0; i < directories.size(); i++) {
      const child = directories.get(i);
      if (!child) continue;
      const childPath = buildChildPath(currentPath, child.name || '');
      traverseFilesystem(moduleRef, child, childPath);
    }
  }
}

export function rebuildShortcutPointerIndex(moduleRef = window.SystemModule) {
  pointerShortcutMap.clear();
  if (!moduleRef || typeof moduleRef.get_root_dir_ptr !== 'function') {
    return;
  }

  const root = moduleRef.get_root_dir_ptr();
  if (!root) {
    return;
  }

  traverseFilesystem(moduleRef, root, '/');
}

export function getShortcutMetadataForFile(file) {
  const ptr = file?.$$?.ptr;
  if (!ptr) {
    return null;
  }
  return pointerShortcutMap.get(ptr) || null;
}

function splitPathSegments(path) {
  if (typeof path !== 'string') {
    return [];
  }
  return path.split('/').filter(Boolean);
}

export function findDirectoryByPath(path, moduleRef = window.SystemModule) {
  if (!moduleRef || typeof path !== 'string') {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  let current = null;
  let segments = splitPathSegments(trimmed);

  if (trimmed.startsWith('~/')) {
    current = moduleRef.get_home_dir_ptr?.();
    segments = segments.slice(1);
  } else if (trimmed === '~') {
    current = moduleRef.get_home_dir_ptr?.();
    segments = [];
  } else if (trimmed.startsWith('/')) {
    current = moduleRef.get_root_dir_ptr?.();
  } else {
    current = moduleRef.get_root_dir_ptr?.();
  }

  if (!current) {
    return null;
  }

  for (const segment of segments) {
    if (!segment) {
      continue;
    }

    const directories = moduleRef.list_directories(current);
    let match = null;
    if (directories && typeof directories.size === 'function') {
      for (let i = 0; i < directories.size(); i++) {
        const child = directories.get(i);
        if (child?.name === segment) {
          match = child;
          break;
        }
      }
    }

    if (!match) {
      return null;
    }
    current = match;
  }

  return current;
}
