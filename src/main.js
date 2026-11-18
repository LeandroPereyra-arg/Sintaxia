import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { iniciarNativo } from './servicios/nativo.js'
import './assets/styles/main.css'

createApp(App).use(router).mount('#app')

// Solo en el APK: boton Atras de Android y enlaces de los correos (etapa 8).
iniciarNativo(router)
