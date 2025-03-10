import { createApp } from 'vue'
import { createPinia } from 'pinia';
import '../node_modules/augmented-ui/augmented-ui.min.css'
import './style.css'
import Desktop from './Desktop.vue';

window.isMobile = () => {
  return window.innerWidth <= 768;
}

const app = createApp(Desktop);
const pinia = createPinia();

app.use(pinia); // Register Pinia
app.mount('#app'); // Mount the app