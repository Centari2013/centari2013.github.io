import { toRaw } from "vue";
import { makeFileItem } from "@/components/utilities/makeFileItems";
import { useAppsStore } from "@/components/stores/apps";
import { openDirectoryInFileManager } from "@/components/utilities/openDirectory";

const BROWSER_APP_ID = 'browser';
const HTML_EXTENSIONS = new Set(['html', 'htm']);

function openInBrowser(item) {
  const appsStore = useAppsStore();
  let url = item.assetUrl || (item.contentMode === 'url' ? item.content : null);
  if (!url && item.content) {
    const blob = new Blob([item.content], { type: 'text/html' });
    url = URL.createObjectURL(blob);
  }
  if (url) {
    appsStore.openApp(BROWSER_APP_ID, { url });
  } else {
    console.warn('Attempted to open HTML file without content.', item);
  }
}

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
    if (item.shortcutTargetsDirectory) {
      if (item.shortcutTargetPath) {
        openDirectoryInFileManager(null, { path: item.shortcutTargetPath });
      } else {
        alert("Shortcut target directory is missing or broken.");
      }
      return;
    }
    const target = SystemModule.resolve_shortcut(toRaw(item.object));
    if (target) {
      const resolvedItem = makeFileItem(target);
      if (HTML_EXTENSIONS.has(resolvedItem.exten?.toLowerCase())) {
        openInBrowser(resolvedItem);
      } else {
        appsStore.openFile(resolvedItem);
      }
    } else {
      alert("Shortcut target is missing or broken.");
    }
  } else if (HTML_EXTENSIONS.has(item.exten?.toLowerCase())) {
    openInBrowser(item);
  } else {
    appsStore.openFile(item);
  }
}
