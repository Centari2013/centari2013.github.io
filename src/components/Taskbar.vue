<template>
  <div class="w-full h-1/15 bottom-0 absolute" 
  @mouseover="showTaskbar"></div>
  
  <div id="taskbar" ref="taskbar" data-augmented-ui="tl-clip bl-scoop-x tr-clip br-scoop-x"
  :style="{zIndex: taskbarZIndex}"
  @mouseenter="isHoveringTaskbar = true"
  @mouseleave="isHoveringTaskbar = false">
    <Icon class="taskbar-icon"
      v-for="app in taskbarApps"
      :id="`${app.id + 'Icon'}`"
      :key="app.id"
      :image="app.image"
      @click="openOrToggleApp(app.id)"
    />
    <div class="absolute h-6 w-6 m-3 right-0 top-0 flex justify-center" v-if="!isMobile">
      <button @click="isTaskbarLocked = !isTaskbarLocked" class="taskbar-lock-button">
        <LockTaskbarIcon class="locks" v-if="isTaskbarLocked" />
        <UnlockTaskbarIcon class="locks" v-else />
      </button>
    </div>

  </div>
    
</template>

<script setup>
import Icon from '@/components/Icon.vue';
import { useAppsStore } from '@/components/stores/apps';
import { computed, useTemplateRef, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';

import LockTaskbarIcon from '@/assets/icons/lock.svg'
import UnlockTaskbarIcon from '@/assets/icons/unlock.svg'
import { useIsMobile } from '@/components/utilities/useIsMobile';

const { isMobile } = useIsMobile();
console.log(isMobile)

console.log(window.innerWidth)

const taskbar = useTemplateRef('taskbar')
const isHoveringTaskbar = ref(false);
let taskbarHoverTimeoutId = null;
let taskbarTween = null;
const isTaskbarLocked = ref(true);
const appsStore = useAppsStore();

const taskbarApps = appsStore.taskbarApps; // Get desktop-specific apps (shared + unique)
const taskbarZIndex = computed(() => appsStore.zIndexCounter + 1);
    
const moveTaskbarVertically = (yPos, duration=1.5) => {
  if (isTaskbarLocked.value) return;
  const el = taskbar.value

  if (taskbarTween) { // kill existing animation before starting a new one
    taskbarTween.kill();
  }
  taskbarTween = gsap
    .to(el, {
      y: yPos,
      ease: "power2.inOut",
      duration
    })
}

const showTaskbar = () => {
  moveTaskbarVertically(0, 0.5);
}

const hideTaskbar = (duration=2000) => {
  taskbarHoverTimeoutId = setTimeout(() => {
    moveTaskbarVertically(window.innerHeight);
  }, duration);
}

watch(isHoveringTaskbar, (newBool, _oldBool) => {
  if (!newBool) { // if not hovering over taskbar
    hideTaskbar(1000)
  } else { // if hovering interrupt animation
    clearTimeout(taskbarHoverTimeoutId)
  }
})

onMounted(() => {
  hideTaskbar();
})

const openOrToggleApp = (id) => {
  const appsStore = useAppsStore();
  if (appsStore.isAppOpen(id)){
    const matching_app = this.$parent.$refs.window.find(app => app.$props.id === id);
    const window = matching_app.$refs.baseWindow;
    if (appsStore.isAppMaximized(id) && !appsStore.isAppMinimized(id)) window.minimizeWindow();
    else if (appsStore.isAppMinimized(id)) window.maximizeWindow();
    else {window.minimizeWindow()}
  }else{
    appsStore.openApp(id);
  }
  
}

</script>

<style scoped>
@reference '../style.css';

.locks {
  @apply h-full;
}

.locks :deep(path) {
  @apply fill-alerts-base;
}

.icon-svg {
  @apply justify-center cursor-pointer h-4/5 aspect-square; 
}

.icon-svg :deep(path) {
  @apply fill-accent-yellow-shadow stroke-accent-yellow-shadow;
}

.icon-svg :deep(path),
.icon-svg :deep(circle),
.icon-svg :deep(ellipse),
.icon-svg :deep(rect),
.icon-svg :deep(line),
.icon-svg :deep(polygon),
.icon-svg :deep(polyline) {
  @apply stroke-accent-yellow-shadow;
}


/* Use currentColor to inherit fill color dynamically */
.icon-svg:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
}

#taskbar {
  @apply bg-primary-shadow/50 relative;
  @apply flex items-center justify-center space-x-5;
  width: 90%;
  height: 12%;
  
}

.taskbar-lock-button {
  @apply w-full p-0 aspect-square bg-transparent flex items-center justify-center rounded-none border-none;
}


</style>
