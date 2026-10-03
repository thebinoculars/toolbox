<template>
  <n-modal v-model:show="show" preset="card" title="Insert Table" class="max-w-100">
    <div class="space-y-3">
      <n-form-item label="Columns">
        <n-input-number v-model:value="cols" :min="1" :max="20" placeholder="Number of columns" />
      </n-form-item>
      <n-form-item label="Rows">
        <n-input-number v-model:value="rows" :min="1" :max="20" placeholder="Number of rows" />
      </n-form-item>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button @click="show = false">Cancel</n-button>
        <n-button type="primary" @click="handleConfirm">Insert</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
const DEFAULT_SIZE = 2

const emit = defineEmits<{ insert: [markdown: string] }>()

const show = ref(false)
const cols = ref<number | null>(DEFAULT_SIZE)
const rows = ref<number | null>(DEFAULT_SIZE)

const tableRow = (count: number, cell: (index: number) => string) =>
  `| ${Array.from({ length: count }, (_, i) => `${cell(i)} | `).join('')}`.trim() + '\n'

const buildTable = (colCount: number, rowCount: number) =>
  tableRow(colCount, (i) => `Col ${i + 1}`) +
  tableRow(colCount, () => '-------') +
  Array.from({ length: rowCount }, () => tableRow(colCount, () => 'Cell ')).join('')

const open = () => {
  cols.value = DEFAULT_SIZE
  rows.value = DEFAULT_SIZE
  show.value = true
}

const handleConfirm = () => {
  emit('insert', buildTable(cols.value ?? 0, rows.value ?? 0))
  show.value = false
}

defineExpose({ open })
</script>
