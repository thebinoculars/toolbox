<template>
  <div class="flex flex-col h-full">
    <!-- Lobby Screen -->
    <div v-if="!currentRoom" class="min-h-screen flex items-center justify-center p-4">
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
                @click="handleCreateRoom"
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
                @click="handleJoinRoom"
              >
                Join Room
              </n-button>
            </n-space>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>

    <!-- Game Board -->
    <div v-else class="min-h-screen p-2 md:p-4 flex items-center justify-center">
      <div class="flex flex-col xl:flex-row gap-4 md:gap-6 max-w-full mx-auto items-stretch w-full">
        <!-- Game Board (Left) -->
        <div class="w-full xl:flex-1 flex justify-center overflow-x-auto pb-4 order-1 xl:order-1">
          <div
            ref="boardRef"
            class="shrink-0 relative overflow-hidden cursor-crosshair"
            style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
            tabindex="0"
            :style="{
              width: `${viewportSize * cellSize}px`,
              height: `${viewportSize * cellSize}px`,
            }"
            @mousemove="handleMouseMove"
            @mouseleave="hoveredCell = null"
            @wheel="handleScroll"
            @keydown="handleKeyPress"
          >
            <div
              v-for="rowObj in visibleBoard"
              :key="`row-${rowObj.rowIndex}`"
              class="absolute"
              :style="{
                top: `${(rowObj.rowIndex - viewportPos.row) * cellSize}px`,
                left: '0',
                width: `${viewportSize * cellSize}px`,
                height: `${cellSize}px`,
              }"
            >
              <div
                v-for="(cell, colIndex) in rowObj.cells"
                :key="`${rowObj.rowIndex}-${colIndex + viewportPos.col}`"
                class="absolute border border-gray-700 flex items-center justify-center transition-all"
                :style="{
                  left: `${colIndex * cellSize}px`,
                  top: '0',
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor:
                    cell !== null
                      ? 'rgba(31, 41, 55, 0.3)'
                      : hoveredCell?.row === rowObj.rowIndex &&
                          hoveredCell?.col === colIndex + viewportPos.col &&
                          player?.symbol === 'X' &&
                          isMyTurn
                        ? 'rgba(59, 130, 246, 0.2)'
                        : hoveredCell?.row === rowObj.rowIndex &&
                            hoveredCell?.col === colIndex + viewportPos.col &&
                            player?.symbol === 'O' &&
                            isMyTurn
                          ? 'rgba(239, 68, 68, 0.2)'
                          : hoveredCell?.row === rowObj.rowIndex &&
                              hoveredCell?.col === colIndex + viewportPos.col &&
                              !isMyTurn &&
                              !gameState?.gameEnded
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'transparent',
                  cursor:
                    hoveredCell?.row === rowObj.rowIndex &&
                    hoveredCell?.col === colIndex + viewportPos.col &&
                    !isMyTurn &&
                    cell === null
                      ? 'not-allowed'
                      : isMyTurn && cell === null
                        ? 'pointer'
                        : 'default',
                  zIndex: isWinningCell(rowObj.rowIndex, colIndex + viewportPos.col) ? 10 : 1,
                }"
                :class="{
                  'bg-[rgba(139,92,246,0.8)]! animate-pulse': isWinningCell(
                    rowObj.rowIndex,
                    colIndex + viewportPos.col,
                  ),
                }"
                @click="handleCellClick(rowObj.rowIndex, colIndex + viewportPos.col)"
              >
                <span
                  v-if="cell"
                  class="cell-content font-bold text-xl"
                  :class="cell === 'X' ? 'text-green-400' : 'text-red-400'"
                >
                  {{ cell }}
                </span>
                <span
                  v-if="
                    hoveredCell?.row === rowObj.rowIndex &&
                    hoveredCell?.col === colIndex + viewportPos.col &&
                    isMyTurn &&
                    cell === null
                  "
                  class="cell-preview font-bold text-xl opacity-50"
                  :class="player?.symbol === 'X' ? 'text-green-400' : 'text-red-400'"
                >
                  {{ player?.symbol }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Info Panel -->
        <div class="w-full xl:w-60 shrink-0 order-2 xl:order-2">
          <n-card :bordered="false" class="h-full">
            <n-space vertical :size="20">
              <!-- Room ID -->
              <n-card size="small" :bordered="true">
                <div class="text-center">
                  <n-text
                    depth="3"
                    style="font-size: 11px; font-weight: 600; text-transform: uppercase"
                  >
                    ROOM CODE
                  </n-text>
                  <div class="flex items-center justify-center gap-2 mt-2">
                    <n-text class="font-mono font-bold text-2xl" style="color: #2080f0">
                      {{ currentRoom }}
                    </n-text>
                    <n-button text size="small" @click="copyRoomCode">
                      <template #icon>
                        <n-icon><Copy /></n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
              </n-card>

              <!-- Players -->
              <n-list bordered>
                <template #header>
                  <n-text
                    depth="3"
                    style="font-size: 12px; font-weight: 600; text-transform: uppercase"
                  >
                    Players
                  </n-text>
                </template>
                <n-list-item
                  v-for="p in gameState?.players"
                  :key="p.id"
                  :style="{
                    backgroundColor:
                      p.symbol === gameState?.currentPlayer && !gameState?.gameEnded
                        ? 'rgba(32, 128, 240, 0.1)'
                        : 'transparent',
                    borderLeft:
                      p.symbol === gameState?.currentPlayer && !gameState?.gameEnded
                        ? '3px solid #2080f0'
                        : 'none',
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

              <!-- Game Status -->
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
                          backgroundColor:
                            gameState.winner === player?.symbol ? '#18a058' : '#f02020',
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
                        {{
                          gameState.players.find((p) => p.symbol === gameState?.currentPlayer)
                            ?.name
                        }}'s Turn
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

              <!-- Play Again Button (outside card, only when game ended) -->
              <n-button
                v-if="gameState?.gameEnded"
                block
                type="primary"
                :disabled="playAgainStatus?.readyPlayers.includes(player?.name || '')"
                @click="handlePlayAgain"
              >
                {{
                  playAgainStatus?.readyPlayers.includes(player?.name || '')
                    ? 'Waiting...'
                    : 'Play Again'
                }}
              </n-button>

              <!-- Leave Room -->
              <n-button type="error" block @click="handleLeaveRoom">
                <template #icon>
                  <n-icon><Logout /></n-icon>
                </template>
                Leave Room
              </n-button>
            </n-space>
          </n-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, Copy, Logout, QuestionMark } from '@vicons/tabler'

import { copyToClipboard } from '@/utils/clipboard'
import type { GameState, PlayAgainStatus, Player, TimerId } from '@/utils/realtime'
import {
  clearTimer,
  createChannel,
  listenToChannelEvent,
  removeChannel,
  sendChannelMessage,
  subscribeToChannel,
} from '@/utils/realtime'

const message = useMessage()

// Constants
const BOARD_SIZE = 128
const CELL_SIZE = 30
const VIEWPORT_SIZE = 25
const TURN_TIME_LIMIT = 30
const PLAY_AGAIN_TIME_LIMIT = 30

// Expose constants to template
const cellSize = CELL_SIZE
const viewportSize = VIEWPORT_SIZE

// State
const activeTab = ref<'create' | 'join'>('create')
const createRoomId = ref('')
const joinRoomId = ref('')
const loading = ref(false)
const currentRoom = ref<string | null>(null)
const playerName = ref('')
const gameState = ref<GameState | null>(null)
const player = ref<Player | null>(null)
const hoveredCell = ref<{ row: number; col: number } | null>(null)
const viewportPosition = ref<{ row: number; col: number }>({ row: 0, col: 0 })
const turnTimeLeft = ref(TURN_TIME_LIMIT)
const playAgainTimeLeft = ref(PLAY_AGAIN_TIME_LIMIT)
const playAgainStatus = ref<PlayAgainStatus | null>(null)
const boardRef = ref<HTMLDivElement | null>(null)

// Supabase channel
let channel: ReturnType<typeof createChannel> = null
let turnTimerInterval: TimerId | null = null
let playAgainTimerInterval: TimerId | null = null

// Local game state (not stored in DB)
const localGameState = ref<GameState | null>(null)

// Computed
const viewportPos = computed(() => viewportPosition.value)

const visibleBoard = computed(() => {
  if (!gameState.value) return []
  const startRow = viewportPosition.value.row
  const startCol = viewportPosition.value.col
  const endRow = Math.min(startRow + VIEWPORT_SIZE, BOARD_SIZE)
  const endCol = Math.min(startCol + VIEWPORT_SIZE, BOARD_SIZE)

  const board: { cells: (string | null)[]; rowIndex: number }[] = []
  for (let row = startRow; row < endRow; row++) {
    const rowCells: (string | null)[] = []
    for (let col = startCol; col < endCol; col++) {
      rowCells.push(gameState.value.board[row][col])
    }
    board.push({ cells: rowCells, rowIndex: row })
  }
  return board
})

const isMyTurn = computed(() => {
  return (
    player.value?.symbol === gameState.value?.currentPlayer &&
    !gameState?.value?.gameEnded &&
    gameState?.value?.gameStarted
  )
})

// Functions
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 10)
}

// Create room
const handleCreateRoom = async () => {
  loading.value = true

  try {
    // Validate player name
    const name = playerName.value.trim()
    if (!name) {
      message.error('Please enter your name')
      loading.value = false
      return
    }
    if (name.length > 20) {
      message.error('Name must be 20 characters or less')
      loading.value = false
      return
    }

    // Validate custom room ID if provided
    const customRoomId = createRoomId.value.trim()
    if (customRoomId && customRoomId.length > 8) {
      message.error('Room code must be 8 characters or less')
      loading.value = false
      return
    }

    // Use custom room ID or generate one
    const roomId = customRoomId || generateRoomId()

    // Initialize local game state
    const initialState: GameState = {
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: 'X',
      gameStarted: false,
      gameEnded: false,
      winner: null,
      winningCells: null,
      players: [],
    }

    localGameState.value = initialState
    gameState.value = initialState
    currentRoom.value = roomId

    // Create player and join game immediately
    const playerId = Math.random().toString(36).substring(2, 15)
    const newPlayer: Player = {
      id: playerId,
      name: name,
      symbol: 'X',
    }

    player.value = newPlayer
    localGameState.value.players.push(newPlayer)
    gameState.value = { ...localGameState.value }

    // Subscribe to realtime channel
    subscribeToRoom()

    // Broadcast player joined event
    if (channel) {
      sendChannelMessage(channel, 'player_joined', { player: newPlayer })
    }
  } catch {
    message.error('Failed to create room')
  } finally {
    loading.value = false
  }
}

// Join room
const handleJoinRoom = async () => {
  loading.value = true

  try {
    // Validate player name
    const name = playerName.value.trim()
    if (!name) {
      message.error('Please enter your name')
      loading.value = false
      return
    }
    if (name.length > 20) {
      message.error('Name must be 20 characters or less')
      loading.value = false
      return
    }

    // Validate room ID
    const roomId = joinRoomId.value.trim()
    if (!roomId) {
      message.error('Please enter a room code')
      loading.value = false
      return
    }

    // Initialize local game state
    const initialState: GameState = {
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: 'X',
      gameStarted: false,
      gameEnded: false,
      winner: null,
      winningCells: null,
      players: [],
    }

    localGameState.value = initialState
    gameState.value = initialState

    // Create player
    const playerId = Math.random().toString(36).substring(2, 15)
    const newPlayer: Player = {
      id: playerId,
      name: name,
      symbol: 'O', // Joining player gets O
    }

    player.value = newPlayer
    localGameState.value.players.push(newPlayer)
    gameState.value = { ...localGameState.value }

    // Create temp channel to check if room exists
    const tempChannel = createChannel(`caro_room_${roomId}`)
    if (!tempChannel) {
      message.error('Failed to create channel')
      loading.value = false
      return
    }

    // Listen for player joined and state sync
    listenToChannelEvent<{ player: Player }>(tempChannel, 'player_joined', (payload) => {
      const newPlayer = payload.payload.player
      if (
        localGameState.value &&
        !localGameState.value.players.find((p) => p.id === newPlayer.id)
      ) {
        const symbol = localGameState.value.players.length === 0 ? 'X' : 'O'
        const playerWithSymbol: Player = { ...newPlayer, symbol }
        localGameState.value.players.push(playerWithSymbol)
        gameState.value = { ...localGameState.value }
      }
    })

    listenToChannelEvent<{ players: Player[] }>(tempChannel, 'sync_players', (payload) => {
      if (localGameState.value) {
        localGameState.value.players = payload.payload.players
        gameState.value = { ...localGameState.value }
      }
    })

    listenToChannelEvent<{ gameState: GameState }>(tempChannel, 'sync_state', (payload) => {
      if (localGameState.value) {
        const syncedState = payload.payload.gameState
        localGameState.value = syncedState
        gameState.value = { ...syncedState }
      }
    })

    subscribeToChannel(tempChannel, (status: string) => {
      if (status === 'SUBSCRIBED') {
        // Broadcast player joined event
        if (tempChannel) {
          sendChannelMessage(tempChannel, 'player_joined', { player: newPlayer })

          // Request current game state from existing players
          sendChannelMessage(tempChannel, 'request_state', { playerId })
        }
      }
    })

    // Wait for response to check if room exists
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // If no other players responded, room doesn't exist
    if (localGameState.value.players.length === 1) {
      // Remove temp channel and reset state
      if (tempChannel) await removeChannel(tempChannel)
      player.value = null
      localGameState.value = null
      gameState.value = null
      message.error('Room not found or no players in room')
      loading.value = false
      return
    }

    // Room exists, remove temp channel and set up properly
    if (tempChannel) await removeChannel(tempChannel)

    // Set currentRoom to show board
    currentRoom.value = roomId

    // Subscribe to realtime channel properly
    subscribeToRoom()

    // Broadcast player joined event again
    await new Promise((resolve) => setTimeout(resolve, 100))
    if (channel) {
      sendChannelMessage(channel, 'player_joined', { player: newPlayer })
    }
  } catch {
    message.error('Failed to join room')
  } finally {
    loading.value = false
  }
}

// Subscribe to room updates
const subscribeToRoom = () => {
  if (!currentRoom.value) return

  channel = createChannel(`caro_room_${currentRoom.value}`)
  if (!channel) return

  // Listen for player joined
  listenToChannelEvent<{ player: Player }>(channel, 'player_joined', (payload) => {
    const newPlayer = payload.payload.player
    if (localGameState.value && !localGameState.value.players.find((p) => p.id === newPlayer.id)) {
      // Add new player with correct symbol based on order
      const symbol = localGameState.value.players.length === 0 ? 'X' : 'O'
      const playerWithSymbol: Player = { ...newPlayer, symbol }

      localGameState.value.players.push(playerWithSymbol)
      gameState.value = { ...localGameState.value }

      // Send current player list to new player so they have correct symbols
      if (channel) {
        sendChannelMessage(channel, 'sync_players', { players: localGameState.value.players })
      }

      // Check if game should start (2 players)
      if (localGameState.value.players.length === 2 && !localGameState.value.gameStarted) {
        localGameState.value.gameStarted = true
        gameState.value = { ...localGameState.value }

        // Broadcast game started event to all players
        if (channel) {
          sendChannelMessage(channel, 'game_started', { gameState: localGameState.value })
        }

        startTurnTimer()
      }

      // If game already started, send current state to new player
      if (localGameState.value.gameStarted && channel) {
        sendChannelMessage(channel, 'sync_state', { gameState: localGameState.value })
      }
    }
  })

  // Listen for players sync
  listenToChannelEvent<{ players: Player[] }>(channel, 'sync_players', (payload) => {
    const { players } = payload.payload
    if (localGameState.value && players.length === 2 && !localGameState.value.gameStarted) {
      // Update local players with correct symbols from host
      // Find our player in the synced list and update our local player ref
      const myPlayerId = player.value?.id
      const syncedMyPlayer = players.find((p: Player) => p.id === myPlayerId)

      if (syncedMyPlayer) {
        // Update our player ref with the correct symbol from host
        player.value = syncedMyPlayer
      }

      // Update the players list
      localGameState.value.players = players
      gameState.value = { ...localGameState.value }
    }
  })

  //.Listen for state sync request
  listenToChannelEvent(channel, 'request_state', () => {
    // Send current state to requesting player
    if (localGameState.value && localGameState.value.gameStarted && channel) {
      sendChannelMessage(channel, 'sync_state', { gameState: localGameState.value })
    }
  })

  // Listen for state sync
  listenToChannelEvent<{ gameState: GameState }>(channel, 'sync_state', (payload) => {
    const newGameState = payload.payload.gameState
    if (localGameState.value) {
      localGameState.value = newGameState
      gameState.value = { ...newGameState }

      // Start timer if game is active
      if (newGameState.gameStarted && !newGameState.gameEnded) {
        clearTimer(turnTimerInterval)
        startTurnTimer()
      }
    }
  })

  // Listen for game started
  listenToChannelEvent<{ gameState: GameState }>(channel, 'game_started', (payload) => {
    const newGameState = payload.payload.gameState
    localGameState.value = newGameState
    gameState.value = { ...newGameState }
    startTurnTimer()
  })

  // Listen for moves
  listenToChannelEvent<{
    row: number
    col: number
    player: string
    newGameState: GameState
    isTimeout?: boolean
  }>(channel, 'move_made', (payload) => {
    const { row, col, player, newGameState } = payload.payload
    if (!localGameState.value) {
      return
    }
    localGameState.value.board[row][col] = player
    localGameState.value = newGameState
    gameState.value = { ...newGameState }

    if (newGameState.gameStarted && !newGameState.gameEnded) {
      clearTimer(turnTimerInterval)
      startTurnTimer()
    }

    if (newGameState.gameEnded) {
      clearTimer(turnTimerInterval)
      startPlayAgainTimer()
    }
  })

  // Listen for game reset
  listenToChannelEvent<{ gameState: GameState }>(channel, 'game_reset', (payload) => {
    const newGameState = payload.payload.gameState
    localGameState.value = newGameState
    gameState.value = { ...newGameState }
    playAgainStatus.value = null
    playAgainTimeLeft.value = PLAY_AGAIN_TIME_LIMIT

    clearTimer(playAgainTimerInterval)
    startTurnTimer()
  })

  // Listen for play again requests
  listenToChannelEvent<PlayAgainStatus>(channel, 'play_again_request', (payload) => {
    const { readyCount, totalPlayers, readyPlayers } = payload.payload
    playAgainStatus.value = { readyCount, totalPlayers, readyPlayers }
  })

  // Listen for player left
  listenToChannelEvent(channel, 'player_left', () => {
    handleLeaveRoom()
    message.error('Other player left. Room closed.')
  })

  subscribeToChannel(channel, (status: string) => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed to room:', currentRoom.value)
    }
  })
}

// Make move
const handleCellClick = async (row: number, col: number) => {
  if (!gameState.value || !currentRoom.value || !player.value) return
  if (gameState.value.gameEnded) return
  if (gameState.value.board[row][col] !== null) return
  if (player.value.symbol !== gameState.value.currentPlayer) return

  try {
    // Make move locally
    const newBoard = gameState.value.board.map((r) => [...r])
    newBoard[row][col] = player.value.symbol

    // Check for win
    const winResult = checkWin(row, col, player.value.symbol, newBoard)

    let newGameState = { ...gameState.value, board: newBoard }

    if (winResult.won) {
      newGameState.gameEnded = true
      newGameState.winner = player.value.symbol
      newGameState.winningCells = winResult.winningCells || null
    } else {
      newGameState.currentPlayer = newGameState.currentPlayer === 'X' ? 'O' : 'X'
    }

    // Update local state
    localGameState.value = newGameState
    gameState.value = { ...newGameState }

    // Broadcast move to other player
    if (channel) {
      sendChannelMessage(channel, 'move_made', {
        row,
        col,
        player: player.value.symbol,
        newGameState,
      })
    }

    // Handle timers locally
    if (newGameState.gameEnded) {
      clearTimer(turnTimerInterval)
      startPlayAgainTimer()
    } else {
      clearTimer(turnTimerInterval)
      startTurnTimer()
    }
  } catch {
    message.error('Failed to make move')
  }
}

// Check win condition
const checkWin = (row: number, col: number, playerSymbol: string, board: (string | null)[][]) => {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [dx, dy] of directions) {
    const cells: [number, number][] = [[row, col]]

    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const newRow = row + dx * i
      const newCol = col + dy * i
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE ||
        board[newRow][newCol] !== playerSymbol
      ) {
        break
      }
      cells.push([newRow, newCol])
    }

    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const newRow = row - dx * i
      const newCol = col - dy * i
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE ||
        board[newRow][newCol] !== playerSymbol
      ) {
        break
      }
      cells.push([newRow, newCol])
    }

    if (cells.length >= 5) {
      return { won: true, winningCells: cells }
    }
  }

  return { won: false }
}

// Check if cell is winning cell
const isWinningCell = (row: number, col: number) => {
  if (!gameState.value?.winningCells) return false
  const isWinning = gameState.value.winningCells.some(([r, c]) => r === row && c === col)
  return isWinning
}

// Turn timer
const startTurnTimer = () => {
  turnTimeLeft.value = TURN_TIME_LIMIT
  clearTimer(turnTimerInterval)

  turnTimerInterval = setInterval(() => {
    turnTimeLeft.value--

    if (turnTimeLeft.value <= 0) {
      clearTimer(turnTimerInterval)
      handleTurnTimeout()
    }
  }, 1000)
}

const handleTurnTimeout = async () => {
  if (!gameState.value || !currentRoom.value) return

  try {
    const loser = gameState.value.currentPlayer
    const winner = loser === 'X' ? 'O' : 'X'

    const newGameState = {
      ...gameState.value,
      gameEnded: true,
      winner,
    }

    localGameState.value = newGameState
    gameState.value = { ...newGameState }
    message.error(`${loser} ran out of time!`)

    // Broadcast timeout to other player
    if (channel) {
      sendChannelMessage(channel, 'move_made', {
        row: -1,
        col: -1,
        player: loser,
        newGameState,
        isTimeout: true,
      })
    }

    startPlayAgainTimer()
  } catch {
    message.error('Failed to handle timeout')
  }
}

// Play again timer
const startPlayAgainTimer = () => {
  playAgainTimeLeft.value = PLAY_AGAIN_TIME_LIMIT
  clearTimer(playAgainTimerInterval)

  playAgainTimerInterval = setInterval(() => {
    playAgainTimeLeft.value--

    if (playAgainTimeLeft.value <= 0) {
      clearTimer(playAgainTimerInterval)
      handleRoomClose()
    }
  }, 1000)
}

const handleRoomClose = () => {
  handleLeaveRoom()
  message.error('Play again time expired. Room closed.')
}

// Play again
const handlePlayAgain = async () => {
  if (!gameState.value || !currentRoom.value || !player.value) return

  try {
    // Track play again requests locally
    if (!playAgainStatus.value) {
      playAgainStatus.value = {
        readyCount: 1,
        totalPlayers: gameState.value.players.length,
        readyPlayers: [player.value.name],
      }
    } else if (!playAgainStatus.value.readyPlayers.includes(player.value.name)) {
      playAgainStatus.value.readyCount++
      playAgainStatus.value.readyPlayers.push(player.value.name)
    }

    // Broadcast play again request
    if (channel) {
      sendChannelMessage(channel, 'play_again_request', playAgainStatus.value)
    }

    // Check if both players ready
    if (playAgainStatus.value.readyCount === 2) {
      // Reset game
      const resetGameState: GameState = {
        board: Array(BOARD_SIZE)
          .fill(null)
          .map(() => Array(BOARD_SIZE).fill(null)),
        currentPlayer: gameState.value.currentPlayer === 'X' ? 'O' : 'X',
        gameStarted: true,
        gameEnded: false,
        winner: null,
        winningCells: null,
        players: gameState.value.players,
      }

      localGameState.value = resetGameState
      gameState.value = { ...resetGameState }
      playAgainStatus.value = null
      playAgainTimeLeft.value = PLAY_AGAIN_TIME_LIMIT

      if (playAgainTimerInterval) clearInterval(playAgainTimerInterval)

      // Broadcast game reset
      if (channel) {
        sendChannelMessage(channel, 'game_reset', { gameState: resetGameState })
      }

      startTurnTimer()
    }
  } catch {
    message.error('Failed to play again')
  }
}

// Leave room
const handleLeaveRoom = async () => {
  // Broadcast player left before disconnecting
  if (channel && currentRoom.value) {
    sendChannelMessage(channel, 'player_left', {})
  }

  // Clean up timers
  clearTimer(turnTimerInterval)
  clearTimer(playAgainTimerInterval)

  // Unsubscribe
  if (channel) {
    await removeChannel(channel)
    channel = null
  }

  // Reset state
  currentRoom.value = null
  gameState.value = null
  localGameState.value = null
  player.value = null
  playAgainStatus.value = null
  turnTimeLeft.value = TURN_TIME_LIMIT
  playAgainTimeLeft.value = PLAY_AGAIN_TIME_LIMIT
  hoveredCell.value = null
  viewportPosition.value = { row: 0, col: 0 }
}

// Copy room code
const copyRoomCode = async () => {
  if (currentRoom.value) {
    try {
      await copyToClipboard(currentRoom.value)
      message.success('Room code copied!')
    } catch {
      message.error('Failed to copy room code')
    }
  }
}

// Board navigation
const handleMouseMove = (e: MouseEvent) => {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL_SIZE) + viewportPosition.value.col
  const row = Math.floor((e.clientY - rect.top) / CELL_SIZE) + viewportPosition.value.row
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
    hoveredCell.value = { row, col }
  }
}

const handleScroll = (e: WheelEvent) => {
  e.preventDefault()
  const scrollAmount = 3
  viewportPosition.value = {
    row: Math.max(
      0,
      Math.min(
        BOARD_SIZE - VIEWPORT_SIZE,
        viewportPosition.value.row + (e.deltaY > 0 ? scrollAmount : -scrollAmount),
      ),
    ),
    col: Math.max(
      0,
      Math.min(
        BOARD_SIZE - VIEWPORT_SIZE,
        viewportPosition.value.col + (e.deltaX > 0 ? scrollAmount : -scrollAmount),
      ),
    ),
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  const scrollAmount = 5
  let { row, col } = viewportPosition.value

  if (e.key === 'ArrowUp') row = Math.max(0, row - scrollAmount)
  if (e.key === 'ArrowDown') row = Math.min(BOARD_SIZE - VIEWPORT_SIZE, row + scrollAmount)
  if (e.key === 'ArrowLeft') col = Math.max(0, col - scrollAmount)
  if (e.key === 'ArrowRight') col = Math.min(BOARD_SIZE - VIEWPORT_SIZE, col + scrollAmount)

  viewportPosition.value = { row, col }
}

// Lifecycle
onUnmounted(() => {
  clearTimer(turnTimerInterval)
  clearTimer(playAgainTimerInterval)
  if (channel) {
    removeChannel(channel)
  }
})
</script>
