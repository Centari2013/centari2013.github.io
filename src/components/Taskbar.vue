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
  </div>
</template>

<script setup>
import Icon from '@/components/Icon.vue';
import { useAppsStore } from '@/components/stores/apps';
import { computed, useTemplateRef, onMounted, ref, watch } from 'vue';
import { gsap } from 'gsap';


const taskbar = useTemplateRef('taskbar')
const isHoveringTaskbar = ref(false);
let taskbarHoverTimeoutId = null;
let taskbarTween = null;
const appsStore = useAppsStore();

const taskbarApps = appsStore.taskbarApps; // Get desktop-specific apps (shared + unique)
const taskbarZIndex = computed(() => appsStore.zIndexCounter + 1);
    
const moveTaskbarVertically = (yPos, duration=1.5) => {
  const el = taskbar.value

  // kill existing animation before starting a new one
  if (taskbarTween) {
    taskbarTween.kill();
  }
  if(!isMobile() && !el.matches(":hover")){
    taskbarTween = gsap
      .to(el, {
       y: yPos,
       ease: "power2.inOut",
       duration
      })
  }
}

const showTaskbar = () => {
  moveTaskbarVertically(0, 0.5);
}

const hideTaskbar = () => {
  taskbarHoverTimeoutId = setTimeout(() => {
    moveTaskbarVertically(window.innerHeight);
  }, 2000);
}

watch(isHoveringTaskbar, (newBool, _oldBool) => {
  if (!newBool) { // if not hovering over taskbar
    hideTaskbar()
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
  @apply bg-primary-shadow/50;
  @apply flex items-center justify-center space-x-5;
  width: 90%;
  height: 12%;
  
}


</style>
