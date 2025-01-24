<template>
  <div
    class="desktop"
  >
   
    <template v-for="app in openApps" :key="app.id">
        <ContentWindow
          ref="window"
          class="fixed"
          :id="app.id"
          :initialPosition="getRandomPosition(app.id)"
          :minWidth="app.minWidth"
        />
    </template>

    <template v-for="file in openFiles" :key="file.item">
        <FileWindow
          ref="window"
          class="fixed"
          :item="file.item"
          :title="file.item.name"
          :initialPosition="getRandomPosition(file.item)"
        />
    </template>
    <div id="filespace">
      <div 
            v-for="item in desktopContents.value" 
            :key="item.name" 
            class="file-item"
            @dblclick="item.type === 'd' ? opendir(toRaw(item.object)) : openFile(item)"
          >
            <Icon v-if="item.type === 'd'" :image="'directory'" class="d"/>
            <Icon v-else-if="item.type === 'f'" :image="'file'" class="d" />
            <div class="file-info">
              <span class="file-name">{{ item.name }}</span>
            </div>
            <div class="file-type">{{item.type != 'd' ? item.exten : ""}}</div>
          </div>
    </div>
    <Taskbar ref="taskbar"/>
  </div>
</template>
<script>
import Icon from './components/Icon.vue';
import { useAppsStore } from './components/stores/apps';
import Taskbar from './components/Taskbar.vue';
import ContentWindow from './components/ContentWindow.vue';
import FileWindow from './components/FileWindow.vue';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import makeDirectoryItems from './components/utilities/makeDirectoryItems';
import makeFileItems from './components/utilities/makeFileItems';

export default {
  components: { Icon, Taskbar, ContentWindow, FileWindow },
  setup() {
    const desktopContents = ref([]);
    const appsStore = useAppsStore();
    const { openApps, openFiles, isAppOpen, openApp } = storeToRefs(appsStore);

    const opendir = (item) => {
      const fmId = 'file_manager'
      if (!isAppOpen(fmId)){
        openApp(fmId);
      }
      const fm = this.$refs.window.find(app => app.id === fmId);
      fm.chdir(item);
    }
    const getDesktopContents = () => {
      const desktop_ptr = SystemModule.get_desktop_dir_ptr();
      const files = SystemModule.list_files(desktop_ptr);
      const directories = SystemModule.list_directories(desktop_ptr);

      const contentsList = makeDirectoryItems(directories).concat(makeFileItems(files));

      contentsList.sort((a, b) => a.name.localeCompare(b.name));
      return contentsList;
    };
    
    const randomPositions = new Map();

    const getRandomPosition = (id) => {
      if (!randomPositions.has(id)) {
        const x = Math.floor(Math.random() * (window.innerWidth - (1 / 3 * window.innerWidth))); // Adjust to avoid overflow
        const y = Math.floor(Math.random() * (window.innerHeight - (3 / 4 * window.innerHeight)));
        randomPositions.set(id, { top: y, left: x });
      }
      return randomPositions.get(id);
    };

    const openFile = (item) => {
      //item is ptr
      // push item to appStore openFiles[] as id
      const appsStore = useAppsStore();
      appsStore.openFile(item);
      
    };

    return { openApps, getRandomPosition, openFiles, opendir, desktopContents, getDesktopContents, openFile };
  },
  mounted() {
    SystemModule.onRuntimeInitialized = () => {
            console.log("SystemModule is fully initialized.");
            this.desktopContents.value = this.getDesktopContents(); // Call your logic here
        };
  
  }

};
</script>


<style scoped>
.desktop {
  @apply flex flex-col items-center pb-5 justify-end align-middle;
  @apply w-full h-full;
}

#filespace {
  @apply grid gap-4 h-full w-full p-3;
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content)); /* Adjust 150px as needed */
  z-index: 0;
}

.d :deep(path) {
  @apply stroke-accent-yellow-shadow;
}

.f path {
  @apply stroke-accent-yellow-shadow;
}


.file-item {
  @apply p-4 cursor-pointer relative; /* Make it relative for pseudo-element positioning */
  height: 150px; /* Fixed height */
  width: 150px; /* Fixed width */
  display: flex; /* Center content */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.file-item::before {
  content: ""; /* Pseudo-element for background */
  position: absolute; /* Position it over the parent container */
  inset: 0; /* Cover the entire file-item */
  @apply bg-primary-base opacity-0; /* Start fully transparent */
  transition: opacity 0.2s ease-in-out; /* Smooth transition */
  z-index: -1; /* Place it behind content */
}

.file-item:hover::before {
  opacity: 0.1; /* Fade in on hover */
}



.file-info {
  @apply flex items-center justify-between;
}

.file-name {
  @apply text-primary-bg;
}

.file-size {
  @apply text-sm text-gray-500;
}

.file-type {
  @apply text-sm text-primary-bg;
}

.icon-svg {
  @apply h-3/4 aspect-square;
}



</style>
