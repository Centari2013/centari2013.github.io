<template>
  <!-- Inject SVG using v-html so it can be styled -->
  <div v-html="iconSvg" class="icon-svg"/>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  props: {
    image: {
      type: String,
      required: true, // The path to the SVG file.
    },
  },
  setup(props) {
    const iconSvg = ref('');

    // Fetch the SVG file and inject it
    onMounted(async () => {
  try {
    const svgModule = await import(`../assets/icons/${props.image}.svg?raw`);
    iconSvg.value = svgModule.default; // Raw SVG string
  } catch (error) {
    console.error(`Error loading SVG: ${props.image}`, error);
    iconSvg.value = '<!-- SVG not found -->'; // Optional fallback
  }
    });

    return {
      iconSvg,
    };
  },
};
</script>
