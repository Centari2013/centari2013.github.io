import { createApp } from 'vue'
import { createPinia } from 'pinia';
import 'augmented-ui/augmented-ui.min.css'
import './style.css'
import '@/assets/js/terminal/system';
import App from '@/App.vue';


const app = createApp(App);
const pinia = createPinia();

app.use(pinia); // Register Pinia
app.mount('#app'); // Mount the app


