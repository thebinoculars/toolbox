<template>
  <ConverterPanel
    encoded-label="Base64 String"
    decode-placeholder="Enter or paste Base64 string to decode..."
    download-prefix="base64"
    :encode="encode"
    :decode="decode"
  />
</template>

<script setup lang="ts">
import ConverterPanel from '@/components/tools/ConverterPanel.vue'

const encode = (text: string) => btoa(unescape(encodeURIComponent(text)))

const decode = (text: string) => decodeURIComponent(escape(atob(text)))
</script>
