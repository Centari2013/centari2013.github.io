import { whenSystemModuleReady } from './systemModuleReady';

const ensureFsSupport = (module) => typeof module?.build_fs_from_manifest === 'function';

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

  module.build_fs_from_manifest(filesystemTree);
  result.remoteRootDir = module.get_root_dir_ptr?.() ?? null;
  return result;
};
