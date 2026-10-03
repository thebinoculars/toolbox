import {
  PLAY_AGAIN_TIME_LIMIT,
  TURN_TIME_LIMIT,
  useCaroRules,
} from '@/composables/tools/useCaroRules'
import { useCountdown } from '@/composables/tools/useCountdown'
import type { GameState, PlayAgainStatus, Player } from '@/utils/realtime'

interface CaroGameOptions {
  broadcast: (event: string, payload: unknown) => void
  onPlayAgainExpired: () => void
}

export const useCaroGame = ({ broadcast, onPlayAgainExpired }: CaroGameOptions) => {
  const message = useMessage()
  const { createGameState, findWinningCells, opponentOf } = useCaroRules()

  const gameState = ref<GameState | null>(null)
  const localGameState = ref<GameState | null>(null)
  const player = ref<Player | null>(null)
  const playAgainStatus = ref<PlayAgainStatus | null>(null)

  const turnTimer = useCountdown(TURN_TIME_LIMIT, () => handleTurnTimeout())
  const playAgainTimer = useCountdown(PLAY_AGAIN_TIME_LIMIT, onPlayAgainExpired)

  const isMyTurn = computed(() =>
    Boolean(
      player.value?.symbol === gameState.value?.currentPlayer &&
      !gameState.value?.gameEnded &&
      gameState.value?.gameStarted,
    ),
  )

  const setState = (state: GameState) => {
    localGameState.value = state
    gameState.value = { ...localGameState.value }
  }

  const publishLocalState = () => {
    if (localGameState.value) {
      gameState.value = { ...localGameState.value }
    }
  }

  const clear = () => {
    turnTimer.stop()
    playAgainTimer.stop()
    gameState.value = null
    localGameState.value = null
    player.value = null
    playAgainStatus.value = null
    turnTimer.reset()
    playAgainTimer.reset()
  }

  const makeMove = (row: number, col: number) => {
    if (!gameState.value || !player.value) return
    if (gameState.value.gameEnded) return
    if (gameState.value.board[row][col] !== null) return
    if (player.value.symbol !== gameState.value.currentPlayer) return

    try {
      const newBoard = gameState.value.board.map((r) => [...r])
      newBoard[row][col] = player.value.symbol

      const winningCells = findWinningCells(newBoard, row, col, player.value.symbol)
      const newGameState = { ...gameState.value, board: newBoard }

      if (winningCells) {
        newGameState.gameEnded = true
        newGameState.winner = player.value.symbol
        newGameState.winningCells = winningCells
      } else {
        newGameState.currentPlayer = opponentOf(newGameState.currentPlayer)
      }

      setState(newGameState)
      broadcast('move_made', { row, col, player: player.value.symbol, newGameState })

      turnTimer.stop()
      if (newGameState.gameEnded) {
        playAgainTimer.start()
      } else {
        turnTimer.start()
      }
    } catch {
      message.error('Failed to make move')
    }
  }

  const handleTurnTimeout = () => {
    if (!gameState.value) return

    try {
      const loser = gameState.value.currentPlayer
      const newGameState = { ...gameState.value, gameEnded: true, winner: opponentOf(loser) }

      setState(newGameState)
      message.error(`${loser} ran out of time!`)
      broadcast('move_made', { row: -1, col: -1, player: loser, newGameState, isTimeout: true })

      playAgainTimer.start()
    } catch {
      message.error('Failed to handle timeout')
    }
  }

  const resetGame = (state: GameState) => {
    setState(state)
    playAgainStatus.value = null
    playAgainTimer.reset()
    playAgainTimer.stop()
    turnTimer.start()
  }

  const requestPlayAgain = () => {
    if (!gameState.value || !player.value) return

    try {
      if (!playAgainStatus.value) {
        playAgainStatus.value = {
          readyCount: 1,
          totalPlayers: gameState.value.players.length,
          readyPlayers: [player.value.id],
        }
      } else if (!playAgainStatus.value.readyPlayers.includes(player.value.id)) {
        playAgainStatus.value.readyCount++
        playAgainStatus.value.readyPlayers.push(player.value.id)
      }

      broadcast('play_again_request', playAgainStatus.value)

      if (playAgainStatus.value.readyCount === 2) {
        const resetGameState = createGameState({
          currentPlayer: opponentOf(gameState.value.currentPlayer),
          gameStarted: true,
          players: gameState.value.players,
        })
        resetGame(resetGameState)
        broadcast('game_reset', { gameState: resetGameState })
      }
    } catch {
      message.error('Failed to play again')
    }
  }

  return {
    gameState,
    localGameState,
    player,
    playAgainStatus,
    isMyTurn,
    turnTimer,
    playAgainTimer,
    setState,
    publishLocalState,
    clear,
    makeMove,
    resetGame,
    requestPlayAgain,
  }
}
