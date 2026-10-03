import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseAnonKey, getSupabaseUrl } from '~/shared/utils'

export interface Player {
  id: string
  name: string
  symbol: 'X' | 'O'
}

export interface GameState {
  board: (string | null)[][]
  currentPlayer: 'X' | 'O'
  gameStarted: boolean
  gameEnded: boolean
  winner: string | null
  winningCells: [number, number][] | null
  players: Player[]
}

export interface PlayAgainStatus {
  readyCount: number
  totalPlayers: number
  readyPlayers: string[]
}

export interface BroadcastPayload<T = unknown> {
  payload: T
}

export type TimerId = ReturnType<typeof setInterval>

let supabaseClient: SupabaseClient | null = null

export const createSupabaseClient = (): SupabaseClient | null => {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration')
    return null
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseClient || createSupabaseClient()
}

export const createChannel = (roomName: string): RealtimeChannel | null => {
  const client = getSupabaseClient()
  if (!client) {
    return null
  }

  return client.channel(roomName)
}

export const subscribeToChannel = (
  channel: RealtimeChannel,
  callback: (status: string) => void,
): void => {
  channel.subscribe(callback)
}

export const listenToChannelEvent = <T = unknown>(
  channel: RealtimeChannel,
  event: string,
  handler: (payload: BroadcastPayload<T>) => void,
): void => {
  channel.on('broadcast', { event }, (message) => handler({ payload: message.payload }))
}

export const sendChannelMessage = <T = unknown>(
  channel: RealtimeChannel,
  event: string,
  payload: T,
): void => {
  channel.send({
    type: 'broadcast',
    event,
    payload,
  })
}

export const removeChannel = async (channel: RealtimeChannel): Promise<void> => {
  const client = getSupabaseClient()
  if (!client) {
    return
  }

  await client.removeChannel(channel)
}

export const clearTimer = (timer: TimerId | null): void => {
  if (timer) {
    clearInterval(timer)
  }
}
