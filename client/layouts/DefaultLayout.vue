<template>
  <div class="dark h-screen flex flex-col overflow-hidden bg-(--bg-primary) text-(--text-primary)">
    <header
      class="sticky top-0 z-50 border-b h-12 flex items-center px-4 gap-3 shrink-0 bg-(--bg-secondary) border-(--border-color)"
    >
      <n-button text size="small" aria-label="Toggle sidebar" @click="toggleSidebar">
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

    <div class="flex flex-1 overflow-hidden">
      <transition name="sidebar">
        <aside
          v-if="sidebarOpen"
          class="w-60 shrink-0 border-r flex flex-col overflow-hidden bg-(--bg-secondary) border-(--border-color)"
        >
          <div class="p-2 border-b flex items-center gap-2 border-(--border-color)">
            <n-input v-model:value="search" placeholder="Search tools..." size="small" clearable>
              <template #prefix>
                <n-icon class="text-(--icon-color)"><Search /></n-icon>
              </template>
            </n-input>
          </div>

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

      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Menu2, Search, Tool } from '@vicons/tabler'

const BREAKPOINT = 1024

const router = useRouter()

const TOOLS = router
  .getRoutes()
  .filter((r) => r.path.startsWith('/tools/'))
  .map((r) => ({ path: r.path, title: r.meta.title ?? '', icon: r.meta.icon }))
  .sort((a, b) => a.title.localeCompare(b.title))

const search = ref('')

const filteredTools = computed(() =>
  TOOLS.filter((t) => t.title.toLowerCase().includes(search.value.toLowerCase())),
)

const currentYear = computed(() => new Date().getFullYear())

const sidebarOpen = ref<boolean>(window.innerWidth >= BREAKPOINT)
const route = useRoute()

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)

const updateSidebarOnResize = () => (sidebarOpen.value = window.innerWidth >= BREAKPOINT)

onMounted(() => {
  window.addEventListener('resize', updateSidebarOnResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSidebarOnResize)
})
</script>
