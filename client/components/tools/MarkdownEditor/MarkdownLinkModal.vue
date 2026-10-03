<template>
  <n-modal
    v-model:show="show"
    preset="card"
    :title="mode === 'link' ? 'Insert Link' : 'Insert Image'"
    class="max-w-100"
  >
    <div class="space-y-3">
      <n-form-item :label="mode === 'link' ? 'Display Text' : 'Alt Text'">
        <n-input
          v-model:value="text"
          :placeholder="mode === 'link' ? 'Link text' : 'Image alt text'"
        />
      </n-form-item>
      <n-form-item label="URL">
        <n-input v-model:value="url" placeholder="https://..." @keydown.enter="handleConfirm" />
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
type LinkModalMode = 'link' | 'image'

const emit = defineEmits<{ insert: [markdown: string] }>()

const show = ref(false)
const mode = ref<LinkModalMode>('link')
const text = ref('')
const url = ref('')

const open = (newMode: LinkModalMode, initialText: string) => {
  mode.value = newMode
  text.value = initialText
  url.value = ''
  show.value = true
}

const handleConfirm = () => {
  if (!url.value) {
    return
  }
  const label = text.value || (mode.value === 'link' ? 'link' : 'image')
  emit('insert', mode.value === 'link' ? `[${label}](${url.value})` : `![${label}](${url.value})`)
  show.value = false
}

defineExpose({ open })
</script>
