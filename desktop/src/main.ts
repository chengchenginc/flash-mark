import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

createApp(App).use(createPinia()).mount('#app')

// 移除首屏加载动画：先淡出再删除节点，避免生硬跳变
const loading = document.getElementById('app-loading')
if (loading) {
  loading.classList.add('is-hidden')
  loading.addEventListener('transitionend', () => loading.remove(), { once: true })
  // 兜底：若 transitionend 未触发（系统动画被关闭等），定时移除，避免遮挡
  setTimeout(() => loading.remove(), 600)
}
