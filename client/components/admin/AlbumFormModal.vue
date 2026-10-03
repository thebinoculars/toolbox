<template>
  <n-modal v-model:show="show" preset="card" :title="title" class="max-w-md">
    <n-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleSubmit">
      <n-form-item label="Album Name" path="name">
        <n-input
          v-model:value="form.name"
          :placeholder="isCreate ? 'Enter album name...' : undefined"
        />
      </n-form-item>
      <n-button type="primary" block :loading="loading" attr-type="submit">
        {{ submitText }}
      </n-button>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'

import type { AlbumInput } from '@/repositories/albumRepository'

const props = defineProps<{
  mode: 'create' | 'edit'
  title: string
  submitText: string
  loading: boolean
}>()

const emit = defineEmits<{ submit: [] }>()

const show = defineModel<boolean>('show', { required: true })
const form = defineModel<Required<AlbumInput>>('form', { required: true })

const formRef = ref<FormInst | null>(null)

const isCreate = computed(() => props.mode === 'create')

const rules: FormRules = {
  name: {
    required: true,
    message: 'Please input the album name',
    trigger: ['input', 'blur'],
  },
}

const handleSubmit = () => {
  formRef.value?.validate((errors) => {
    if (!errors) {
      emit('submit')
    }
  })
}
</script>
