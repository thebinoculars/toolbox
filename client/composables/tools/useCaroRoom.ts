import type { RealtimeChannel } from '@supabase/supabase-js'

import { useCaroGame } from '@/composables/tools/useCaroGame'
import { useCaroRules } from '@/composables/tools/useCaroRules'
import type { GameState, PlayAgainStatus, Player } from '@/utils/realtime'
import {
  createChannel,
  listenToChannelEvent,
  removeChannel,
  sendChannelMessage,
  subscribeToChannel,
} from '@/utils/realtime'

interface MoveMadePayload {
  row: number
  col: number
  player: string
  newGameState: GameState
  isTimeout?: boolean
}

const MAX_NAME_LENGTH = 20
const MAX_ROOM_ID_LENGTH = 8

const roomChannelName = (roomId: string) => `caro_room_${roomId}`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useCaroRoom = () => {
  const { createGameState, generateId } = useCaroRules()
  const message = useMessage()

  const loading = ref(false)
  const currentRoom = ref<string | null>(null)

  let channel: RealtimeChannel | null = null
  let isUnmounted = false

  const broadcast = (event: string, payload: unknown) => {
    if (channel) {
      sendChannelMessage(channel, event, payload)
    }
  }

  const game = useCaroGame({
    broadcast,
    onPlayAgainExpired: () => {
      leaveRoom()
      message.error('Play again time expired. Room closed.')
    },
  })
  const { localGameState, player, setState, publishLocalState, turnTimer, playAgainTimer } = game

  const validateName = (rawName: string) => {
    const name = rawName.trim()
    if (!name) {
      message.error('Please enter your name')
      return null
    }
    if (name.length > MAX_NAME_LENGTH) {
      message.error(`Name must be ${MAX_NAME_LENGTH} characters or less`)
      return null
    }
    return name
  }

  const createRoom = async (rawName: string, rawRoomId: string) => {
    loading.value = true

    try {
      const name = validateName(rawName)
      if (!name) return

      const customRoomId = rawRoomId.trim()
      if (customRoomId && customRoomId.length > MAX_ROOM_ID_LENGTH) {
        message.error(`Room code must be ${MAX_ROOM_ID_LENGTH} characters or less`)
        return
      }

      const roomId = customRoomId || generateId(8)
      const newPlayer: Player = { id: generateId(13), name, symbol: 'X' }

      currentRoom.value = roomId
      player.value = newPlayer
      setState(createGameState({ players: [newPlayer] }))

      subscribeToRoom()
      broadcast('player_joined', { player: newPlayer })
    } catch {
      message.error('Failed to create room')
    } finally {
      loading.value = false
    }
  }

  const joinRoom = async (rawName: string, rawRoomId: string) => {
    loading.value = true

    try {
      const name = validateName(rawName)
      if (!name) return

      const roomId = rawRoomId.trim()
      if (!roomId) {
        message.error('Please enter a room code')
        return
      }

      const playerId = generateId(13)
      const newPlayer: Player = { id: playerId, name, symbol: 'O' }

      player.value = newPlayer
      setState(createGameState({ players: [newPlayer] }))

      const tempChannel = createChannel(roomChannelName(roomId))
      if (!tempChannel) {
        message.error('Failed to create channel')
        return
      }

      listenToChannelEvent<{ player: Player }>(tempChannel, 'player_joined', (payload) => {
        const joined = payload.payload.player
        if (localGameState.value && !localGameState.value.players.find((p) => p.id === joined.id)) {
          const symbol = localGameState.value.players.length === 0 ? 'X' : 'O'
          localGameState.value.players.push({ ...joined, symbol })
          publishLocalState()
        }
      })

      listenToChannelEvent<{ players: Player[] }>(tempChannel, 'sync_players', (payload) => {
        if (localGameState.value) {
          localGameState.value.players = payload.payload.players
          publishLocalState()
        }
      })

      listenToChannelEvent<{ gameState: GameState }>(tempChannel, 'sync_state', (payload) => {
        if (localGameState.value) {
          setState(payload.payload.gameState)
        }
      })

      subscribeToChannel(tempChannel, (status: string) => {
        if (status === 'SUBSCRIBED') {
          sendChannelMessage(tempChannel, 'player_joined', { player: newPlayer })
          sendChannelMessage(tempChannel, 'request_state', { playerId })
        }
      })

      // Rooms are not persisted: a room only exists if a player already in it answers in time
      await wait(2000)

      if (isUnmounted) {
        await removeChannel(tempChannel)
        return
      }

      if (!localGameState.value || localGameState.value.players.length === 1) {
        await removeChannel(tempChannel)
        player.value = null
        localGameState.value = null
        game.gameState.value = null
        message.error('Room not found or no players in room')
        return
      }

      await removeChannel(tempChannel)
      if (isUnmounted) return

      currentRoom.value = roomId
      subscribeToRoom()

      await wait(100)
      if (isUnmounted) return
      broadcast('player_joined', { player: newPlayer })
    } catch {
      message.error('Failed to join room')
    } finally {
      loading.value = false
    }
  }

  const subscribeToRoom = () => {
    if (!currentRoom.value || isUnmounted) return

    const roomChannel = createChannel(roomChannelName(currentRoom.value))
    channel = roomChannel
    if (!roomChannel) return

    listenToChannelEvent<{ player: Player }>(roomChannel, 'player_joined', (payload) => {
      const joined = payload.payload.player
      const state = localGameState.value
      if (!state || state.players.find((p) => p.id === joined.id)) return

      const symbol = state.players.length === 0 ? 'X' : 'O'
      state.players.push({ ...joined, symbol })
      publishLocalState()

      // The host's player list is the source of truth for X/O assignment
      broadcast('sync_players', { players: state.players })

      if (state.players.length === 2 && !state.gameStarted) {
        state.gameStarted = true
        publishLocalState()
        broadcast('game_started', { gameState: state })
        turnTimer.start()
      }

      if (state.gameStarted) {
        broadcast('sync_state', { gameState: state })
      }
    })

    listenToChannelEvent<{ players: Player[] }>(roomChannel, 'sync_players', (payload) => {
      const { players } = payload.payload
      if (localGameState.value && players.length === 2 && !localGameState.value.gameStarted) {
        const syncedMyPlayer = players.find((p) => p.id === player.value?.id)
        if (syncedMyPlayer) {
          player.value = syncedMyPlayer
        }

        localGameState.value.players = players
        publishLocalState()
      }
    })

    listenToChannelEvent(roomChannel, 'request_state', () => {
      if (localGameState.value?.gameStarted) {
        broadcast('sync_state', { gameState: localGameState.value })
      }
    })

    listenToChannelEvent<{ gameState: GameState }>(roomChannel, 'sync_state', (payload) => {
      const newGameState = payload.payload.gameState
      if (localGameState.value) {
        setState(newGameState)
        if (newGameState.gameStarted && !newGameState.gameEnded) {
          turnTimer.start()
        }
      }
    })

    listenToChannelEvent<{ gameState: GameState }>(roomChannel, 'game_started', (payload) => {
      setState(payload.payload.gameState)
      turnTimer.start()
    })

    listenToChannelEvent<MoveMadePayload>(roomChannel, 'move_made', (payload) => {
      const { newGameState } = payload.payload
      if (!localGameState.value) return

      setState(newGameState)

      if (newGameState.gameStarted && !newGameState.gameEnded) {
        turnTimer.start()
      }

      if (newGameState.gameEnded) {
        turnTimer.stop()
        playAgainTimer.start()
      }
    })

    listenToChannelEvent<{ gameState: GameState }>(roomChannel, 'game_reset', (payload) => {
      game.resetGame(payload.payload.gameState)
    })

    listenToChannelEvent<PlayAgainStatus>(roomChannel, 'play_again_request', (payload) => {
      const { readyCount, totalPlayers, readyPlayers } = payload.payload
      game.playAgainStatus.value = { readyCount, totalPlayers, readyPlayers }
    })

    listenToChannelEvent(roomChannel, 'player_left', () => {
      leaveRoom()
      message.error('Other player left. Room closed.')
    })

    subscribeToChannel(roomChannel, (status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to room:', currentRoom.value)
      }
    })
  }

  const makeMove = (row: number, col: number) => {
    if (!currentRoom.value) return
    game.makeMove(row, col)
  }

  const playAgain = () => {
    if (!currentRoom.value) return
    game.requestPlayAgain()
  }

  const leaveRoom = async () => {
    if (currentRoom.value) {
      broadcast('player_left', {})
    }

    turnTimer.stop()
    playAgainTimer.stop()

    if (channel) {
      await removeChannel(channel)
      channel = null
    }

    currentRoom.value = null
    game.clear()
  }

  onUnmounted(() => {
    isUnmounted = true
    if (channel) {
      removeChannel(channel)
    }
  })

  return {
    loading,
    currentRoom,
    gameState: game.gameState,
    player,
    playAgainStatus: game.playAgainStatus,
    isMyTurn: game.isMyTurn,
    turnTimeLeft: turnTimer.timeLeft,
    playAgainTimeLeft: playAgainTimer.timeLeft,
    createRoom,
    joinRoom,
    makeMove,
    playAgain,
    leaveRoom,
  }
}
