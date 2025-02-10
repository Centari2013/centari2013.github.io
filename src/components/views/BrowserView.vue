<template>
  <div class="h-full w-full overflow-scroll">
    <div class="bg-primary-shadow top-0 h-12 flex items-center justify-center sticky">
      <input class="w-2/3 text-center p-1" :disabled="true" :placeholder="currentUrl"/>
    </div>
    
    <iframe :src="currentUrl" class="h-full w-full"></iframe>
  </div>
  
</template>

<script>
export default {
  data() {
    return {
      currentUrl: "https://centari2013.github.io/FSEA/",
      FSEA: "https://centari2013.github.io/FSEA/",
    }
  }
}
</script>