<template>
  <div
    ref="boardRef"
    class="shrink-0 relative overflow-hidden cursor-crosshair"
    style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
    tabindex="0"
    :style="{ width: `${boardPixelSize}px`, height: `${boardPixelSize}px` }"
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
        top: `${(rowObj.rowIndex - viewport.row) * CELL_SIZE}px`,
        left: '0',
        width: `${boardPixelSize}px`,
        height: `${CELL_SIZE}px`,
      }"
    >
      <div
        v-for="(cell, colIndex) in rowObj.cells"
        :key="`${rowObj.rowIndex}-${colIndex + viewport.col}`"
        class="absolute border border-gray-700 flex items-center justify-center transition-all"
        :style="cellStyle(rowObj.rowIndex, colIndex + viewport.col, cell, colIndex)"
        :class="{
          'bg-[rgba(139,92,246,0.8)]! animate-pulse': isWinningCell(
            rowObj.rowIndex,
            colIndex + viewport.col,
          ),
        }"
        @click="emit('cellClick', rowObj.rowIndex, colIndex + viewport.col)"
      >
        <span
          v-if="cell"
          class="cell-content font-bold text-xl"
          :class="cell === 'X' ? 'text-green-400' : 'text-red-400'"
        >
          {{ cell }}
        </span>
        <span
          v-if="isHovered(rowObj.rowIndex, colIndex + viewport.col) && isMyTurn && cell === null"
          class="cell-preview font-bold text-xl opacity-50"
          :class="player?.symbol === 'X' ? 'text-green-400' : 'text-red-400'"
        >
          {{ player?.symbol }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

import { BOARD_SIZE, CELL_SIZE, VIEWPORT_SIZE } from '@/composables/tools/useCaroRules'
import type { GameState, Player } from '@/utils/realtime'

const props = defineProps<{
  gameState: GameState | null
  player: Player | null
  isMyTurn: boolean
}>()

const emit = defineEmits<{ cellClick: [row: number, col: number] }>()

const WHEEL_SCROLL_STEP = 3
const KEY_SCROLL_STEP = 5
const MAX_VIEWPORT_OFFSET = BOARD_SIZE - VIEWPORT_SIZE

const boardPixelSize = VIEWPORT_SIZE * CELL_SIZE

const boardRef = ref<HTMLDivElement | null>(null)
const hoveredCell = ref<{ row: number; col: number } | null>(null)
const viewport = ref<{ row: number; col: number }>({ row: 0, col: 0 })

const visibleBoard = computed(() => {
  if (!props.gameState) return []
  const { row: startRow, col: startCol } = viewport.value
  const endRow = Math.min(startRow + VIEWPORT_SIZE, BOARD_SIZE)
  const endCol = Math.min(startCol + VIEWPORT_SIZE, BOARD_SIZE)

  const board: { cells: (string | null)[]; rowIndex: number }[] = []
  for (let row = startRow; row < endRow; row++) {
    board.push({ cells: props.gameState.board[row].slice(startCol, endCol), rowIndex: row })
  }
  return board
})

const isHovered = (row: number, col: number) =>
  hoveredCell.value?.row === row && hoveredCell.value?.col === col

const isWinningCell = (row: number, col: number) =>
  props.gameState?.winningCells?.some(([r, c]) => r === row && c === col) ?? false

const cellBackground = (row: number, col: number, cell: string | null) => {
  if (cell !== null) return 'rgba(31, 41, 55, 0.3)'
  if (isHovered(row, col)) {
    if (props.isMyTurn && props.player?.symbol === 'X') return 'rgba(59, 130, 246, 0.2)'
    if (props.isMyTurn && props.player?.symbol === 'O') return 'rgba(239, 68, 68, 0.2)'
    if (!props.isMyTurn && !props.gameState?.gameEnded) return 'rgba(239, 68, 68, 0.1)'
  }
  return 'transparent'
}

const cellCursor = (row: number, col: number, cell: string | null) => {
  if (cell !== null) return 'default'
  if (isHovered(row, col) && !props.isMyTurn) return 'not-allowed'
  return props.isMyTurn ? 'pointer' : 'default'
}

const cellStyle = (
  row: number,
  col: number,
  cell: string | null,
  colIndex: number,
): CSSProperties => ({
  left: `${colIndex * CELL_SIZE}px`,
  top: '0',
  width: `${CELL_SIZE}px`,
  height: `${CELL_SIZE}px`,
  backgroundColor: cellBackground(row, col, cell),
  cursor: cellCursor(row, col, cell),
  zIndex: isWinningCell(row, col) ? 10 : 1,
})

const clampOffset = (value: number) => Math.max(0, Math.min(MAX_VIEWPORT_OFFSET, value))

const handleMouseMove = (e: MouseEvent) => {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL_SIZE) + viewport.value.col
  const row = Math.floor((e.clientY - rect.top) / CELL_SIZE) + viewport.value.row
  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
    hoveredCell.value = { row, col }
  }
}

const handleScroll = (e: WheelEvent) => {
  e.preventDefault()
  viewport.value = {
    row: clampOffset(viewport.value.row + (e.deltaY > 0 ? WHEEL_SCROLL_STEP : -WHEEL_SCROLL_STEP)),
    col: clampOffset(viewport.value.col + (e.deltaX > 0 ? WHEEL_SCROLL_STEP : -WHEEL_SCROLL_STEP)),
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  let { row, col } = viewport.value

  if (e.key === 'ArrowUp') row = Math.max(0, row - KEY_SCROLL_STEP)
  if (e.key === 'ArrowDown') row = Math.min(MAX_VIEWPORT_OFFSET, row + KEY_SCROLL_STEP)
  if (e.key === 'ArrowLeft') col = Math.max(0, col - KEY_SCROLL_STEP)
  if (e.key === 'ArrowRight') col = Math.min(MAX_VIEWPORT_OFFSET, col + KEY_SCROLL_STEP)

  viewport.value = { row, col }
}
</script>
