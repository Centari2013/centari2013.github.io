<template>
  <div class="titlebar" @mousedown="$emit('startDrag', $event)" @touchstart="$emit('startDrag', $event)">
    <!-- Buttons Container -->
    <div class="button-container">
      <button class="titlebar-button" @click="$emit('close')">
        <CloseIcon class="title-icon" width="100%" height="100%"/>
      </button>
      <button class="titlebar-button" @click="$emit('minimize')" v-if="(showMinimizeButton && isMobile && !isFileWin) || (!isMobile && showMinimizeButton)">
        <MinimizeIcon class="title-icon rotate-90" width="100%" height="100%"/>
      </button>
      <button class="titlebar-button" @click="$emit('maximize')">
        <MaximizeIcon class="title-icon" width="100%" height="100%"/>
      </button>
      <button @click="$emit('export')" class="titlebar-button" v-if="showExportButton">
        <ExportIcon class="title-icon export -rotate-90"/>
      </button>

      <button @click="$emit('opaque')" class="titlebar-button">
        <EyeClose  class=" rotate-90 title-icon" v-if="opaque"/>
        <EyeOpen class="rotate-90 title-icon" v-else/>
      </button>
      
      
    </div>
    <!-- Title -->
    <span class="h-1/3"></span>
    <div class="title">{{ title }}</div>
    <span class="h-1/2"></span>
  </div>
</template>

<script setup>
// Logic
import { useIsMobile } from "@/components/utilities/useIsMobile";

// Icons
import CloseIcon from "@/assets/icons/close.svg";
import MinimizeIcon from "@/assets/icons/minimize.svg";
import MaximizeIcon from "@/assets/icons/maximize.svg";
import ExportIcon from "@/assets/icons/export.svg";
import EyeClose from "@/assets/icons/eyeClose.svg";
import EyeOpen from "@/assets/icons/eyeOpen.svg";

const props = defineProps([
  'showMinimizeButton',
  'showExportButton',
  'isFileWin',
  'title',
  'opaque'
])

const emit = defineEmits([
  'close', 
  'minimize', 
  'maximize', 
  'export',
  'opaque',
  'startDrag'
  ])

const { isMobile } = useIsMobile();
  

</script>
<style>
@reference '../../../style.css';

.titlebar {
  @apply flex flex-col pl-4 pr-3 pt-5 text-sm font-bold cursor-move select-none h-full w-15;
  @apply bg-primary-dark-base;
}

.button-container {
  @apply flex flex-col gap-5;
}

.titlebar-button {
  @apply w-1/3 p-0 aspect-square bg-transparent flex items-center justify-center rounded-none rotate-90 border-none;
}

.titlebar-button:hover {
  @apply border-none;
}

.title {
  @apply -rotate-90 aspect-square text-accent-yellow-base;
  white-space: nowrap;
}

.title-icon path,
.title-icon circle,
.title-icon line,
.title-icon polyline,
.title-icon polygon {
  @apply stroke-primary-accent-light;
}

.title-icon path {
  @apply fill-primary-accent-light;
}

.title-icon {
  filter: drop-shadow(0 0 1px #ff0546) drop-shadow(0 0 5px #ff0546);
}


.title-icon:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
}
.title-icon:hover circle,
.title-icon:hover line,
.title-icon:hover polyline,
.title-icon:hover polygon,
.title-icon:hover path {
  @apply fill-alerts-base;
}
.title-icon:hover circle,
.title-icon:hover line,
.title-icon:hover polyline,
.title-icon:hover polygon,
.title-icon:hover path {
  @apply stroke-alerts-base;
}

.export path,
.export:hover path {
  @apply fill-none;
}
</style>