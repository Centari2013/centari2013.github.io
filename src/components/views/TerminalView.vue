<template>
    <!-- Terminal Div with a reference to access it in the script -->
    <div ref="terminalDiv" id="terminal"></div>
</template>

<script>
import "../../assets/js/terminal/system.js"
import { initializeTerminal } from '../../assets/js/terminal/terminal.js';

export default {
   
    mounted() {
        this.initTerminal(); // Initialize the terminal after the component is mounted
    },

    methods: {
        initTerminal() {
            // Access the terminal div using $refs
            const contentElement = this.$refs.terminalDiv;
            if (contentElement) {
            
                initializeTerminal(contentElement, this.$parent);  // Pass the terminal container as the argument
            
            }
        },

    },
};
</script>
<style>
#terminal {
    @apply h-full w-full;
}
</style>
