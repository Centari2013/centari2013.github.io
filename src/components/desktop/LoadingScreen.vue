<template>
  <div
    class="loading-overlay fixed inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50"
    @click="skip"
  >
    <div class="text-center">
      <div class="mb-2">Loading… {{ Math.round(progress * 100) }}%</div>
      <div class="w-64 h-2 bg-gray-700">
        <!-- dynamically size the inner bar -->
        <div
          class="h-full bg-white transition-all duration-200"
          :style="{ width: progress * 100 + '%' }"
        ></div>
      </div>
      <!--<div class="mt-2 text-sm opacity-50">(click to skip)</div>-->
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['skip'])
const props = defineProps({
  progress: { type: Number, default: 0 }
})
function skip() {
  emit('skip')
}
</script>
<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 9999; /* anything higher than .desktop */
}
</style>
