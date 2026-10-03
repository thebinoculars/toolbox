import type { Ref } from 'vue'

import { getGoogleMapsApiKey } from '~/shared/utils'

export interface LatLng {
  lat: number
  lng: number
}

interface GoogleLatLng {
  lat: () => number
  lng: () => number
}

interface GoogleMap {
  setCenter: (latLng: LatLng) => void
  addListener: (event: 'click', handler: (e: { latLng: GoogleLatLng }) => void) => void
}

interface GoogleMarker {
  setPosition: (latLng: LatLng) => void
}

interface GoogleMapOptions {
  center: LatLng
  zoom: number
  styles: { featureType?: string; elementType: string; stylers: { color: string }[] }[]
  disableDefaultUI: boolean
  mapTypeControl: boolean
  streetViewControl: boolean
  fullscreenControl: boolean
}

interface GoogleMarkerOptions {
  position: LatLng
  map: GoogleMap
  animation: number
}

interface GoogleGeocoderResult {
  formatted_address: string
  geometry: { location: GoogleLatLng }
}

export interface GeocodeRequest {
  location?: LatLng
  address?: string
}

interface GoogleMapsApi {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap
    Marker: new (options: GoogleMarkerOptions) => GoogleMarker
    Geocoder: new () => {
      geocode: (
        request: GeocodeRequest,
        callback: (results: GoogleGeocoderResult[], status: string) => void,
      ) => void
    }
    Animation: { DROP: number }
  }
}

declare global {
  interface Window {
    google?: GoogleMapsApi
  }
}

const DARK_MAP_STYLE: GoogleMapOptions['styles'] = [
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

const loadGoogleMapsScript = () =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${getGoogleMapsApiKey()}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

export const geocode = (request: GeocodeRequest) => {
  const google = window.google
  if (!google) {
    return Promise.reject(new Error('Google Maps API not loaded'))
  }

  const geocoder = new google.maps.Geocoder()
  return new Promise<GoogleGeocoderResult[]>((resolve, reject) => {
    geocoder.geocode(request, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        resolve(results)
      } else {
        reject(
          new Error(
            status === 'REQUEST_DENIED'
              ? 'Google Maps API key is not authorized'
              : 'Location not found',
          ),
        )
      }
    })
  })
}

export const useGoogleMap = (
  mapRef: Ref<HTMLElement | null>,
  onMapClick: (lat: number, lng: number) => void,
) => {
  const message = useMessage()

  const isLoadingMap = ref(false)
  const mapError = ref('')
  const googleMap = shallowRef<GoogleMap | null>(null)
  const marker = shallowRef<GoogleMarker | null>(null)

  const placeMarker = (lat: number, lng: number, shouldCenter = false) => {
    const google = window.google
    if (!googleMap.value || !google) return

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

  const initMap = async (
    resolveCenter: () => Promise<LatLng>,
    markerPosition: () => LatLng | null,
  ) => {
    await nextTick()
    const google = window.google
    if (!mapRef.value || !google) return

    const center = await resolveCenter()

    googleMap.value = new google.maps.Map(mapRef.value, {
      center,
      zoom: 12,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const position = markerPosition()
    if (position) {
      placeMarker(position.lat, position.lng)
    }

    googleMap.value.addListener('click', (e) => {
      onMapClick(e.latLng.lat(), e.latLng.lng())
    })
  }

  const loadMap = async (
    resolveCenter: () => Promise<LatLng>,
    markerPosition: () => LatLng | null,
  ) => {
    if (typeof window.google === 'undefined') {
      try {
        await loadGoogleMapsScript()
      } catch {
        mapError.value = 'Failed to load Google Maps. Please check your connection and reload.'
        message.error('Failed to load Google Maps')
        return false
      }
    }

    isLoadingMap.value = true
    await initMap(resolveCenter, markerPosition)
    isLoadingMap.value = false
    return true
  }

  return { isLoadingMap, mapError, loadMap, placeMarker }
}
