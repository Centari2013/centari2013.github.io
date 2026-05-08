<template>
  <BaseWindow v-bind="baseWindowProps" @export="downloadFile"
  :class="{'cursor-pointer': isMini}">
    <FileViewerView
      :file="item"
      :id="fileId"
      @loaded="handleFileLoaded"
    />
  </BaseWindow>
</template>

<script setup>
import BaseWindow from "@/components/windows/BaseWindow/BaseWindow.vue"
import FileViewerView from "@/components/views/FileViewerView.vue"
import { useAppsStore } from "@/components/stores/apps"
import { useExportFile } from '@/components/utilities/useExportFile'
import { v4 as uuidv4 } from 'uuid';
import { ref } from "vue";

const { exportFile } = useExportFile()

const props = defineProps({
  item: {type: Object},
  initialPosition: {type: Object},
  minWidth: { type: Number, default: 400},
  minHeight: { type: Number, default: 300},
  title: {type: String}
})

const appsStore = useAppsStore()
const fileId = uuidv4()
const getzIndex = () => {
  appsStore.bringFileToFront(props.item)
  return appsStore.getFilezIndex(props.item)
}

const handleClose = () => {
  appsStore.closeFile(props.item)
}

const handleMaximize = (bool) => {
  appsStore.setFileMaximize(props.item, bool)
}

const isMini = ref(false)
const handleMinimize = (bool) => {
  isMini.value = bool;
  appsStore.setFileMinimize(props.item, bool)
}

const getMaximized = () => appsStore.isFileMaximized(props.item)
const getMinimized = () => appsStore.isFileMinimized(props.item)
const loadedRenderableFile = ref(null)
const handleFileLoaded = (file) => {
  loadedRenderableFile.value = file
}

const downloadFile = async () => {
  if (!loadedRenderableFile.value) {
    console.warn('File is still loading, please try exporting again once it is ready.')
    return
  }

  await exportFile({
    id: fileId,
    renderableFile: loadedRenderableFile.value,
    exten: props.item.exten,
    name: props.item.name
  })
};


const getMiniPos = () => {
  const filebarWinContainer = document.getElementById(`filewin-${props.item.object.$$.ptr}`);

  if (!filebarWinContainer) return { x: 40, y: window.innerHeight / 2 };

  const rect = filebarWinContainer.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};


const baseWindowProps = {
  initialPosition: props.initialPosition,
  minWidth: props.minWidth,
  minHeight: props.minHeight,
  title: props.title,
  getzIndex,
  handleClose,
  handleMaximize,
  handleMinimize,
  getMaximized,
  getMinimized,
  getMiniPos,
  showMinimizeButton: true,
  showExportButton: true,
  isFileWin: true
}
</script>
