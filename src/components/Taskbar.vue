<template>
  <div id="taskbar" data-augmented-ui="tl-clip bl-scoop-x tr-clip br-scoop-x"
  :style="{zIndex: taskbarZIndex}">
    <Icon class="taskbar-icon"
      v-for="app in taskbarApps"
      :id="`${app.id + 'Icon'}`"
      :key="app.id"
      :image="app.image"
      @click="openOrToggleApp(app.id)"
    />
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';
import { useAppsStore } from '@/components/stores/apps';
import { computed } from 'vue';

export default {
  components: { Icon },
  setup() {
    const appsStore = useAppsStore();

    const taskbarApps = appsStore.taskbarApps; // Get desktop-specific apps (shared + unique)
    const taskbarZIndex = computed(() => appsStore.zIndexCounter + 1);
    

    return { taskbarApps, taskbarZIndex };
  },
  methods: {
    
    openOrToggleApp(id) {
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
  }
};
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
