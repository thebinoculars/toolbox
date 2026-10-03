<template>
  <div v-if="route.path === '/admin'" class="flex items-center justify-center h-full">
    <div class="text-center">
      <n-icon size="64" class="text-(--accent-primary) mb-4"><Dashboard /></n-icon>
      <h2 class="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h2>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { Dashboard } from '@vicons/tabler'

const route = useRoute()
</script>
