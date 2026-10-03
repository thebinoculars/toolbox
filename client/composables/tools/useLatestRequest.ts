export const useLatestRequest = () => {
  let currentId = 0

  const start = () => {
    const id = ++currentId
    return () => id !== currentId
  }

  const invalidate = () => {
    currentId++
  }

  return { start, invalidate }
}
