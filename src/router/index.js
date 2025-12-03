import {createRouter, createWebHistory} from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'os',
    component: () => import('@/routes/os/index.vue'),
  },
  {
    path: '/blog',
    name: 'blog-index',
    component: () => import('@/routes/blog/index.vue'),
  },
  {
    path: '/blog/:slug',
    name: 'blog-post',
    component: () => import('@/routes/blog/[slug].vue'),
    props: true,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
