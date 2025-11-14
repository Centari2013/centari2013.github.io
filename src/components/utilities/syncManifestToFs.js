import { whenSystemModuleReady } from './systemModuleReady';

const sanitizeExtension = (value = '') => value.replace(/^\./, '').trim();

const ensureFsSupport = (module) =>
  typeof module?.clear_directory === 'function' &&
  typeof module?.create_directory === 'function' &&
  typeof module?.create_file === 'function';

const createFsEntry = (module, parentPtr, entry) => {
  if (!parentPtr || !entry) {
    return;
  }

  if (entry.type === 'd') {
    const dirPtr = module.create_directory(parentPtr, entry.name ?? 'Folder');
    if (!dirPtr) {
      return;
    }
    module.clear_directory(dirPtr);
    (entry.entries ?? []).forEach((child) => {
      createFsEntry(module, dirPtr, child);
    });
    return;
  }

  const extension = sanitizeExtension(entry.exten ?? entry.extension ?? '');
  const isLink = entry.is_link || entry.contentMode === 'url';
  module.create_file(parentPtr, entry.name ?? 'File', extension, entry.content ?? '', Boolean(entry.is_shortcut), isLink);
};

export const syncManifestToFs = async (manifest) => {
  if (!manifest) {
    return;
  }

  const module = await whenSystemModuleReady();
  if (!ensureFsSupport(module)) {
    console.warn('[syncManifestToFs] SystemModule does not expose filesystem mutators.');
    return;
  }

  const desktopDir = module.get_desktop_dir_ptr?.();
  if (desktopDir) {
    module.clear_directory(desktopDir);
    (manifest.desktop ?? []).forEach((entry) => createFsEntry(module, desktopDir, entry));
  }

  const remoteRootConfig = manifest.remoteRoot;
  if (!remoteRootConfig) {
    return;
  }

  const homeDir = module.get_home_dir_ptr?.();
  if (!homeDir) {
    return;
  }

  const remoteRootDir = module.create_directory(homeDir, remoteRootConfig.name ?? 'Remote Files');
  if (!remoteRootDir) {
    return;
  }

  module.clear_directory(remoteRootDir);
  (remoteRootConfig.entries ?? []).forEach((entry) => createFsEntry(module, remoteRootDir, entry));
};
