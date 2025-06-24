<template>
  <div class="absolute left-0 w-4 top-1/2 -translate-y-1/2 transform h-2/3"
  :style="{zIndex: windowBarZIndex}"
  @mouseover="showFilebar"></div>
  <div 
    ref="filebar"
    id="filebar"
    @mouseenter="isHoveringFilebar = true"
    @mouseleave="isHoveringFilebar = false"
    :style="{zIndex: windowBarZIndex}"
    v-show="!isMobile"
    class="absolute bg-accent-yellow-base/25 top-1/2 -translate-y-1/2 transform h-2/3 w-20 left-0 flex items-center justify-center">

      <div class="h-2/3 w-full bg-alerts-shadow/50 flex flex-col items-center justify-center">
        <div 
          v-for="file in minimizedFiles"
          :id="`filewin-${file.item.object.$$.ptr}`"
          class="w-full h-16 relative"
          ref="minimizedIcon"
        ></div>
      </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useIsMobile } from '@/components/utilities/useIsMobile';
import { useAppsStore } from '@/components/stores/apps';
import { computed, useTemplateRef, ref, watch, onMounted } from 'vue';
import gsap from 'gsap';

const { isMobile } = useIsMobile();
const appsStore = useAppsStore();
const windowBarZIndex = computed(() => appsStore.zIndexCounter + 1);

const { minimizedFiles } = storeToRefs(appsStore);

const filebar = useTemplateRef('filebar')
const isHoveringFilebar = ref(false);
let filebarHoverTimeoutId = null;
let filebarTween = null;

const moveFilebarHorizontally = (xPos, duration=1.5) => {
  const el = filebar.value

  if (filebarTween) { // kill existing animation before starting a new one
    filebarTween.kill();
  }
  filebarTween = gsap
    .to(el, {
      x: xPos,
      ease: "power2.inOut",
      duration
    })
}

const showFilebar = () => {
  moveFilebarHorizontally(0, 0.5);
}

const hideFilebar = (duration=2000) => {
  filebarHoverTimeoutId = setTimeout(() => {
    moveFilebarHorizontally(-filebar.value.offsetWidth);
  }, duration);
}

watch(isHoveringFilebar, (newBool, _oldBool) => {
  if (!newBool) { // if not hovering over filebar
    hideFilebar(500)
  } else { // if hovering interrupt animation
    clearTimeout(filebarHoverTimeoutId)
  }
})

onMounted(() => {
  hideFilebar();
})

</script>

<style scoped>

</style>
