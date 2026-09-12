<template>
  <div class="dark h-screen flex flex-col overflow-hidden bg-(--bg-primary) text-(--text-primary)">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0 bg-(--bg-secondary) border-(--border-color)"
    >
      <n-button text size="small" @click="toggleSidebar">
        <n-icon size="18" class="text-(--icon-color)"><Menu2 /></n-icon>
      </n-button>

      <router-link
        to="/"
        class="flex items-center gap-2 no-underline shrink-0 hover:opacity-80 transition-opacity"
      >
        <n-icon size="22" color="#6366f1"><Tool /></n-icon>
        <span class="font-bold text-base tracking-wide m-0 text-(--text-primary)">ToolBox</span>
      </router-link>

      <div class="flex-1" />

      <router-link to="/login">
        <n-button size="small" type="success">Login</n-button>
      </router-link>
    </header>

    <!-- Body -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <transition name="sidebar">
        <aside
          v-if="sidebarOpen"
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden bg-(--bg-secondary) border-(--border-color)"
        >
          <!-- Search -->
          <div class="p-2 border-b flex items-center gap-2 border-(--border-color)">
            <n-input v-model:value="search" placeholder="Search tools..." size="small" clearable>
              <template #prefix>
                <n-icon class="text-(--icon-color)"><Search /></n-icon>
              </template>
            </n-input>
          </div>

          <!-- Tools list -->
          <div class="flex-1 overflow-y-auto py-2">
            <router-link
              v-for="tool in filteredTools"
              :key="tool.path"
              :to="tool.path"
              class="flex items-center gap-3 px-4 py-3 text-base no-underline transition-colors"
              :class="
                route.path === tool.path
                  ? 'bg-(--bg-active) text-(--accent-secondary)'
                  : 'text-(--text-secondary)'
              "
            >
              <n-icon size="18"><component :is="tool.icon" /></n-icon>
              {{ tool.title }}
            </router-link>
            <n-empty
              v-if="filteredTools.length === 0"
              description="No tools found"
              size="small"
              class="mt-8"
            />
          </div>

          <div class="p-3 text-center">
            <div class="text-xs text-(--text-muted)">Copyright © {{ currentYear }} Hero</div>
          </div>
        </aside>
      </transition>

      <!-- Main content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  Menu2,
  Music,
  Palette,
  Photo,
  Search,
  Tool,
  Wallpaper,
} from '@vicons/tabler'

// Constants
const BREAKPOINT = 1024

// Tool data
const TOOLS = [
  {
    path: '/tools/base64-converter',
    title: 'Base64 Converter',
    category: 'Development',
    icon: Binary,
    desc: 'Encode and decode Base64 strings',
  },
  {
    path: '/tools/utf8-converter',
    title: 'UTF-8 Converter',
    category: 'Development',
    icon: Hash,
    desc: 'Encode and decode UTF-8 strings',
  },
  {
    path: '/tools/caro-game',
    title: 'Caro Game',
    category: 'Entertainment',
    icon: GridDots,
    desc: 'Play Caro (tic-tac-toe) online with friends',
  },
  {
    path: '/tools/markdown-editor',
    title: 'Markdown Editor',
    category: 'Editors',
    icon: FileText,
    desc: 'Write and preview Markdown with live rendering',
  },
  {
    path: '/tools/nes-emulator',
    title: 'NES Emulator',
    category: 'Entertainment',
    icon: DeviceGamepad,
    desc: 'Play NES ROMs served from Netlify Blobs',
  },
  {
    path: '/tools/one-piece-music',
    title: 'One Piece Music',
    category: 'Media',
    icon: Flag,
    desc: 'Listen to One Piece soundtracks by episode',
  },
  {
    path: '/tools/text-art-generator',
    title: 'Text Art Generator',
    category: 'Media',
    icon: Palette,
    desc: 'Convert images into stunning text-based art',
  },
  {
    path: '/tools/translator',
    title: 'Translator',
    category: 'Utilities',
    icon: Language,
    desc: 'Translate text between multiple languages using Google Translate',
  },
  {
    path: '/tools/url-parser',
    title: 'URL Parser',
    category: 'Development',
    icon: Link,
    desc: 'Parse and inspect URL components and query parameters',
  },
  {
    path: '/tools/weather-forecast',
    title: 'Weather Forecast',
    category: 'Utilities',
    icon: Cloud,
    desc: 'Check current weather and forecast for any city',
  },
  {
    path: '/tools/windows-spotlight',
    title: 'Windows Spotlight',
    category: 'Media',
    icon: Photo,
    desc: 'View beautiful images from Windows Spotlight with autoplay',
  },
  {
    path: '/tools/music-player',
    title: 'Music Player',
    category: 'Media',
    icon: Music,
    desc: 'Listen to music from your playlists',
  },
  {
    path: '/tools/bing-wallpaper',
    title: 'Bing Wallpaper',
    category: 'Media',
    icon: Wallpaper,
    desc: 'View daily Bing wallpapers with custom resolution and quality',
  },
].sort((a, b) => a.title.localeCompare(b.title))

const search = ref('')

const filteredTools = computed(() =>
  TOOLS.filter((t) => t.title.toLowerCase().includes(search.value.toLowerCase())),
)

const currentYear = computed(() => new Date().getFullYear())

// State
const sidebarOpen = ref<boolean>(window.innerWidth >= BREAKPOINT)
const route = useRoute()

// Functions
const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)

const updateSidebarOnResize = () => (sidebarOpen.value = window.innerWidth >= BREAKPOINT)

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', updateSidebarOnResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSidebarOnResize)
})
</script>
