<template>
  <div
    v-for="dir in directions"
    :key="dir"
    :id="`${dir}-resize`"
    :class="getResizeClass(dir)"
    :style="{ zIndex: `${zIndex + 1}` }"
    @mousedown="(e) => emit('startResize', e, dir)"
    @touchstart="(e) => emit('startResize', e, dir)"
  />
</template>

<script setup>
const props = defineProps({ zIndex: Number })
const emit = defineEmits(['startResize'])

const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"]
function getResizeClass(dir) {
  return `resize-${dir}`
}
</script>
