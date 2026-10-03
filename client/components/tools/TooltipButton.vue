<template>
  <n-tooltip :placement="placement">
    <template #trigger>
      <n-button v-bind="$attrs">
        <template #icon>
          <n-icon><component :is="icon" /></n-icon>
        </template>
      </n-button>
    </template>
    {{ label }}
  </n-tooltip>
</template>

<script setup lang="ts">
import type { PopoverPlacement } from 'naive-ui'
import type { Component } from 'vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    icon: Component
    label: string
    placement?: PopoverPlacement
  }>(),
  { placement: 'top' },
)
</script>
