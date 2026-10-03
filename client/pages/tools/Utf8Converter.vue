<template>
  <ConverterPanel
    encoded-label="Encoded String"
    decode-placeholder="Enter or paste encoded string to decode..."
    download-prefix="utf8"
    :encode="encode"
    :decode="decode"
  />
</template>

<script setup lang="ts">
import ConverterPanel from '@/components/tools/ConverterPanel.vue'

const encode = (text: string) =>
  Array.from(new TextEncoder().encode(text))
    .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
    .join('')

const decode = (text: string) => {
  const hexString = text.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  )
  const bytes = hexString.split('').map((c) => c.charCodeAt(0))
  return new TextDecoder().decode(new Uint8Array(bytes))
}
</script>
