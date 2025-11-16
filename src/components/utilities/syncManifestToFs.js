import { isProxy, toRaw } from 'vue';
import { whenSystemModuleReady } from './systemModuleReady';

const unwrapProxies = (value, seen = new WeakMap()) => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  const source = isProxy(value) ? toRaw(value) : value;

  if (seen.has(source)) {
    return seen.get(source);
  }

  if (Array.isArray(source)) {
    const result = [];
    seen.set(source, result);
    for (const entry of source) {
      result.push(unwrapProxies(entry, seen));
    }
    return result;
  }

  const result = {};
  seen.set(source, result);
  for (const [key, entry] of Object.entries(source)) {
    result[key] = unwrapProxies(entry, seen);
  }
  return result;
};

const ensureFsSupport = (module) => typeof module?.build_fs_from_manifest === 'function';

const cloneManifestEntries = (entries) => {
  if (!entries) {
    return null;
  }

  const plainEntries = unwrapProxies(entries);

  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(plainEntries);
    } catch (error) {
      console.warn('[syncManifestToFs] structuredClone failed, falling back to JSON copy.', error);
    }
  }

  try {
    return JSON.parse(JSON.stringify(plainEntries));
  } catch (error) {
    console.error('[syncManifestToFs] Unable to serialize manifest entries for SystemModule.', error);
    return null;
  }
};

const collectionSize = (value) => {
  if (!value) {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value.size === 'function') {
    try {
      return value.size();
    } catch (error) {
      console.warn('[syncManifestToFs] Unable to read collection size.', error);
      return 0;
    }
  }
  if (typeof value.length === 'number') {
    return value.length;
  }
  return 0;
};

const summarizeRootContents = (module, rootDir) => {
  if (!rootDir || typeof module?.list_directories !== 'function' || typeof module?.list_files !== 'function') {
    return null;
  }
  try {
    const directories = module.list_directories(rootDir) ?? [];
    const files = module.list_files(rootDir) ?? [];
    return {
      directoryCount: collectionSize(directories),
      fileCount: collectionSize(files),
    };
  } catch (error) {
    console.warn('[syncManifestToFs] Unable to inspect SystemModule root contents.', error);
    return null;
  }
};

export const syncManifestToFs = async (manifest) => {
  const result = { remoteRootDir: null };
  const filesystemTree = manifest?.filesystem;

  if (!Array.isArray(filesystemTree)) {
    return result;
  }

  const module = await whenSystemModuleReady();
  if (!ensureFsSupport(module)) {
    console.warn('[syncManifestToFs] SystemModule does not expose manifest hydration support.');
    return result;
  }

  const payload = cloneManifestEntries(filesystemTree);
  if (!payload) {
    console.error('[syncManifestToFs] Skipping manifest hydration due to serialization failure.');
    return result;
  }

  try {
    module.build_fs_from_manifest(payload);
  } catch (error) {
    console.error('[syncManifestToFs] SystemModule rejected manifest hydration.', error);
    return result;
  }

  result.remoteRootDir = module.get_root_dir_ptr?.() ?? null;

  const rootDir = module.get_root_dir_ptr?.();
  const summary = summarizeRootContents(module, rootDir);
  if (summary) {
    if (filesystemTree.length > 0 && summary.directoryCount === 0 && summary.fileCount === 0) {
      console.warn(
        `[syncManifestToFs] Manifest contained ${filesystemTree.length} root folders but SystemModule root is empty after hydration. ` +
          'Verify the wasm build exports build_fs_from_manifest and that the manifest shape matches the native schema.',
      );
    } else {
      console.info(
        `[syncManifestToFs] Hydrated manifest into SystemModule. Root folders: ${summary.directoryCount}. Root files: ${summary.fileCount}.`,
      );
    }
  }

  return result;
};
