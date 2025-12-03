<template>
  <transition name="fade">
    <LoadingScreen
      v-if="loading"
      :progress="progress"
      @skip="loading = false"
    />
  </transition>

  <Desktop
    @initialized="onDesktopReady"
    @progress="(p) => (progress = p)"
  />
</template>

<script setup>
import { ref } from 'vue'
import Desktop from '@/components/desktop/Desktop.vue'
import LoadingScreen from '@/components/desktop/LoadingScreen.vue'

const loading = ref(true)
const progress = ref(0)

function onDesktopReady() {
  setTimeout(() => {
    loading.value = false
  }, 200)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
