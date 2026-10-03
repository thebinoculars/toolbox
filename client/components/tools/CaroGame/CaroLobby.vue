<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <n-card class="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="text-center">
          <h1 class="text-3xl font-bold mb-1">Caro Game</h1>
          <p class="text-gray-500">Real-time multiplayer tic-tac-toe</p>
        </div>
      </template>

      <n-tabs v-model:value="activeTab" type="segment" animated>
        <n-tab-pane name="create" tab="Create Room">
          <n-space vertical :size="16">
            <n-input
              v-model:value="playerName"
              placeholder="Enter your name"
              maxlength="20"
              size="large"
            />
            <n-input
              v-model:value="createRoomId"
              placeholder="Room code (leave empty to auto-generate)"
              size="large"
            />
            <n-button
              type="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!playerName.trim()"
              @click="emit('create')"
            >
              Create Room
            </n-button>
          </n-space>
        </n-tab-pane>

        <n-tab-pane name="join" tab="Join Room">
          <n-space vertical :size="16">
            <n-input
              v-model:value="playerName"
              placeholder="Enter your name"
              maxlength="20"
              size="large"
            />
            <n-input v-model:value="joinRoomId" placeholder="Enter room code" size="large" />
            <n-button
              type="primary"
              size="large"
              block
              :loading="loading"
              :disabled="!playerName.trim() || !joinRoomId.trim()"
              @click="emit('join')"
            >
              Join Room
            </n-button>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{ loading: boolean }>()

const emit = defineEmits<{ create: []; join: [] }>()

const activeTab = defineModel<'create' | 'join'>('activeTab', { required: true })
const playerName = defineModel<string>('playerName', { required: true })
const createRoomId = defineModel<string>('createRoomId', { required: true })
const joinRoomId = defineModel<string>('joinRoomId', { required: true })
</script>
