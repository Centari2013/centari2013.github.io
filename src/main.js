import { createApp } from 'vue'
import { createPinia } from 'pinia';
import '../node_modules/augmented-ui/augmented-ui.min.css'
import './style.css'
import '@/assets/js/terminal/system';
import App from '@/App.vue';
import { useFilesStore } from '@/components/stores/files';


const app = createApp(App);
const pinia = createPinia();

app.use(pinia); // Register Pinia

const filesStore = useFilesStore(pinia);
filesStore.loadManifest();

app.mount('#app'); // Mount the app


