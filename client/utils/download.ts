export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(objectUrl)
}

export const downloadBlob = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export const downloadCanvasImage = (dataUrl: string, filename: string): void => {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
