<template>
  <div class="flex flex-col h-full w-full overflow-hidden">
    <!-- Top Bar -->
    <div class="bg-primary-shadow flex items-center justify-between px-2 h-12 shrink-0 border-b border-primary-glow">
      <div class="flex items-center gap-2 w-full">

        <!-- Back button -->
        <button class="browser-btn" @click="goBack">
          <BrowserBackIcon class="browser-icon"/>
        </button>

        <!-- Reload button -->
        <button class="browser-btn" @click="reloadPage">⟳</button>

        <!-- URL Display -->
        <input
          v-model="currentUrl"
          class="bg-gray-900 text-sm text-white px-3 py-1 rounded border border-gray-600 w-full truncate"
        />
      </div>

      <!-- Open in real browser -->
      <button class="browser-btn ml-2" @click="openInNewTab">
        <BrowserNewTabIcon class="browser-icon"/>
      </button>
    </div>

    <!-- Webpage -->
    <iframe :src="currentUrl" class="flex-grow w-full border-none"></iframe>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { extractAndDecodeBase64 } from '@/components/utilities/decode'
import BrowserBackIcon from '@/assets/icons/browserBack.svg'
import BrowserNewTabIcon from '@/assets/icons/browserNewTab.svg'
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

<style>
@reference '../../style.css';

.browser-icon path,
.browser-icon circle,
.browser-icon line,
.browser-icon polyline,
.browser-icon polygon {
  @apply stroke-primary-accent-light;
}

.browser-icon path {
  @apply fill-primary-accent-light;
}

.browser-icon {
  filter: drop-shadow(0 0 1px #ff0546) drop-shadow(0 0 5px #ff0546);
  cursor: pointer;
  height: 20px;
  width: 20px;
}

.browser-icon:hover {
  filter: drop-shadow(0 0 5px #0098db) drop-shadow(0 0 10px #0098db);
}

.browser-icon:hover circle,
.browser-icon:hover line,
.browser-icon:hover polyline,
.browser-icon:hover polygon,
.browser-icon:hover path {
  @apply stroke-alerts-base fill-alerts-base;
}

.browser-button {
  @apply w-1/5 p-0 aspect-square bg-transparent flex items-center justify-center rounded-none rotate-90 border-none;
}
</style>