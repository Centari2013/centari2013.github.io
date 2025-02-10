<template>
  <div class="h-full w-full overflow-scroll">
    <div class="bg-primary-shadow top-0 h-12 flex items-center justify-center sticky">
      <div @click="openInNewTab" class="w-2/3 h-4/6 text-center p-1 cursor-pointer text-nowrap bg-gray-800">
        {{ currentUrl }}
      </div>
      
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
  },
  methods: {
    openInNewTab(){
      window.open(this.currentUrl, "_blank");
    }
  }
}
</script>