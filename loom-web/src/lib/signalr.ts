// SignalR hub manager: /hubs/chat?access_token=<jwt>. Reconnects. Fans events to listeners.
import {
  HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel,
} from '@microsoft/signalr'
import { tokenStore } from './tokenStore'
import { normMessage } from './types'
import type { Message } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

type Handlers = {
  onNewMessage?: (m: Message) => void
  onMessageEdited?: (m: Message) => void
  onMessageDeleted?: (messageId: number) => void
  onReactionUpdated?: (messageId: number) => void
  onMessageRead?: (messageId: number, userId: number) => void
  onUserOnline?: (userId: number) => void
  onUserOffline?: (userId: number, lastSeenAt: string) => void
  onUserTyping?: (chatId: number, userId: number) => void
  onStateChange?: (connected: boolean) => void
}

class SignalRManager {
  private conn: HubConnection | null = null
  private handlers: Handlers = {}
  private joined = new Set<number>()
  private starting: Promise<void> | null = null

  setHandlers(h: Handlers) { this.handlers = h }

  get connected() { return this.conn?.state === HubConnectionState.Connected }

  async start() {
    if (this.conn && this.conn.state !== HubConnectionState.Disconnected) return this.starting ?? undefined
    if (!tokenStore.access) return

    const conn = new HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/chat`, {
        accessTokenFactory: () => tokenStore.access ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build()

    conn.on('NewMessage', (dto: any) => this.handlers.onNewMessage?.(normMessage(dto)))
    conn.on('MessageEdited', (dto: any) => this.handlers.onMessageEdited?.(normMessage(dto)))
    conn.on('MessageDeleted', (messageId: number) => this.handlers.onMessageDeleted?.(Number(messageId)))
    conn.on('ReactionUpdated', (messageId: number) => this.handlers.onReactionUpdated?.(Number(messageId)))
    conn.on('MessageRead', (messageId: number, userId: number) => this.handlers.onMessageRead?.(Number(messageId), Number(userId)))
    conn.on('UserOnline', (userId: number) => this.handlers.onUserOnline?.(Number(userId)))
    conn.on('UserOffline', (userId: number, lastSeenAt: string) =>
      this.handlers.onUserOffline?.(Number(userId), lastSeenAt))
    conn.on('UserTyping', (chatId: number, userId: number) =>
      this.handlers.onUserTyping?.(Number(chatId), Number(userId)))

    conn.onreconnected(async () => {
      this.handlers.onStateChange?.(true)
      // Re-join rooms after a reconnect.
      for (const id of this.joined) {
        try { await conn.invoke('JoinChat', id) } catch { /* ignore */ }
      }
    })
    conn.onreconnecting(() => this.handlers.onStateChange?.(false))
    conn.onclose(() => this.handlers.onStateChange?.(false))

    this.conn = conn
    this.starting = conn.start()
      .then(async () => {
        this.handlers.onStateChange?.(true)
        // Join any rooms that were opened before the connection finished.
        for (const id of this.joined) {
          try { await conn.invoke('JoinChat', id) } catch { /* ignore */ }
        }
      })
      .catch((e) => { console.warn('[signalr] start failed', e) })
      .finally(() => { this.starting = null })
    return this.starting
  }

  async stop() {
    this.joined.clear()
    const c = this.conn
    this.conn = null
    if (c) { try { await c.stop() } catch { /* ignore */ } }
  }

  async joinChat(chatId: number) {
    this.joined.add(chatId)
    if (this.connected) { try { await this.conn!.invoke('JoinChat', chatId) } catch { /* ignore */ } }
  }
  async leaveChat(chatId: number) {
    this.joined.delete(chatId)
    if (this.connected) { try { await this.conn!.invoke('LeaveChat', chatId) } catch { /* ignore */ } }
  }
  async typing(chatId: number) {
    if (this.connected) { try { await this.conn!.invoke('Typing', chatId) } catch { /* ignore */ } }
  }
}

export const signalr = new SignalRManager()
