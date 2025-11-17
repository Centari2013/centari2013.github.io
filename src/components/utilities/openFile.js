import { toRaw } from "vue";
import { makeFileItem } from "@/components/utilities/makeFileItems";
import { useAppsStore } from "@/components/stores/apps";
import { resolveDirectoryPointerFromPath } from "@/components/utilities/filesystemMetadata";

const BROWSER_APP_ID = 'browser';
const FILE_MANAGER_APP_ID = 'file_manager';

export function openFile(item) {
  const appsStore = useAppsStore();

  if (item.is_link) {
    if (item.content) {
      appsStore.openApp(BROWSER_APP_ID, { url: item.content });
    } else {
      console.warn('Attempted to open link file without content.', item);
    }
    return;
  }

  if (item.is_shortcut) {
    if (item.shortcutTargetsDirectory && item.shortcutTargetPath) {
      const targetDirectory = resolveDirectoryPointerFromPath(item.shortcutTargetPath);
      if (targetDirectory) {
        appsStore.openApp(FILE_MANAGER_APP_ID, { directoryPtr: targetDirectory });
      } else {
        alert("Shortcut target directory could not be found.");
      }
      return;
    }

    const target = SystemModule.resolve_shortcut(toRaw(item.object));
    if (target) {
      appsStore.openFile(makeFileItem(target));
    } else {
      alert("Shortcut target is missing or broken.");
    }
  } else {
    appsStore.openFile(item);
  }
}
