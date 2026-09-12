import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import Admin from '@/pages/Admin.vue'
import AdminAlbumDetail from '@/pages/admin/AlbumDetail.vue'
import AdminAlbums from '@/pages/admin/Albums.vue'
import AdminProfile from '@/pages/admin/Profile.vue'
import Home from '@/pages/Home.vue'
import Login from '@/pages/Login.vue'
import Base64Converter from '@/pages/tools/Base64Converter.vue'
import BingWallpaper from '@/pages/tools/BingWallpaper.vue'
import CaroGame from '@/pages/tools/CaroGame.vue'
import MarkdownEditor from '@/pages/tools/MarkdownEditor.vue'
import MusicPlayer from '@/pages/tools/MusicPlayer.vue'
import NesEmulator from '@/pages/tools/NesEmulator.vue'
import OnePieceMusic from '@/pages/tools/OnePieceMusic.vue'
import TextArtGenerator from '@/pages/tools/TextArtGenerator.vue'
import Translator from '@/pages/tools/Translator.vue'
import UrlParser from '@/pages/tools/UrlParser.vue'
import Utf8Converter from '@/pages/tools/Utf8Converter.vue'
import WeatherForecast from '@/pages/tools/WeatherForecast.vue'
import WindowsSpotlight from '@/pages/tools/WindowsSpotlight.vue'
import { getAuthToken } from '@/utils/localStorage'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home, meta: { title: 'ToolBox', icon: 'Tool' } },
  {
    path: '/login',
    component: Login,
    meta: { title: 'Login' },
  },
  {
    path: '/admin',
    component: Admin,
    meta: { title: 'Admin' },
    children: [
      {
        path: 'profile',
        component: AdminProfile,
        meta: { title: 'Profile' },
      },
      {
        path: 'albums',
        component: AdminAlbums,
        meta: { title: 'Albums' },
      },
      {
        path: 'albums/:id',
        component: AdminAlbumDetail,
        meta: { title: 'Album Detail' },
      },
    ],
  },
  {
    path: '/tools/base64-converter',
    component: Base64Converter,
    meta: { title: 'Base64 Converter', icon: 'Binary' },
  },
  {
    path: '/tools/utf8-converter',
    component: Utf8Converter,
    meta: { title: 'UTF-8 Converter', icon: 'Hash' },
  },
  {
    path: '/tools/caro-game',
    component: CaroGame,
    meta: { title: 'Caro Game', icon: 'DeviceGamepad2' },
  },
  {
    path: '/tools/markdown-editor',
    component: MarkdownEditor,
    meta: { title: 'Markdown Editor', icon: 'FileText' },
  },
  {
    path: '/tools/nes-emulator',
    component: NesEmulator,
    meta: { title: 'NES Emulator', icon: 'DeviceGamepad' },
  },
  {
    path: '/tools/one-piece-music',
    component: OnePieceMusic,
    meta: { title: 'One Piece Music', icon: 'Flag' },
  },
  {
    path: '/tools/text-art-generator',
    component: TextArtGenerator,
    meta: { title: 'Text Art Generator', icon: 'Palette' },
  },
  {
    path: '/tools/translator',
    component: Translator,
    meta: { title: 'Translator', icon: 'Language' },
  },
  {
    path: '/tools/url-parser',
    component: UrlParser,
    meta: { title: 'URL Parser', icon: 'Link' },
  },
  {
    path: '/tools/weather-forecast',
    component: WeatherForecast,
    meta: { title: 'Weather Forecast', icon: 'Cloud' },
  },
  {
    path: '/tools/windows-spotlight',
    component: WindowsSpotlight,
    meta: { title: 'Windows Spotlight', icon: 'Photo' },
  },
  {
    path: '/tools/bing-wallpaper',
    component: BingWallpaper,
    meta: { title: 'Bing Wallpaper', icon: 'Wallpaper' },
  },
  {
    path: '/tools/music-player',
    name: 'MusicPlayer',
    component: MusicPlayer,
    meta: { title: 'Music Player', icon: 'Music' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'ToolBox'
})

router.beforeEach((to, _from, next) => {
  const token = getAuthToken()
  if (to.path === '/login' && token) {
    next('/admin')
  } else {
    next()
  }
})

export default router
