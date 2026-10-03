import { copyToClipboard } from '@/utils/clipboard'

export const useCopyFeedback = (duration = 2000) => {
  const message = useMessage()
  const copied = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  const copy = async (text: string) => {
    try {
      await copyToClipboard(text)
      copied.value = true
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        copied.value = false
      }, duration)
    } catch {
      message.error('Failed to copy to clipboard')
    }
  }

  onScopeDispose(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return { copied, copy }
}
