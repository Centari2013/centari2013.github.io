<template>
  <div class="file-viewer-container">
    <!-- Left Sidebar: Directories -->
    <div class="sidebar">
      <h2 class="sidebar-title">Directories</h2>
      <ul>
        <li class="sidebar-item" @click="chdir(home_ptr)">Home</li>
        <li class="sidebar-item" @click="chdir(desktop_ptr)">Desktop</li>
        <li class="sidebar-item" @click="chdir(downloads_ptr)">Downloads</li>
        <li class="sidebar-item" @click="chdir(documents_ptr)">Documents</li>
        <li class="sidebar-item" @click="chdir(pictures_ptr)">Pictures</li>
        <li class="sidebar-item" @click="chdir(root_ptr)">Root</li>
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
            :key="item.name" 
            class="file-item"
            @dblclick="item.type === 'd' ? chdir(toRaw(item.object)) : openFile(item)"
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
import "../../assets/js/terminal/system";
import { ref, onMounted, toRaw } from "vue";
import Icon from "../Icon.vue";
import { useAppsStore } from "../stores/apps";
import makeDirectoryItems from "../utilities/makeDirectoryItems";
import makeFileItems from "../utilities/makeFileItems";
export default {
  components: { Icon },
setup() {
    // Reactive states
    const contents = ref([]);
    const disableBack = ref(true);
    const disableForward = ref(true);
    const directoryTitle = ref("Directory");

    // Fetch directory contents
    const getDirContents = () => {
      const files = SystemModule.list_files(SystemModule.get_cur_fs_dir());
      const directories = SystemModule.list_directories(SystemModule.get_cur_fs_dir());
      directoryTitle.value = SystemModule.get_cur_fs_dir().name;

      //const contentsList = [];
      const contentsList = makeDirectoryItems(directories).concat(makeFileItems(files));
      
      contentsList.sort((a, b) => a.name.localeCompare(b.name));
      return contentsList;
    };

    // Navigation methods
    const chdir = (item) => {
      SystemModule.cd(item);
      contents.value = getDirContents();
      syncButtonState();
    };

    const back = () => {
      SystemModule.cd_back();
      contents.value = getDirContents();
      syncButtonState();
    };

    const forward = () => {
      SystemModule.cd_forward();
      contents.value = getDirContents();
      syncButtonState();
    };

    const openFile = (item) => {
      //item is ptr
      // push item to appStore openFiles[] as id
      const appsStore = useAppsStore();
      appsStore.openFile(item);
      
    };

    // Sync button states
    const syncButtonState = () => {
      disableBack.value = SystemModule.back_history_empty();
      disableForward.value = SystemModule.forward_history_empty();
    };

    // On mounted, initialize contents and button states
    onMounted(() => {
      contents.value = getDirContents();
      syncButtonState();
    });

    const downloads_ptr = SystemModule.get_downloads_dir_ptr();
    const home_ptr = SystemModule.get_home_dir_ptr();
    const documents_ptr = SystemModule.get_documents_dir_ptr();
    const pictures_ptr = SystemModule.get_pictures_dir_ptr();
    const desktop_ptr = SystemModule.get_desktop_dir_ptr();
    const root_ptr = SystemModule.get_root_dir_ptr();

    return {
      contents,
      disableBack,
      disableForward,
      chdir,
      back,
      forward,
      openFile,
      downloads_ptr,
      home_ptr,
      pictures_ptr,
      documents_ptr,
      root_ptr,
      desktop_ptr,
      directoryTitle,
      toRaw
    };
  },
};
</script>

<style scoped>
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