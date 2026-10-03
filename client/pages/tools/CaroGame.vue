<template>
  <div class="flex flex-col h-full">
    <CaroLobby
      v-if="!currentRoom"
      v-model:active-tab="activeTab"
      v-model:player-name="playerName"
      v-model:create-room-id="createRoomId"
      v-model:join-room-id="joinRoomId"
      :loading="loading"
      @create="createRoom(playerName, createRoomId)"
      @join="joinRoom(playerName, joinRoomId)"
    />

    <div v-else class="min-h-screen p-2 md:p-4 flex items-center justify-center">
      <div class="flex flex-col xl:flex-row gap-4 md:gap-6 max-w-full mx-auto items-stretch w-full">
        <div class="w-full xl:flex-1 flex justify-center overflow-x-auto pb-4 order-1 xl:order-1">
          <CaroBoard
            :game-state="gameState"
            :player="player"
            :is-my-turn="isMyTurn"
            @cell-click="makeMove"
          />
        </div>

        <div class="w-full xl:w-60 shrink-0 order-2 xl:order-2">
          <CaroInfoPanel
            :room-code="currentRoom"
            :game-state="gameState"
            :player="player"
            :play-again-status="playAgainStatus"
            :turn-time-left="turnTimeLeft"
            :play-again-time-left="playAgainTimeLeft"
            @play-again="playAgain"
            @leave="leaveRoom"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CaroBoard from '@/components/tools/CaroGame/CaroBoard.vue'
import CaroInfoPanel from '@/components/tools/CaroGame/CaroInfoPanel.vue'
import CaroLobby from '@/components/tools/CaroGame/CaroLobby.vue'
import { useCaroRoom } from '@/composables/tools/useCaroRoom'

const activeTab = ref<'create' | 'join'>('create')
const playerName = ref('')
const createRoomId = ref('')
const joinRoomId = ref('')

const {
  loading,
  currentRoom,
  gameState,
  player,
  playAgainStatus,
  isMyTurn,
  turnTimeLeft,
  playAgainTimeLeft,
  createRoom,
  joinRoom,
  makeMove,
  playAgain,
  leaveRoom,
} = useCaroRoom()
</script>
