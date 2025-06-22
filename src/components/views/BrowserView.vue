<template>
  <div class="h-full w-full overflow-scroll">
    <div class="bg-primary-shadow top-0 h-12 flex items-center justify-center sticky">
      <div @click="openInNewTab" class="w-2/3 h-4/6 text-center p-1 cursor-pointer text-nowrap bg-gray-800 overflow-hidden">
        {{ currentUrl }}
      </div>
      
    </div>
    
    <iframe :src="currentUrl" class="h-full w-full"></iframe>
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
import { extractAndDecodeBase64 } from '@/components/utilities/decode'

const props = defineProps({
  args: {
    type: Object,
    default: null
  }
})

const currentUrl = ref("https://centari2013.github.io/");

if (props.args) {
  const propLink = extractAndDecodeBase64(props.args.url)
  currentUrl.value = propLink;
}

const openInNewTab = () =>{
  window.open(currentUrl.value, "_blank");
}
</script>