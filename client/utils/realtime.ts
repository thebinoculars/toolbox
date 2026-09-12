import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseAnonKey, getSupabaseUrl } from '~/shared/utils'

// Types
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

// Supabase client instance
let supabaseClient: SupabaseClient | null = null

/**
 * Initialize Supabase client
 */
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

/**
 * Get Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseClient || createSupabaseClient()
}

/**
 * Create a realtime channel
 */
export const createChannel = (roomName: string): RealtimeChannel | null => {
  const client = getSupabaseClient()
  if (!client) {
    return null
  }

  return client.channel(roomName)
}

/**
 * Subscribe to a channel
 */
export const subscribeToChannel = (
  channel: RealtimeChannel,
  callback: (status: string) => void,
): void => {
  channel.subscribe(callback)
}

/**
 * Listen to a broadcast event on a channel
 */
export const listenToChannelEvent = <T = unknown>(
  channel: RealtimeChannel,
  event: string,
  handler: (payload: BroadcastPayload<T>) => void,
): void => {
  channel.on('broadcast' as any, { event }, handler)
}

/**
 * Send a broadcast message on a channel
 */
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

/**
 * Remove a channel
 */
export const removeChannel = async (channel: RealtimeChannel): Promise<void> => {
  const client = getSupabaseClient()
  if (!client) {
    return
  }

  await client.removeChannel(channel)
}

/**
 * Clear timer
 */
export const clearTimer = (timer: TimerId | null): void => {
  if (timer) {
    clearInterval(timer)
  }
}
