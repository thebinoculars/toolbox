<template>
  <div
    class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
  >
    <span v-if="label" class="text-xs font-medium text-(--icon-color) shrink-0">{{ label }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label?: string }>()
</script>
