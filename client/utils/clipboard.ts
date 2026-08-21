export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    throw error
  }
}

export const pasteFromClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText()
  } catch (error) {
    console.error('Failed to read clipboard:', error)
    throw error
  }
}
