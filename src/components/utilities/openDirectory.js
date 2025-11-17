import { toRaw } from 'vue';
import { useAppsStore } from '@/components/stores/apps';

const FILE_MANAGER_APP_ID = 'file_manager';

export function openDirectoryInFileManager(directoryPtr, options = {}) {
  const appsStore = useAppsStore();
  const normalizedPtr = directoryPtr ? toRaw(directoryPtr) : null;
  const requestId = Date.now();

  appsStore.openApp(FILE_MANAGER_APP_ID, {
    targetDirectory: normalizedPtr,
    targetPath: options.path ?? null,
    requestId,
  });
}
