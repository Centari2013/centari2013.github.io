import { toRaw } from "vue";
import { makeFileItem } from "@/components/utilities/makeFileItems";
import { useAppsStore } from "@/components/stores/apps";

const BROWSER_APP_ID = 'browser';

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
