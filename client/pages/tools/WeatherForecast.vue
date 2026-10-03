<template>
  <div class="flex flex-col h-full">
    <ToolToolbar label="Search">
      <n-input
        v-model:value="searchInput"
        placeholder="Search location..."
        size="small"
        clearable
        class="flex-1"
        @keyup.enter="handleSearch"
      />
      <n-button size="tiny" :loading="loading" @click="handleSearch">
        <template #icon
          ><n-icon><Search /></n-icon
        ></template>
        Search
      </n-button>
      <n-button size="tiny" @click="handleDetectCurrentLocation">
        <template #icon
          ><n-icon><MapPin /></n-icon
        ></template>
        Current
      </n-button>
    </ToolToolbar>

    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full overflow-hidden flex flex-col lg:flex-row gap-4">
        <div
          class="flex-1 rounded-2xl border overflow-hidden flex flex-col bg-(--bg-secondary) border-(--border-color) relative"
        >
          <div
            v-if="isLoadingMap"
            class="absolute inset-0 flex items-center justify-center z-10 bg-black/5 backdrop-blur-sm"
          >
            <n-spin size="large" />
          </div>
          <div
            v-if="mapError"
            class="absolute inset-0 flex items-center justify-center z-10 p-4 text-center text-sm text-red-400"
          >
            {{ mapError }}
          </div>
          <div ref="mapRef" class="w-full h-full"></div>
          <div
            v-if="!isLoadingMap"
            class="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-xl text-white text-xs shadow-2xl border border-white/10 pointer-events-none"
          >
            <div class="flex items-center gap-4">
              <div><span class="opacity-60">Lat:</span> {{ currentCoords?.lat.toFixed(4) }}</div>
              <div><span class="opacity-60">Lng:</span> {{ currentCoords?.lng.toFixed(4) }}</div>
            </div>
          </div>
        </div>

        <div
          class="w-full lg:w-80 rounded-2xl border p-4 flex flex-col overflow-y-auto bg-(--bg-secondary) border-(--border-color) shrink-0"
        >
          <template v-if="currentWeather">
            <div class="mb-6">
              <div class="text-center mb-4">
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <h2 class="text-sm font-medium mb-3 opacity-80 truncate px-2 cursor-help">
                      {{ locationName }}
                    </h2>
                  </template>
                  {{ locationName }}
                </n-tooltip>
                <div class="flex items-center justify-center gap-4 flex-wrap">
                  <img
                    :src="currentWeather.iconUrl"
                    :alt="currentWeather.description"
                    class="w-20 h-20"
                  />
                  <div>
                    <div class="text-4xl font-bold">
                      {{ Math.round(currentWeather.temperature) }}°C
                    </div>
                    <div class="text-lg capitalize">{{ currentWeather.description }}</div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Feels like</div>
                  <div class="font-semibold text-sm">
                    {{ Math.round(currentWeather.feelsLike) }}°C
                  </div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Humidity</div>
                  <div class="font-semibold text-sm">{{ currentWeather.humidity }}%</div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Pressure</div>
                  <div class="font-semibold text-sm">{{ currentWeather.pressure }} hPa</div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Wind Speed</div>
                  <div class="font-semibold text-sm">{{ currentWeather.windSpeed }} m/s</div>
                </div>
              </div>
            </div>

            <div v-if="forecast.length > 0" class="mt-6">
              <h3 class="text-sm font-bold mb-3">5-Day Forecast</h3>
              <div class="space-y-2">
                <div
                  v-for="item in forecast"
                  :key="item.time"
                  class="rounded-xl p-3 text-xs flex items-center gap-3 bg-linear-to-r from-(--bg-primary) to-transparent border-(--border-color) hover:border-(--icon-color) transition-colors"
                >
                  <div class="w-14 text-center shrink-0">
                    <div class="font-semibold">{{ formatDate(item.time).split(' ')[1] }}</div>
                    <div class="opacity-60 text-[10px]">
                      {{ formatDate(item.time).split(' ')[0] }}
                    </div>
                  </div>
                  <img :src="item.iconUrl" :alt="item.description" class="w-10 h-10 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm">{{ Math.round(item.temperature) }}°C</div>
                    <div class="opacity-70 capitalize truncate">{{ item.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <n-empty
            v-else-if="!loading"
            description="Search for a city or click on the map"
            size="small"
            class="mt-8"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Search } from '@vicons/tabler'

import ToolToolbar from '@/components/tools/ToolToolbar.vue'
import { geocode, type LatLng, useGoogleMap } from '@/composables/tools/useGoogleMap'
import { useLatestRequest } from '@/composables/tools/useLatestRequest'
import proxyRepository from '@/repositories/proxyRepository'
import type { OpenMeteoData } from '~/shared/types'

interface WeatherCondition {
  description: string
  iconUrl: string
}

interface CurrentWeather extends WeatherCondition {
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
}

interface ForecastItem extends WeatherCondition {
  time: number
  temperature: number
}

const message = useMessage()

const DEFAULT_CENTER: LatLng = { lat: 21.0285, lng: 105.8542 }
const FORECAST_STEP_HOURS = 3
const FORECAST_DAYS = 5

const WEATHER_GROUPS = [
  { max: 0, icon: '01', description: 'clear sky' },
  { max: 1, icon: '02', description: 'mainly clear' },
  { max: 2, icon: '03', description: 'partly cloudy' },
  { max: 3, icon: '04', description: 'overcast' },
  { max: 48, icon: '50', description: 'fog' },
  { max: 57, icon: '09', description: 'drizzle' },
  { max: 65, icon: '10', description: 'rain' },
  { max: 67, icon: '13', description: 'freezing rain' },
  { max: 77, icon: '13', description: 'snow' },
  { max: 82, icon: '09', description: 'rain showers' },
  { max: 86, icon: '13', description: 'snow showers' },
  { max: 99, icon: '11', description: 'thunderstorm' },
]

const describeWeather = (code: number, isDay: number): WeatherCondition => {
  const { description, icon } = WEATHER_GROUPS.find((group) => code <= group.max) ?? {
    description: 'unknown',
    icon: '03',
  }
  return {
    description,
    iconUrl: `https://openweathermap.org/img/wn/${icon}${isDay ? 'd' : 'n'}@4x.png`,
  }
}

const toCurrentWeather = ({ current }: OpenMeteoData): CurrentWeather => ({
  temperature: current.temperature_2m,
  feelsLike: current.apparent_temperature,
  humidity: current.relative_humidity_2m,
  pressure: Math.round(current.pressure_msl),
  windSpeed: current.wind_speed_10m,
  ...describeWeather(current.weather_code, current.is_day),
})

const toForecast = ({ current, hourly }: OpenMeteoData): ForecastItem[] =>
  hourly.time
    .map((time, i) => ({
      time,
      temperature: hourly.temperature_2m[i],
      ...describeWeather(hourly.weather_code[i], hourly.is_day[i]),
    }))
    .filter(
      ({ time }) =>
        time > current.time && new Date(time * 1000).getHours() % FORECAST_STEP_HOURS === 0,
    )
    .slice(0, (FORECAST_DAYS * 24) / FORECAST_STEP_HOURS)

const loading = ref(false)
const currentWeather = ref<CurrentWeather | null>(null)
const forecast = ref<ForecastItem[]>([])
const currentCoords = ref<LatLng | null>(null)
const searchInput = ref('')
const locationName = ref('Hanoi')
const mapRef = ref<HTMLElement | null>(null)

const weatherRequest = useLatestRequest()

const { isLoadingMap, mapError, loadMap, placeMarker } = useGoogleMap(mapRef, (lat, lng) =>
  fetchWeatherByCoords(lat, lng, false),
)

const clearWeather = () => {
  currentWeather.value = null
  forecast.value = []
}

const fetchWeatherByCoords = async (lat: number, lng: number, shouldCenterMap = false) => {
  const isStale = weatherRequest.start()
  loading.value = true

  try {
    currentCoords.value = { lat, lng }
    const fallbackName = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
    let name: string
    try {
      const results = await geocode({ location: { lat, lng } })
      name = results[0]?.formatted_address || fallbackName
    } catch {
      name = fallbackName
    }
    if (isStale()) return
    locationName.value = name

    const data = await proxyRepository.getWeather(lat, lng)
    if (isStale()) return

    currentWeather.value = toCurrentWeather(data)
    forecast.value = toForecast(data)

    placeMarker(lat, lng, shouldCenterMap)
  } catch {
    if (isStale()) return
    message.error('Failed to fetch weather data')
    clearWeather()
  } finally {
    if (!isStale()) {
      loading.value = false
    }
  }
}

const fetchWeatherByAddress = async (address: string) => {
  const isStale = weatherRequest.start()
  loading.value = true

  try {
    const results = await geocode({ address })
    if (isStale()) return
    const { location } = results[0].geometry

    locationName.value = results[0].formatted_address
    await fetchWeatherByCoords(location.lat(), location.lng(), true)
  } catch (error) {
    if (isStale()) return
    message.error(error instanceof Error ? error.message : 'Failed to find location')
    clearWeather()
    loading.value = false
  }
}

const handleSearch = async () => {
  if (!searchInput.value.trim()) {
    message.error('Please enter a location')
    return
  }

  await fetchWeatherByAddress(searchInput.value)
  searchInput.value = ''
}

const handleDetectCurrentLocation = async () => {
  if (!navigator.geolocation) {
    message.error('Geolocation is not supported by this browser')
    return
  }

  loading.value = true

  navigator.geolocation.getCurrentPosition(
    async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      await fetchWeatherByCoords(latitude, longitude)
    },
    () => {
      message.error('Location access denied')
      loading.value = false
    },
  )
}

const resolveInitialCenter = async (): Promise<LatLng> => {
  if (currentCoords.value) {
    return currentCoords.value
  }
  try {
    const results = await geocode({ address: locationName.value })
    const { location } = results[0].geometry
    return { lat: location.lat(), lng: location.lng() }
  } catch {
    return DEFAULT_CENTER
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  return `${day}/${month} ${hour}:00`
}

onMounted(async () => {
  if (await loadMap(resolveInitialCenter, () => currentCoords.value)) {
    await fetchWeatherByAddress(locationName.value)
  }
})
</script>
