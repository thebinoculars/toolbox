export const truncateText = (text: string | null, maxLength: number): string => {
  if (!text) {
    return 'N/A'
  }

  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength) + '...'
}

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) {
    return 'N/A'
  }

  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
}

export const formatDate = (dateString: string | null): string => {
  if (!dateString) {
    return 'N/A'
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}
