<template>
  <!-- Fade transition around the loader -->
  <transition name="fade">
    <!-- Pass the `progress` prop and listen for skip -->
    <LoadingScreen
      v-if="loading"
      :progress="progress"
      @skip="loading = false"
    />
  </transition>

  <Desktop
    @initialized="onDesktopReady"
    @progress="p => progress = p"
  />
</template>

<script setup>
import { ref } from 'vue'
import LoadingScreen from '@/LoadingScreen.vue'
import Desktop from '@/Desktop.vue'

const loading = ref(true)
const progress = ref(0)

function onDesktopReady() {
  // ensure bar can hit 100% and show the fade
  setTimeout(() => {
    loading.value = false
  }, 200)
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
