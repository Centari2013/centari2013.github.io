<template>
  <BaseWindow v-bind="baseWindowProps" ref="baseWindow"
  :class="{'cursor-pointer': isMini}">
    <component :is="contentComponent" :title="title" :contentType="id" v-bind="{args}" />
  </BaseWindow>
</template>

<script setup>
import { computed, ref } from 'vue';

import BaseWindow from "@/components/windows/BaseWindow/BaseWindow.vue"
import TerminalView from "@/components/views/TerminalView.vue";
import FileManagerView from "@/components/views/FileManagerView.vue";
import BrowserView from "@/components/views/BrowserView.vue";

import { useAppsStore } from "@/components/stores/apps.js";

const props = defineProps({
  id: {
    type: String,
    default: "terminal",
  },
  initialPosition: {
    type: Object,
    default: () => ({ top: 100, left: 100 }),
  },
  minWidth: {
    type: Number,
    default: window.innerWidth * 0.3,
  },
  minHeight: {
    type: Number,
    default: window.innerHeight * 0.4,
  },
  args: {
    type: Object,
    default: null
  }
})

const title = ref('unamed_window')

const appsStore = useAppsStore()
const contentComponent = computed(() => {
  if (props.id === "terminal") {
    title.value = "PyroShell";
    return TerminalView;
  } else if (props.id === "file_manager") {
    title.value = "File Manager";
    return FileManagerView;
  }else if (props.id === "browser") {
    title.value = "Browser";
    return BrowserView;
  }
  return null;
})

const getzIndex = () => {
  appsStore.bringAppToFront(props.id);
  return appsStore.getAppzIndex(props.id);
}

const handleClose = () => {
  appsStore.closeApp(props.id)
}

const handleMaximize = (bool) => {
  appsStore.setAppMaximize(props.id, bool)
}

const isMini = ref(false)
const handleMinimize = (bool) => {
  isMini.value = bool;
  appsStore.setAppMinimize(props.id, bool)
}

const getMaximized = () => appsStore.isAppMaximized(props.id)
const getMinimized = () => appsStore.isAppMinimized(props.id)
const getMiniPos = () => {
  const taskbarEl = document.getElementById("taskbar");
  const iconEl = document.getElementById(props.id + "Icon");

  if (!taskbarEl || !iconEl) return { x: window.innerWidth / 2, y: window.innerHeight };

  const taskbarRect = taskbarEl.getBoundingClientRect();
  const iconRect = iconEl.getBoundingClientRect();

  return {
    x: Math.max(0, Math.min(window.innerWidth, iconRect.x + iconRect.width / 2)),
    y: Math.min(window.innerHeight, taskbarRect.y),
  };
};

const baseWindowProps = {
  initialPosition: props.initialPosition,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  title,
  getzIndex,
  getMiniPos,
  handleClose,
  handleMaximize,
  handleMinimize,
  getMaximized,
  getMinimized,
  showMinimizeButton: true
}

</script>