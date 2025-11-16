<template>
  <div class="desktop">
    <MinimizedFileBar />
    <template v-for="app in openApps" :key="app.id">
        <ContentWindow
          :ref="assignWindowRef(app.id)"
          :id="app.id"
          :initialPosition="getRandomPosition(app.id)"
          :minWidth="app.minWidth"
          :args="app.args"
        />
    </template>

    <template v-for="file in openFiles" :key="file.item">
        <FileWindow
          :ref="assignWindowRef(file.item)"
          :item="file.item"
          :title="file.item.name"
          :initialPosition="getRandomPosition(file.item)"
        />
    </template>
    <div id="filespace">
      <div 
            v-for="item in desktopContents" 
            :key="item.name" 
            class="file-item "
            :class="{'h-35 w-35': isMobile, 'h-40 w-40': !isMobile}"
            @dblclick="handleFileOpen(item)"
          >
            <Icon v-if="item.type === 'd'" :image="'directory'" class="d"/>
            <Icon v-else-if="item.type === 'f' && !item.is_shortcut && !item.is_link" :image="'file'" class="d" />
            <Icon v-else-if="item.type === 'f' && item.is_shortcut" :image="'shortcut'" class="d" />
            <Icon v-else-if="item.type === 'f' && item.is_link" :image="'browserLink'" class="d" />
            <div class="file-info">
              <span class="file-name">{{ item.name }}</span>
            </div>
            <div class="file-type">{{item.type != 'd' ? item.exten : ""}}</div>
          </div>
    </div>
    <Taskbar ref="taskbar"/>
  </div>
</template>
<script setup>
import Icon from '@/components/desktop/Icon.vue';
import { useAppsStore } from '@/components/stores/apps';
import Taskbar from '@/components/desktop/Taskbar.vue';
import MinimizedFileBar from '@/components/desktop/MinimizedFileBar.vue';

import { createLoader } from '@/components/utilities/simulateLoading';
import { initFilesystem as bootstrapFilesystem } from '@/components/utilities/initFilesystem';

import { ref, toRaw, defineAsyncComponent, reactive, provide, onMounted } from 'vue';

const ContentWindow = defineAsyncComponent(() => import("@/components/windows/ContentWindow.vue"));
const emit = defineEmits(['initialized', 'progress'])

import FileWindow from '@/components/windows/FileWindow.vue';
import { storeToRefs } from 'pinia';
import makeDirectoryItems from '@/components/utilities/makeDirectoryItems';
import { makeFileItems } from '@/components/utilities/makeFileItems';
import { openFile } from '@/components/utilities/openFile';
import { useIsMobile } from "@/components/utilities/useIsMobile";

const {isMobile} = useIsMobile()
const windowRefs = reactive({});

provide('windowRefs', windowRefs);
const desktopContents = ref([]);
const appsStore = useAppsStore();
const { openApps, openFiles, isAppOpen } = storeToRefs(appsStore);
const fmId = 'file_manager'
const browserId = 'browser'

const loader = createLoader(2, p => emit('progress', p))

const assignWindowRef = (id) => (el) => {
  if (el) {
    windowRefs[id] = el;
  } else {
    delete windowRefs[id];
  }
};


const opendir = (item) => {
  //TODO: FIX
  
  if (!isAppOpen(fmId)){
    openApp(fmId);
  }
  const fm = windowRefs.find(app => app.id === fmId);
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
    const x = Math.floor(Math.random() * (window.innerWidth - (2 / 3 * window.innerWidth))); // Adjust to avoid overflow
    const y = Math.floor(Math.random() * (window.innerHeight - (3 / 4 * window.innerHeight)));
    randomPositions.set(id, { top: y, left: x });
  }
  return randomPositions.get(id);
};

const handleFileOpen = (item) => {
  if (item.type === 'd') {
    opendir(toRaw(item.object))
  } else if (item.type === 'f' && item.is_link) {
    appsStore.openApp(browserId, { url: item.content })
  }else {
    openFile(item)
  }

}

onMounted(() => {
  // initialize file system
  SystemModule.onRuntimeInitialized = async () => {
    loader.checkpoint()
    try {
      await bootstrapFilesystem();
      console.log("SystemModule filesystem initialized from manifest.");
    } catch (error) {
      console.error("Failed to initialize filesystem", error);
    }
    desktopContents.value = getDesktopContents();
    loader.checkpoint()
  };

  loader.done.then(() => emit('initialized'))
  
})


</script>


<style scoped>
@reference '../../style.css';

.desktop {
  @apply flex flex-col items-center pb-5 justify-end align-middle;
  @apply w-full h-dvh relative;
}

#filespace {
  @apply absolute inset-0 z-0 grid gap-4 p-3;
  grid-template-columns: repeat(auto-fit, minmax(150px, max-content));
  grid-auto-rows: 150px;
  pointer-events: auto; /* let clicks through to files */
}

.d :deep(path),
.d :deep(circle),
.d :deep(ellipse),
.d :deep(rect),
.d :deep(line),
.d :deep(polygon),
.d :deep(polyline) {
  @apply stroke-accent-yellow-shadow;
}

.f path {
  @apply stroke-accent-yellow-shadow;
}


.file-item {
  @apply p-4 cursor-pointer relative; /* Make it relative for pseudo-element positioning */
   /* Fixed width */
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
