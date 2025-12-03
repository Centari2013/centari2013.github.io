import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import '../node_modules/augmented-ui/augmented-ui.min.css'
import './style.css'
import '@/assets/js/terminal/system'
import App from '@/App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
