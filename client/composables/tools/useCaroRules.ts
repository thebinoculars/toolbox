import type { GameState, Player } from '@/utils/realtime'

export const BOARD_SIZE = 128
export const CELL_SIZE = 30
export const VIEWPORT_SIZE = 25
export const TURN_TIME_LIMIT = 30
export const PLAY_AGAIN_TIME_LIMIT = 30

type PlayerSymbol = Player['symbol']
type Board = GameState['board']

const WIN_LENGTH = 5
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
]

const opponentOf = (symbol: PlayerSymbol): PlayerSymbol => (symbol === 'X' ? 'O' : 'X')

const generateId = (length: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length)

const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  board: Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null)),
  currentPlayer: 'X',
  gameStarted: false,
  gameEnded: false,
  winner: null,
  winningCells: null,
  players: [],
  ...overrides,
})

const collectLine = (
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  symbol: string,
): [number, number][] => {
  const cells: [number, number][] = []
  for (let i = 1; i < WIN_LENGTH; i++) {
    const r = row + dx * i
    const c = col + dy * i
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || board[r][c] !== symbol) {
      break
    }
    cells.push([r, c])
  }
  return cells
}

const findWinningCells = (
  board: Board,
  row: number,
  col: number,
  symbol: string,
): [number, number][] | null => {
  for (const [dx, dy] of DIRECTIONS) {
    const cells: [number, number][] = [
      [row, col],
      ...collectLine(board, row, col, dx, dy, symbol),
      ...collectLine(board, row, col, -dx, -dy, symbol),
    ]
    if (cells.length >= WIN_LENGTH) {
      return cells
    }
  }
  return null
}

export const useCaroRules = () => ({
  createGameState,
  findWinningCells,
  generateId,
  opponentOf,
})
