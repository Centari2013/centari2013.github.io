<template>
  <div class="file-viewer-container">
    <!-- Left Sidebar: Directories -->
    <div class="sidebar">
      <h2 class="sidebar-title">Directories</h2>
      <ul>
        <li
          v-for="dir in sidebarDirs"
          :key="dir.name"
          class="sidebar-item"
          :class="{ 'selected-sidebar-item': isActiveSidebar(dir) }"
          @click="handleSidebarClick(dir)"
        >
          {{ dir.name }}
        </li>
      </ul>
    </div>

    <!-- Right Content: File Viewer -->
    <div class="file-content">
      <div class="toolbar">
        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button 
            class="nav-button"
            :disabled="disableBack"
            @click="back"
          >
            <
          </button>
          <button 
            class="nav-button" 
            :disabled="disableForward"
            @click="forward"
          >
            >
          </button>
        </div>
        <h2 class="directory-title">{{ directoryTitle }}</h2>
      </div>
      <div class="file-grid-container">
        <!-- Responsive Grid that Auto-adjusts -->
        <div class="file-grid">
          <div
            v-for="item in contents"
            :key="item.id ?? item.name"
            class="file-item"
            @dblclick="handleFileDoubleClick(item)"
          >
            <Icon v-if="item.type === 'd'" :image="'directory'" class="d"/>
            <Icon v-else-if="item.type === 'f'" :image="'file'" />
            <div class="file-info">
              <span class="file-name">{{ item.name }}</span>
            </div>
            <div class="file-type">{{item.type != 'd' ? item.exten : ""}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import "@/assets/js/terminal/system";
import { computed, ref, onMounted, toRaw, watch } from "vue";
import Icon from "@/components/desktop/Icon.vue";
import { useAppsStore } from "@/components/stores/apps";
import { useFilesStore } from '@/components/stores/files';
import { storeToRefs } from 'pinia';
import makeDirectoryItems from "@/components/utilities/makeDirectoryItems";
import {makeFileItems} from "@/components/utilities/makeFileItems";
import { openFile } from '@/components/utilities/openFile'

export default {
  components: { Icon },
setup() {
    // Reactive states
    const fsContents = ref([]);
    const directoryTitle = ref("Directory");
    const activePtr = ref(null);
    const filesStore = useFilesStore();
    const { remoteRootName, fsSyncVersion, remoteRootDirPtr } = storeToRefs(filesStore);
    const appsStore = useAppsStore();
    const browserId = 'browser';

    // Fetch directory contents
    const getDirContents = () => {
      if (typeof SystemModule === 'undefined' || !SystemModule.get_cur_fs_dir) {
        return [];
      }
      const files = SystemModule.list_files(SystemModule.get_cur_fs_dir());
      const directories = SystemModule.list_directories(SystemModule.get_cur_fs_dir());
      directoryTitle.value = SystemModule.get_cur_fs_dir().name;

      const contentsList = makeDirectoryItems(directories).concat(makeFileItems(files));

      contentsList.sort((a, b) => a.name.localeCompare(b.name));
      return contentsList;
    };

    const contents = computed(() => fsContents.value);

    const refreshFsContents = () => {
      fsContents.value = getDirContents();
    };

    // Navigation methods
    const chdir = (item) => {
      if (typeof SystemModule === 'undefined' || !SystemModule.cd) {
        return;
      }
      SystemModule.cd(item);
      activePtr.value = item; // <-- track current ptr
      refreshFsContents();
    };

    const back = () => {
      if (typeof SystemModule === 'undefined' || !SystemModule.cd_back) {
        return;
      }
      SystemModule.cd_back();
      refreshFsContents();
    };

    const forward = () => {
      if (typeof SystemModule === 'undefined' || !SystemModule.cd_forward) {
        return;
      }
      SystemModule.cd_forward();
      refreshFsContents();
    };

    const disableBack = computed(() => {
      if (typeof SystemModule === 'undefined' || !SystemModule.back_history_empty) {
        return true;
      }
      return SystemModule.back_history_empty();
    });

    const disableForward = computed(() => {
      if (typeof SystemModule === 'undefined' || !SystemModule.forward_history_empty) {
        return true;
      }
      return SystemModule.forward_history_empty();
    });

    const handleFileDoubleClick = (item) => {
      if (item.type === 'd') {
        chdir(toRaw(item.object));
        return;
      }

      if (item.is_link) {
        appsStore.openApp(browserId, { url: item.content });
        return;
      }

      openFile(item);
    };

    const handleSidebarClick = (dir) => {
      if (!dir?.ptr) {
        return;
      }
      chdir(toRaw(dir.ptr));
    };

    const isActiveSidebar = (dir) => {
      return activePtr.value === dir.ptr;
    };

    // On mounted, initialize contents
    onMounted(() => {
      fsContents.value = getDirContents();
      if (typeof SystemModule !== 'undefined' && SystemModule.get_cur_fs_dir) {
        activePtr.value = SystemModule.get_cur_fs_dir();
      }
      filesStore.loadManifest();
    });

    watch(fsSyncVersion, () => {
      refreshFsContents();
    });

    watch(fsSyncVersion, () => {
      refreshFsContents();
    });


    const downloads_ptr = SystemModule.get_downloads_dir_ptr();
    const home_ptr = SystemModule.get_home_dir_ptr();
    const documents_ptr = SystemModule.get_documents_dir_ptr();
    const pictures_ptr = SystemModule.get_pictures_dir_ptr();
    const desktop_ptr = SystemModule.get_desktop_dir_ptr();
    const root_ptr = SystemModule.get_root_dir_ptr();

    const baseSidebar = [
      { name: "Home", ptr: home_ptr },
      { name: "Desktop", ptr: desktop_ptr },
      { name: "Downloads", ptr: downloads_ptr },
      { name: "Documents", ptr: documents_ptr },
      { name: "Pictures", ptr: pictures_ptr },
      { name: "Root", ptr: root_ptr }
    ];

    const sidebarDirs = computed(() => {
      const dirs = [...baseSidebar];
      if (remoteRootDirPtr.value) {
        dirs.push({ name: remoteRootName.value, ptr: remoteRootDirPtr.value });
      }
      return dirs;
    });

    return {
      contents,
      disableBack,
      disableForward,
      chdir,
      back,
      forward,
      openFile,
      handleFileDoubleClick,
      handleSidebarClick,
      isActiveSidebar,
      downloads_ptr,
      home_ptr,
      pictures_ptr,
      documents_ptr,
      root_ptr,
      desktop_ptr,
      directoryTitle,
      toRaw,
      sidebarDirs,
      activePtr
    };
  },
};
</script>

<style scoped>
@reference '../../style.css';

/* General File Viewer Styles */
.navigation-buttons {
  @apply flex
}
.toolbar {
  @apply flex flex-row mb-4
}

.directory-title {
  @apply text-xl font-semibold text-primary-accent-bright w-full text-center pointer-events-none;
}
.nav-button {
  @apply p-0 aspect-square bg-transparent flex items-center justify-center rounded-none;
  @apply text-primary-accent-bright text-3xl;
  @apply border-none;
}

.nav-button:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
  @apply text-alerts-base;
}


.nav-button:disabled {
  @apply text-primary-accent-light cursor-default;
}

.nav-button:disabled:hover {
  filter: none;
}

.file-viewer-container {
  @apply w-full h-full flex;
}

.sidebar {
  @apply w-36 bg-primary-dark-shadow text-white p-4 space-y-4;
}

.sidebar-title {
  @apply text-lg font-bold text-primary-accent-light;
}

.sidebar-item {
  @apply hover:bg-primary-shadow p-2 rounded cursor-pointer text-primary-accent-light;
}

.selected-sidebar-item {
  @apply bg-primary-shadow font-bold;
}

.file-content {
  @apply flex-1 p-4 bg-primary-shadow;
}


.file-grid {
  @apply grid gap-4;
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content)); /* Adjust 150px as needed */
}

.file-grid-container {
  @apply overflow-auto max-h-full;
}

.d :deep(path) {
  @apply stroke-black;
}

.file-item {
  @apply bg-primary-base p-4 shadow-md hover:bg-primary-accent-light cursor-pointer;
  height: 150px; /* Fixed height */
  width: 150px; /* Fixed width */
  display: flex; /* Center content */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}


.file-info {
  @apply flex items-center justify-between;
}

.file-name {
  @apply text-accent-yellow-base;
}

.file-size {
  @apply text-sm text-gray-500;
}

.file-type {
  @apply text-sm text-accent-yellow-shadow;
}

.icon-svg {
  @apply h-3/4 aspect-square
}

</style>