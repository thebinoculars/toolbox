<template>
  <div class="flex flex-col h-full">
    <ToolToolbar label="Episode">
      <n-select
        v-model:value="selected"
        :options="episodeOptions"
        placeholder="Select episode..."
        class="w-48"
        size="small"
        @update:value="handleEpisodeChange"
      />
    </ToolToolbar>

    <div class="flex-1 overflow-y-auto p-5 mt-4">
      <n-spin :show="loading">
        <template v-if="!loading && !stamps.length">
          <n-empty
            description="No track data available for this episode"
            class="mt-16"
            size="large"
          >
          </n-empty>
        </template>

        <template v-else>
          <div class="md:px-4">
            <n-timeline size="large" :icon-size="28">
              <n-timeline-item
                v-for="(item, index) in stamps"
                :key="item.time || index"
                type="info"
                :time="item.time"
              >
                <template #icon>
                  <n-icon size="24" class="text-(--accent-primary)">
                    <Music />
                  </n-icon>
                </template>
                <template #header>
                  <div class="flex items-center justify-between pb-1">
                    <div
                      class="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 flex-1 min-w-0 pr-4"
                    >
                      <div
                        class="text-base font-bold truncate"
                        :title="item.song?.titles?.en || 'Unknown Title'"
                      >
                        {{ item.song?.titles?.en || 'Unknown Title' }}
                      </div>

                      <div
                        class="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"
                      ></div>

                      <n-text
                        depth="3"
                        class="flex items-center gap-1.5 text-sm truncate"
                        :title="item.album?.titles?.en || 'Unknown Album'"
                      >
                        <n-icon size="14" class="shrink-0"><Disc /></n-icon>
                        <span class="truncate">{{
                          item.album?.titles?.en || 'Unknown Album'
                        }}</span>
                      </n-text>
                    </div>

                    <div v-if="item.song?.id" class="shrink-0">
                      <n-tooltip trigger="hover" placement="left">
                        <template #trigger>
                          <n-button
                            tag="a"
                            :href="`${TRACK_URL}/${item.song.id}.mp3`"
                            target="_blank"
                            rel="noopener noreferrer"
                            circle
                            secondary
                            type="primary"
                            size="small"
                            class="shadow-sm"
                          >
                            <template #icon>
                              <n-icon><ExternalLink /></n-icon>
                            </template>
                          </n-button>
                        </template>
                        Listen on onepiecetracklist.com
                      </n-tooltip>
                    </div>
                  </div>
                </template>
              </n-timeline-item>
            </n-timeline>
          </div>
        </template>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Disc, ExternalLink, Music } from '@vicons/tabler'

import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { useLatestRequest } from '@/composables/tools/useLatestRequest'
import onePieceRepository from '@/repositories/onePieceRepository'
import type { OnePieceEpisode, OnePieceStamp } from '~/shared/types'

const message = useMessage()

const TRACK_URL = 'http://onepiecetracklist.com/Music'

const episodes = ref<OnePieceEpisode[]>([])
const stamps = ref<OnePieceStamp[]>([])
const title = ref('')
const release = ref('')
const selected = ref<number | null>(null)
const loading = ref(true)
const episodeRequest = useLatestRequest()

const episodeOptions = computed(() => {
  const uniqueKeys = new Set<number>()
  const options: Array<{ label: string; value: number }> = []

  for (const ep of episodes.value) {
    if (!uniqueKeys.has(ep.episode)) {
      uniqueKeys.add(ep.episode)
      options.push({
        label: `Episode ${ep.episode}`,
        value: ep.episode,
      })
    }
  }

  return options
})

const getList = async () => {
  try {
    const data = await onePieceRepository.getEpisodes()

    if (data) {
      episodes.value = data
      if (data.length > 0) {
        selected.value = data[0].episode
        await handleEpisodeChange()
      } else {
        loading.value = false
      }
    } else {
      throw new Error('Invalid response format')
    }
  } catch {
    message.error('Failed to fetch episode list')
    loading.value = false
  }
}

const handleEpisodeChange = async () => {
  if (!selected.value) {
    return
  }

  const isStale = episodeRequest.start()
  loading.value = true
  stamps.value = []
  title.value = ''
  release.value = ''

  try {
    const data = await onePieceRepository.getEpisode(selected.value)
    if (isStale()) {
      return
    }

    if (data) {
      stamps.value = data.stamps || []
      title.value = data.title_en || ''
      release.value = data.release_date || ''
    } else {
      throw new Error('Episode details not found')
    }
  } catch {
    if (!isStale()) {
      message.error('Failed to fetch episode details')
    }
  } finally {
    if (!isStale()) {
      loading.value = false
    }
  }
}

onMounted(() => {
  getList()
})
</script>
