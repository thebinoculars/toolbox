export const useCountdown = (seconds: number, onExpire: () => void) => {
  const timeLeft = ref(seconds)
  let interval: ReturnType<typeof setInterval> | null = null

  const stop = () => {
    if (interval) clearInterval(interval)
  }

  const reset = () => {
    timeLeft.value = seconds
  }

  const start = () => {
    reset()
    stop()
    interval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        stop()
        onExpire()
      }
    }, 1000)
  }

  onScopeDispose(stop)

  return { timeLeft, start, stop, reset }
}
