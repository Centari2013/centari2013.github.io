<template>
  <BaseWindow v-bind="baseWindowProps" @export="downloadFile">
    <FileViewerView 
      :content="item.content"
      :file_ext="item.exten"
      :name="item.name"
      :id="fileId"
    />
  </BaseWindow>
</template>

<script setup>
import BaseWindow from "@/components/BaseWindow.vue"
import FileViewerView from "@/components/views/FileViewerView.vue"
import { useAppsStore } from "@/components/stores/apps"
import { useExportFile } from '@/components/utilities/useExportFile'
import { v4 as uuidv4 } from 'uuid';

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

const handleMinimize = (bool) => {
  appsStore.setFileMinimize(props.item, bool)
}

const getMaximized = () => appsStore.isFileMaximized(props.item)
const getMinimized = () => appsStore.isFileMinimized(props.item)
const downloadFile = async () => {
  await exportFile({
    id: fileId,
    content: props.item.content,
    exten: props.item.exten,
    name: props.item.name
  })
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
  showMinimizeButton: false,
  showExportButton: true
}
</script>
