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
<style scoped>
@reference '../../../style.css';

#n-resize {
  @apply absolute top-0 w-full h-1 cursor-ns-resize;
}

#nw-resize {
  @apply absolute top-0 left-0 w-4 aspect-square cursor-nwse-resize;
}

#ne-resize {
  @apply absolute top-0 right-0 w-4 aspect-square cursor-nesw-resize;
}

#sw-resize {
  @apply absolute bottom-0 left-0 w-12 h-5 aspect-square cursor-nesw-resize;
}

#se-resize {
  @apply absolute bottom-0 right-0 w-4 aspect-square cursor-nwse-resize;
}

#w-resize {
  @apply absolute left-0 h-full w-1 cursor-ew-resize;
}

#e-resize {
  @apply absolute right-0 h-full w-1 cursor-ew-resize;
}

#s-resize {
  @apply absolute bottom-0 w-full h-1 cursor-ns-resize;
}
</style>