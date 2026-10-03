<template>
  <n-card :bordered="false" class="h-full">
    <n-space vertical :size="20">
      <n-card size="small" :bordered="true">
        <div class="text-center">
          <n-text depth="3" style="font-size: 11px; font-weight: 600; text-transform: uppercase">
            ROOM CODE
          </n-text>
          <div class="flex items-center justify-center gap-2 mt-2">
            <n-text class="font-mono font-bold text-2xl" style="color: #2080f0">
              {{ roomCode }}
            </n-text>
            <n-button text size="small" @click="copyRoomCode">
              <template #icon>
                <n-icon><Copy /></n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </n-card>

      <n-list bordered>
        <template #header>
          <n-text depth="3" style="font-size: 12px; font-weight: 600; text-transform: uppercase">
            Players
          </n-text>
        </template>
        <n-list-item
          v-for="p in gameState?.players"
          :key="p.id"
          :style="{
            backgroundColor: isCurrentTurn(p) ? 'rgba(32, 128, 240, 0.1)' : 'transparent',
            borderLeft: isCurrentTurn(p) ? '3px solid #2080f0' : 'none',
          }"
        >
          <template #prefix>
            <n-avatar
              round
              size="small"
              :style="{ backgroundColor: p.symbol === 'X' ? '#18a058' : '#f02020' }"
            >
              {{ p.symbol }}
            </n-avatar>
          </template>
          <div class="flex items-center gap-2">
            <n-text class="truncate max-w-30">{{ p.name }}</n-text>
            <n-tag v-if="p.id === player?.id" type="info" size="tiny" round> YOU </n-tag>
          </div>
        </n-list-item>
        <n-list-item v-if="(gameState?.players?.length || 0) < 2">
          <template #prefix>
            <n-avatar round size="small" style="background-color: #ccc">
              <n-icon><QuestionMark /></n-icon>
            </n-avatar>
          </template>
          <n-text depth="3"> <n-spin size="small" /> Waiting... </n-text>
        </n-list-item>
      </n-list>

      <n-card size="small" :bordered="true">
        <div v-if="!gameState?.gameStarted">
          <n-empty description="Waiting for opponent to join">
            <template #icon>
              <n-icon size="48">
                <Clock />
              </n-icon>
            </template>
          </n-empty>
        </div>
        <div v-else-if="gameState.gameEnded">
          <n-space vertical :size="12">
            <div class="text-center">
              <n-avatar
                round
                size="large"
                :style="{
                  backgroundColor: gameState.winner === player?.symbol ? '#18a058' : '#f02020',
                }"
              >
                {{ gameState.winner === player?.symbol ? '✓' : '✗' }}
              </n-avatar>
            </div>
            <div class="text-center">
              <n-text style="font-size: 16px; font-weight: 600">
                {{
                  gameState.winner
                    ? gameState.winner === player?.symbol
                      ? 'You Win!'
                      : 'You Lose!'
                    : 'Draw!'
                }}
              </n-text>
            </div>
            <div class="flex items-center justify-center">
              <n-progress
                type="circle"
                :percentage="(playAgainTimeLeft / PLAY_AGAIN_TIME_LIMIT) * 100"
                :stroke-width="8"
                :width="60"
                color="#2080f0"
              >
                <template #default>
                  <n-text style="font-size: 18px; font-weight: bold">
                    {{ playAgainTimeLeft }}
                  </n-text>
                </template>
              </n-progress>
            </div>
          </n-space>
        </div>
        <div v-else>
          <n-space vertical :size="12">
            <div class="text-center">
              <n-avatar
                round
                size="large"
                :style="{
                  backgroundColor: gameState.currentPlayer === 'X' ? '#18a058' : '#f02020',
                }"
              >
                {{ gameState.currentPlayer }}
              </n-avatar>
            </div>
            <div class="text-center">
              <n-text style="font-size: 16px; font-weight: 600" class="truncate max-w-50">
                {{ currentPlayerName }}'s Turn
              </n-text>
            </div>
            <div class="flex items-center justify-center">
              <n-progress
                type="circle"
                :percentage="(turnTimeLeft / TURN_TIME_LIMIT) * 100"
                :stroke-width="8"
                :width="80"
                color="#2080f0"
              >
                <template #default>
                  <n-text style="font-size: 24px; font-weight: bold">
                    {{ turnTimeLeft }}
                  </n-text>
                </template>
              </n-progress>
            </div>
          </n-space>
        </div>
      </n-card>

      <n-button
        v-if="gameState?.gameEnded"
        block
        type="primary"
        :disabled="isReadyToPlayAgain"
        @click="emit('playAgain')"
      >
        {{ isReadyToPlayAgain ? 'Waiting...' : 'Play Again' }}
      </n-button>

      <n-button type="error" block @click="emit('leave')">
        <template #icon>
          <n-icon><Logout /></n-icon>
        </template>
        Leave Room
      </n-button>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { Clock, Copy, Logout, QuestionMark } from '@vicons/tabler'

import { PLAY_AGAIN_TIME_LIMIT, TURN_TIME_LIMIT } from '@/composables/tools/useCaroRules'
import { copyToClipboard } from '@/utils/clipboard'
import type { GameState, PlayAgainStatus, Player } from '@/utils/realtime'

const props = defineProps<{
  roomCode: string
  gameState: GameState | null
  player: Player | null
  playAgainStatus: PlayAgainStatus | null
  turnTimeLeft: number
  playAgainTimeLeft: number
}>()

const emit = defineEmits<{ playAgain: []; leave: [] }>()

const message = useMessage()

const isCurrentTurn = (p: Player) =>
  p.symbol === props.gameState?.currentPlayer && !props.gameState?.gameEnded

const currentPlayerName = computed(
  () => props.gameState?.players.find((p) => p.symbol === props.gameState?.currentPlayer)?.name,
)

const isReadyToPlayAgain = computed(() =>
  props.playAgainStatus?.readyPlayers.includes(props.player?.id || ''),
)

const copyRoomCode = async () => {
  try {
    await copyToClipboard(props.roomCode)
    message.success('Room code copied!')
  } catch {
    message.error('Failed to copy room code')
  }
}
</script>
