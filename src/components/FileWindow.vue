<template>
  <BaseWindow v-bind="baseWindowProps">
    <FileViewerView 
      :content="item.content"
      :file_ext="item.exten"
      :name="item.name"
    />
  </BaseWindow>
</template>

<script setup>
import BaseWindow from "@/components/BaseWindow.vue"
import FileViewerView from "@/components/views/FileViewerView.vue"
import { useAppsStore } from "@/components/stores/apps"

const props = defineProps({
  item: {type: Object},
  initialPosition: {type: Object},
  minWidth: { type: Number, default: 400},
  minHeight: { type: Number, default: 300},
  title: {type: String}
})

const appsStore = useAppsStore()

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

const handleMinimize = (bool) => {
  appsStore.setFileMinimize(props.item, bool)
}

const getMaximized = () => appsStore.isFileMaximized(props.item)
const getMinimized = () => appsStore.isFileMinimized(props.item)


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
  showMinimizeButton: false
}
</script>
