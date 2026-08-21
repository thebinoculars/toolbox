<template>
  <div class="w-full max-w-md px-4">
    <n-card :bordered="false" class="shadow-xl rounded-2xl">
      <div class="text-center mb-8">
        <n-icon size="48" color="#6366f1" class="mb-3"><Lock /></n-icon>
        <n-h2 class="mb-1 mt-2">Welcome Back</n-h2>
        <n-p :depth="3" class="mt-0">Sign in to access your tools</n-p>
      </div>

      <n-form @submit.prevent="handleLogin">
        <n-form-item label="Email">
          <n-input v-model:value="email" type="text" placeholder="Enter your email" size="large" />
        </n-form-item>
        <n-form-item label="Password">
          <n-input
            v-model:value="password"
            type="password"
            placeholder="Enter your password"
            size="large"
            show-password-on="click"
          />
        </n-form-item>

        <n-button type="primary" block size="large" :loading="isLoading" attr-type="submit" round>
          Sign In
        </n-button>
      </n-form>

      <n-divider class="my-5" />
      <div class="text-center">
        <router-link to="/">
          <n-button text size="small" class="text-(--icon-color)">← Back to Home</n-button>
        </router-link>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { Lock } from '@vicons/tabler'

import authRepository from '@/repositories/authRepository'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

// State
const email = ref('')
const password = ref('')
const isLoading = ref(false)

// Functions
const handleLogin = async () => {
  isLoading.value = true
  try {
    const data = await authRepository.login(email.value, password.value)

    authStore.setToken(data.token)
    authStore.setUser(data.user)
    router.push('/admin')
  } catch {
    message.error('Failed to login')
  } finally {
    isLoading.value = false
  }
}
</script>
