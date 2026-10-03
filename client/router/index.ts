import {
  Binary,
  Cloud,
  DeviceGamepad,
  FileText,
  Flag,
  GridDots,
  Hash,
  Language,
  Link,
  Music,
  Palette,
  Photo,
  Tool,
  Wallpaper,
} from '@vicons/tabler'
import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { getAuthToken } from '@/utils/localStorage'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: Component
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/Home.vue'),
    meta: { title: 'ToolBox', icon: Tool },
  },
  {
    path: '/login',
    component: () => import('@/pages/Login.vue'),
    meta: { title: 'Login' },
  },
  {
    path: '/admin',
    component: () => import('@/pages/Admin.vue'),
    meta: { title: 'Admin' },
    children: [
      {
        path: 'profile',
        component: () => import('@/pages/admin/Profile.vue'),
        meta: { title: 'Profile' },
      },
      {
        path: 'albums',
        component: () => import('@/pages/admin/Albums.vue'),
        meta: { title: 'Albums' },
      },
      {
        path: 'albums/:id',
        component: () => import('@/pages/admin/AlbumDetail.vue'),
        meta: { title: 'Album Detail' },
      },
    ],
  },
  {
    path: '/tools/base64-converter',
    component: () => import('@/pages/tools/Base64Converter.vue'),
    meta: { title: 'Base64 Converter', icon: Binary },
  },
  {
    path: '/tools/utf8-converter',
    component: () => import('@/pages/tools/Utf8Converter.vue'),
    meta: { title: 'UTF-8 Converter', icon: Hash },
  },
  {
    path: '/tools/caro-game',
    component: () => import('@/pages/tools/CaroGame.vue'),
    meta: { title: 'Caro Game', icon: GridDots },
  },
  {
    path: '/tools/markdown-editor',
    component: () => import('@/pages/tools/MarkdownEditor.vue'),
    meta: { title: 'Markdown Editor', icon: FileText },
  },
  {
    path: '/tools/nes-emulator',
    component: () => import('@/pages/tools/NesEmulator.vue'),
    meta: { title: 'NES Emulator', icon: DeviceGamepad },
  },
  {
    path: '/tools/one-piece-music',
    component: () => import('@/pages/tools/OnePieceMusic.vue'),
    meta: { title: 'One Piece Music', icon: Flag },
  },
  {
    path: '/tools/text-art-generator',
    component: () => import('@/pages/tools/TextArtGenerator.vue'),
    meta: { title: 'Text Art Generator', icon: Palette },
  },
  {
    path: '/tools/translator',
    component: () => import('@/pages/tools/Translator.vue'),
    meta: { title: 'Translator', icon: Language },
  },
  {
    path: '/tools/url-parser',
    component: () => import('@/pages/tools/UrlParser.vue'),
    meta: { title: 'URL Parser', icon: Link },
  },
  {
    path: '/tools/weather-forecast',
    component: () => import('@/pages/tools/WeatherForecast.vue'),
    meta: { title: 'Weather Forecast', icon: Cloud },
  },
  {
    path: '/tools/windows-spotlight',
    component: () => import('@/pages/tools/WindowsSpotlight.vue'),
    meta: { title: 'Windows Spotlight', icon: Photo },
  },
  {
    path: '/tools/bing-wallpaper',
    component: () => import('@/pages/tools/BingWallpaper.vue'),
    meta: { title: 'Bing Wallpaper', icon: Wallpaper },
  },
  {
    path: '/tools/music-player',
    name: 'MusicPlayer',
    component: () => import('@/pages/tools/MusicPlayer.vue'),
    meta: { title: 'Music Player', icon: Music },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title || 'ToolBox'
})

router.beforeEach((to) => {
  const token = getAuthToken()
  if (to.path === '/login' && token) {
    return '/admin'
  }
  if (to.path.startsWith('/admin') && !token) {
    return '/login'
  }
})

export default router
