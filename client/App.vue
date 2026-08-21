<script setup lang="ts">
import { darkTheme } from 'naive-ui'

import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const theme = darkTheme
const route = useRoute()

const isAuthPage = computed(() => route.path === '/login')
const isAdminPage = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="{ common: { fontFamily: 'Inter, sans-serif' } }"
  >
    <NMessageProvider>
      <NDialogProvider>
        <!-- Auth pages -->
        <AuthLayout v-if="isAuthPage">
          <router-view />
        </AuthLayout>
        <!-- App pages -->
        <DefaultLayout v-else-if="!isAdminPage">
          <router-view />
        </DefaultLayout>
        <!-- Admin pages -->
        <AdminLayout v-else>
          <router-view />
        </AdminLayout>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
