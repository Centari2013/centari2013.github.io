<template>
    <!-- Terminal Div with a reference to access it in the script -->
    <div ref="terminalDiv" id="terminal"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import "@/assets/js/terminal/system.js";
import { initializeTerminal } from "@/assets/js/terminal/terminal.js";
import { useAppsStore } from "@/components/stores/apps";

const props = defineProps({
    contentType: {
        type: String,
        default: "terminal",
    },
});

const terminalDiv = ref(null);
const appsStore = useAppsStore();

const initTerminal = () => {
    const contentElement = terminalDiv.value;
    if (!contentElement) return;

    initializeTerminal(contentElement, {
        closeApp: () => appsStore.closeApp(props.contentType || "terminal"),
    });
};

onMounted(() => {
    initTerminal();
});
</script>
<style scoped>
#terminal {
    @apply h-full w-full;
}
</style>
