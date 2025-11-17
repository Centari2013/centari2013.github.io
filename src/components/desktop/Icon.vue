<template>
  <!-- Inject SVG using v-html so it can be styled -->
  <div v-html="iconSvg" class="icon-svg"/>
</template>

<script>
import { ref, onMounted, computed } from 'vue';

export default {
  props: {
    image: {
      type: String,
      required: true, // The path to the SVG file.
    },
  },
  setup(props) {
    const iconSvg = ref('');
    const normalizedImage = computed(() => {
      if (typeof props.image !== 'string') {
        return '';
      }
      // Guard against the historical "directiry" typo so existing data keeps working.
      return props.image.replace('directiry', 'directory');
    });

    // Fetch the SVG file and inject it
    onMounted(async () => {
  try {
    const imageName = normalizedImage.value || props.image;
    if (!imageName) {
      return;
    }
    const svgModule = await import(`../../assets/icons/${imageName}.svg?raw`);
    if (imageName !== props.image) {
      console.warn(`Icon "${props.image}" not found. Falling back to "${imageName}".`);
    }
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
