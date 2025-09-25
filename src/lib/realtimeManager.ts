import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * ULTRA SAFE Realtime Manager Singleton
 *
 * Διαχειρίζεται όλες τις realtime συνδέσεις της εφαρμογής
 * Εξαλείφει duplicates, memory leaks και conflicts
 */
class RealtimeManager {
  private static instance: RealtimeManager | null = null
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscribers: Map<string, Set<string>> = new Map() // tableName -> Set of storeIds
  private connectionStatus: Map<string, boolean> = new Map() // channelName -> isConnected
  private lastActivity: Map<string, number> = new Map() // channelName -> timestamp
  private cleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    console.log('🚀 RealtimeManager: Singleton instance created')
    this.startCleanupInterval()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  /**
   * Subscribe to table changes
   */
  subscribe<T>(options: {
    tableName: string
    storeId: string
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
    onStatusChange?: (status: string, error?: Error) => void
  }): void {
    const { tableName, storeId, onInsert, onUpdate, onDelete, onStatusChange } = options

    console.log(`🔌 RealtimeManager: Subscribing ${storeId} to ${tableName}`)

    // Track this subscriber
    if (!this.subscribers.has(tableName)) {
      this.subscribers.set(tableName, new Set())
    }
    this.subscribers.get(tableName)!.add(storeId)

    // If channel already exists, reuse it
    let channel = this.channels.get(tableName)

    if (channel) {
      console.log(`♻️ RealtimeManager: Reusing existing channel for ${tableName}`)
      this.updateLastActivity(tableName)

      // Notify about current connection status
      const isConnected = this.connectionStatus.get(tableName) || false
      onStatusChange?.(isConnected ? 'SUBSCRIBED' : 'CLOSED')
      return
    }

    // Create new channel
    console.log(`🆕 RealtimeManager: Creating new channel for ${tableName}`)
    channel = supabase.channel(`realtime_${tableName}_${Date.now()}`)

    // Set up event listeners
    if (onInsert) {
      channel.on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: tableName },
        (payload) => {
          this.updateLastActivity(tableName)
          onInsert(payload)
        }
      )
    }

    if (onUpdate) {
      channel.on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: tableName },
        (payload) => {
          this.updateLastActivity(tableName)
          onUpdate(payload)
        }
      )
    }

    if (onDelete) {
      channel.on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: tableName },
        (payload) => {
          this.updateLastActivity(tableName)
          onDelete(payload)
        }
      )
    }

    // Subscribe with status callback
    channel.subscribe((status, err) => {
      console.log(`📡 RealtimeManager: ${tableName} subscription status: ${status}`)

      const isConnected = status === 'SUBSCRIBED'
      this.connectionStatus.set(tableName, isConnected)

      if (err) {
        console.error(`❌ RealtimeManager: Subscription error for ${tableName}:`, err)
        onStatusChange?.(status, err)
      } else {
        onStatusChange?.(status)
        if (isConnected) {
          this.updateLastActivity(tableName)
        }
      }
    })

    // Store the channel
    this.channels.set(tableName, channel)
    this.updateLastActivity(tableName)
  }

  /**
   * Unsubscribe a specific store from a table
   */
  unsubscribe(tableName: string, storeId: string): void {
    console.log(`🔌 RealtimeManager: Unsubscribing ${storeId} from ${tableName}`)

    const subscribers = this.subscribers.get(tableName)
    if (!subscribers) return

    subscribers.delete(storeId)

    // If no more subscribers, close the channel
    if (subscribers.size === 0) {
      this.closeChannel(tableName)
    }
  }

  /**
   * Close a specific channel
   */
  private closeChannel(tableName: string): void {
    const channel = this.channels.get(tableName)
    if (!channel) return

    console.log(`🔌 RealtimeManager: Closing channel for ${tableName}`)

    try {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    } catch (error) {
      console.error(`❌ RealtimeManager: Error closing channel for ${tableName}:`, error)
    }

    this.channels.delete(tableName)
    this.subscribers.delete(tableName)
    this.connectionStatus.delete(tableName)
    this.lastActivity.delete(tableName)
  }

  /**
   * Get connection status for a table
   */
  getConnectionStatus(tableName: string): boolean {
    return this.connectionStatus.get(tableName) || false
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size
  }

  /**
   * Get subscribers count for a table
   */
  getSubscribersCount(tableName: string): number {
    return this.subscribers.get(tableName)?.size || 0
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(tableName: string): void {
    this.lastActivity.set(tableName, Date.now())
  }

  /**
   * Start cleanup interval to remove inactive channels
   */
  private startCleanupInterval(): void {
    // Check every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveChannels()
    }, 5 * 60 * 1000)
  }

  /**
   * Clean up channels that haven't been active for too long
   */
  private cleanupInactiveChannels(): void {
    const now = Date.now()
    const maxInactiveTime = 10 * 60 * 1000 // 10 minutes

    for (const [tableName, lastActivity] of this.lastActivity.entries()) {
      if (now - lastActivity > maxInactiveTime) {
        const subscribersCount = this.getSubscribersCount(tableName)
        console.log(`🧹 RealtimeManager: Cleaning up inactive channel ${tableName} (${subscribersCount} subscribers, last activity ${Math.round((now - lastActivity) / 1000)}s ago)`)

        if (subscribersCount === 0) {
          this.closeChannel(tableName)
        }
      }
    }
  }

  /**
   * Force close all channels (for app shutdown)
   */
  disconnectAll(): void {
    console.log('🔌 RealtimeManager: Disconnecting all channels')

    for (const tableName of this.channels.keys()) {
      this.closeChannel(tableName)
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    activeChannels: number
    channelDetails: { tableName: string, subscribers: number, connected: boolean, lastActivity: number }[]
  } {
    const channelDetails = Array.from(this.channels.keys()).map(tableName => ({
      tableName,
      subscribers: this.getSubscribersCount(tableName),
      connected: this.getConnectionStatus(tableName),
      lastActivity: this.lastActivity.get(tableName) || 0
    }))

    return {
      activeChannels: this.channels.size,
      channelDetails
    }
  }
}

// Export singleton instance
export const realtimeManager = RealtimeManager.getInstance()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.disconnectAll()
  })
}