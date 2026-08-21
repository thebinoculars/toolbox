<template>
  <div class="flex flex-col h-full">
    <!-- Input bar -->
    <div
      class="border-b px-3 py-2 flex items-center gap-2 shrink-0 bg-[#2a2a2e] border-(--border-color)"
    >
      <span class="text-xs font-medium text-(--icon-color)">Search</span>
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
    </div>

    <!-- Two column layout -->
    <div class="flex-1 overflow-hidden p-4">
      <div class="h-full overflow-hidden flex flex-col lg:flex-row gap-4">
        <!-- Left: Map -->
        <div
          class="flex-1 rounded-2xl border overflow-hidden flex flex-col bg-(--bg-secondary) border-(--border-color) relative"
        >
          <div
            v-if="isLoadingMap"
            class="absolute inset-0 flex items-center justify-center z-10 bg-black/5 backdrop-blur-sm"
          >
            <n-spin size="large" />
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

        <!-- Right: Weather Info -->
        <div
          class="w-full lg:w-80 rounded-2xl border p-4 flex flex-col overflow-y-auto bg-(--bg-secondary) border-(--border-color) shrink-0"
        >
          <template v-if="currentWeather">
            <!-- Current Weather -->
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
                    v-if="currentWeather.weather && currentWeather.weather[0]"
                    :src="`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@4x.png`"
                    :alt="currentWeather.weather[0].description"
                    class="w-20 h-20"
                  />
                  <div>
                    <div class="text-4xl font-bold">
                      {{ Math.round(currentWeather.main.temp) }}°C
                    </div>
                    <div class="text-lg capitalize">
                      {{
                        currentWeather.weather && currentWeather.weather[0]
                          ? currentWeather.weather[0].description
                          : 'Weather data unavailable'
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Weather Details -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Feels like</div>
                  <div class="font-semibold text-sm">
                    {{ Math.round(currentWeather.main.feels_like) }}°C
                  </div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Humidity</div>
                  <div class="font-semibold text-sm">{{ currentWeather.main.humidity }}%</div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Pressure</div>
                  <div class="font-semibold text-sm">{{ currentWeather.main.pressure }} hPa</div>
                </div>
                <div class="rounded-lg bg-(--bg-primary) p-3 border-(--border-color)">
                  <div class="opacity-60 mb-1">Wind Speed</div>
                  <div class="font-semibold text-sm">{{ currentWeather.wind.speed }} m/s</div>
                </div>
              </div>
            </div>

            <!-- Forecast -->
            <div v-if="forecast.length > 0" class="mt-6">
              <h3 class="text-sm font-bold mb-3">5-Day Forecast</h3>
              <div class="space-y-2">
                <div
                  v-for="item in forecast"
                  :key="item.dt"
                  class="rounded-xl p-3 text-xs flex items-center gap-3 bg-linear-to-r from-(--bg-primary) to-transparent border-(--border-color) hover:border-(--icon-color) transition-colors"
                >
                  <div class="w-14 text-center shrink-0">
                    <div class="font-semibold">{{ formatDate(item.dt).split(' ')[1] }}</div>
                    <div class="opacity-60 text-[10px]">
                      {{ formatDate(item.dt).split(' ')[0] }}
                    </div>
                  </div>
                  <img
                    v-if="item.weather?.[0]"
                    :src="`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`"
                    :alt="item.weather[0].description"
                    class="w-10 h-10 shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="font-bold text-sm">{{ Math.round(item.main.temp) }}°C</div>
                    <div class="opacity-70 capitalize truncate">
                      {{ item.weather?.[0]?.description }}
                    </div>
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

import proxyRepository from '@/repositories/proxyRepository'

import { getGoogleMapsApiKey } from '../../../shared/utils'

const message = useMessage()

interface WeatherInfo {
  main: { temp: number; feels_like: number; humidity: number; pressure: number }
  weather: Array<{ icon: string; description: string }>
  wind: { speed: number }
}

interface WeatherForecastItem {
  dt: number
  main: { temp: number; temp_min: number; temp_max: number; humidity: number }
  weather: Array<{ icon: string; description: string }>
}

interface GoogleMap {
  setCenter: (latLng: { lat: number; lng: number }) => void
  addListener: (
    event: string,
    handler: (e: { latLng: { lat: () => number; lng: () => number } }) => void,
  ) => void
}

interface GoogleMarker {
  setPosition: (latLng: { lat: number; lng: number }) => void
}

interface GoogleGeocoderResult {
  formatted_address: string
  geometry: {
    location: {
      lat: () => number
      lng: () => number
    }
  }
}

interface GoogleMapsWindow {
  google: {
    maps: {
      Map: new (element: HTMLElement, options: any) => GoogleMap
      Marker: new (options: any) => GoogleMarker
      Geocoder: new () => {
        geocode: (
          options: { location?: { lat: number; lng: number }; address?: string },
          callback: (results: GoogleGeocoderResult[], status: string) => void,
        ) => void
      }
      Animation: {
        DROP: number
      }
    }
  }
}

const loading = ref(false)
const isLoadingMap = ref(false)
const currentWeather = ref<WeatherInfo | null>(null)
const forecast = ref<WeatherForecastItem[]>([])
const currentCoords = ref<{ lat: number; lng: number } | null>(null)
const searchInput = ref('')
const locationName = ref('Hanoi')
const mapRef = ref<HTMLElement | null>(null)
const googleMap = shallowRef<GoogleMap | null>(null)
const marker = shallowRef<GoogleMarker | null>(null)

const MAP_KEY = getGoogleMapsApiKey()

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
]

const performGeocode = async (options: {
  location?: { lat: number; lng: number }
  address?: string
}) => {
  const google = (window as unknown as GoogleMapsWindow).google
  if (!google) {
    throw new Error('Google Maps API not loaded')
  }

  const geocoder = new google.maps.Geocoder()
  return new Promise<GoogleGeocoderResult[]>((resolve, reject) => {
    geocoder.geocode(options, (results: GoogleGeocoderResult[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        resolve(results)
      } else {
        reject(new Error('Geocoding failed'))
      }
    })
  })
}

const fetchWeatherByCoords = async (lat: number, lng: number, shouldCenterMap = false) => {
  loading.value = true

  try {
    currentCoords.value = { lat, lng }
    try {
      const results = await performGeocode({ location: { lat, lng } })
      locationName.value =
        results.length > 0
          ? results[0].formatted_address || `${lat.toFixed(2)}, ${lng.toFixed(2)}`
          : `${lat.toFixed(2)}, ${lng.toFixed(2)}`
    } catch {
      locationName.value = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
    }
    const currentData = await proxyRepository.getCurrentWeather(lat, lng)

    const forecastData = await proxyRepository.getForecast(lat, lng)

    if (!currentData || !forecastData || typeof forecastData !== 'object') {
      throw new Error('Invalid data received')
    }

    currentWeather.value = currentData as WeatherInfo
    forecast.value = (forecastData as { list: WeatherForecastItem[] }).list || []

    updateMapPosition(lat, lng, shouldCenterMap)
  } catch {
    message.error('Failed to fetch weather data')
    currentWeather.value = null
    forecast.value = []
  } finally {
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

const fetchWeatherByAddress = async (address: string) => {
  loading.value = true

  try {
    const results = await performGeocode({ address })
    const location = results[0].geometry.location
    const lat = location.lat()
    const lng = location.lng()
    const formattedAddress = results[0].formatted_address

    locationName.value = formattedAddress
    await fetchWeatherByCoords(lat, lng, true)
  } catch {
    message.error('Failed to find location')
    currentWeather.value = null
    forecast.value = []
    loading.value = false
  }
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

const initMap = async () => {
  await nextTick()
  if (!mapRef.value || !(window as unknown as GoogleMapsWindow).google) return
  const google = (window as unknown as GoogleMapsWindow).google

  let center = currentCoords.value
  if (!center) {
    try {
      const results = await performGeocode({ address: locationName.value })
      const location = results[0].geometry.location
      center = { lat: location.lat(), lng: location.lng() }
    } catch {
      center = { lat: 21.0285, lng: 105.8542 }
    }
  }

  googleMap.value = new google.maps.Map(mapRef.value, {
    center,
    zoom: 12,
    styles: darkMapStyle,
    disableDefaultUI: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  })

  if (currentCoords.value) {
    marker.value = new google.maps.Marker({
      position: currentCoords.value,
      map: googleMap.value,
      animation: google.maps.Animation.DROP,
    })
  }

  if (googleMap.value) {
    googleMap.value.addListener(
      'click',
      async (e: { latLng: { lat: () => number; lng: () => number } }) => {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        await fetchWeatherByCoords(lat, lng, false)
      },
    )
  }
}

const updateMapPosition = (lat: number, lng: number, shouldCenter = false) => {
  const google = (window as unknown as GoogleMapsWindow).google
  if (googleMap.value && google) {
    if (marker.value) {
      marker.value.setPosition({ lat, lng })
    } else {
      marker.value = new google.maps.Marker({
        position: { lat, lng },
        map: googleMap.value,
        animation: google.maps.Animation.DROP,
      })
    }
    if (shouldCenter) {
      googleMap.value.setCenter({ lat, lng })
    }
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
  if (typeof (window as unknown as GoogleMapsWindow).google === 'undefined') {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = async () => {
      isLoadingMap.value = true
      await initMap()
      isLoadingMap.value = false
      await fetchWeatherByAddress(locationName.value)
    }
    document.head.appendChild(script)
  } else {
    isLoadingMap.value = true
    await initMap()
    isLoadingMap.value = false
    await fetchWeatherByAddress(locationName.value)
  }
})
</script>
