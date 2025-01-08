import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

interface BuildProps {
  editMode: boolean
  fileName?: string
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/build',
    name: 'build-tool',
    component: () => import('../views/BuildToolView.vue'),
  },
  // {
  //   path: '/tier-list',
  //   name: 'tier-list',
  //   component: () => import('../views/TierListView.vue'),
  // },
  {
    path: '/dictionnaire',
    name: 'dictionnaire',
    component: () => import('../views/DictionnaireView.vue'),
  },
  {
    path: '/champions',
    name: 'champions',
    component: () => import('../views/ChampionView.vue'),
  },
  {
    path: '/runes',
    name: 'runes',
    component: () => import('../views/RunesView.vue'),
  },
  {
    path: '/items',
    name: 'items',
    component: () => import('../views/ItemsView.vue'),
  },
  {
    path: '/build/:fileName',
    name: 'build-view',
    component: () => import('../views/BuildRecapView.vue'),
    props: true,
  },
  {
    path: '/build/edit',
    name: 'build-edit',
    component: () => import('../views/BuildToolView.vue'),
    props: route =>
      ({
        editMode: true,
        fileName: route.query.file as string | undefined,
      }) satisfies BuildProps,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
