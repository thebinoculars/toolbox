import type { TextArtSettings } from '@/utils/localStorage'

const CHAR_WIDTH_RATIO = 0.45

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })

const buildText = (lyrics: string, lineSeparator: string) => {
  const formattedText = lyrics.trim().split(/\r?\n/).join(lineSeparator).replace(/\s+/g, ' ').trim()
  return formattedText.length > 0 ? `${formattedText} ` : 'TEXT '
}

export const renderTextArt = async (
  canvas: HTMLCanvasElement,
  imgSrc: string,
  settings: TextArtSettings,
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Could not get 2D context')
  }

  const { width, height, bgColor, brightness, contrast, fontFamily, fontSize, lineHeight } =
    settings
  const text = buildText(settings.lyrics, settings.lineSeparator)

  const img = await loadImage(imgSrc)

  const scale = Math.min(width / img.width, height / img.height)
  const actualWidth = Math.round(img.width * scale)
  const actualHeight = Math.round(img.height * scale)

  canvas.width = actualWidth
  canvas.height = actualHeight

  const offscreen = document.createElement('canvas')
  offscreen.width = actualWidth
  offscreen.height = actualHeight
  const offCtx = offscreen.getContext('2d')
  if (!offCtx) {
    throw new Error('Could not get offscreen context')
  }

  offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
  offCtx.drawImage(img, 0, 0, actualWidth, actualHeight)
  const imgData = offCtx.getImageData(0, 0, actualWidth, actualHeight).data

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, actualWidth, actualHeight)
  ctx.font = `600 ${fontSize}px "${fontFamily}", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const charStepX = fontSize * CHAR_WIDTH_RATIO
  const charStepY = lineHeight
  let charIdx = 0

  for (let y = charStepY / 2; y < actualHeight; y += charStepY) {
    for (let x = charStepX / 2; x < actualWidth; x += charStepX) {
      const px = Math.floor(x)
      const py = Math.floor(y)

      if (px >= actualWidth || py >= actualHeight) {
        continue
      }

      const i = (py * actualWidth + px) * 4
      if (imgData[i + 3] > 0) {
        ctx.fillStyle = `rgb(${imgData[i]}, ${imgData[i + 1]}, ${imgData[i + 2]})`
        ctx.fillText(text[charIdx % text.length], x, y)
        charIdx += 1
      }
    }
  }

  ctx.imageSmoothingEnabled = false
}
