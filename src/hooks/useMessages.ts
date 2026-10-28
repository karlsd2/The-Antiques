import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
  is_me: boolean
}

export function useMessages(conversationId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setMessages([])
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchMessages() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Transform data to determine if message is from current user
        const transformedData: Message[] = (data || []).map((item: any) => ({
          id: item.id,
          conversation_id: item.conversation_id,
          sender_id: item.sender_id,
          body: item.body,
          created_at: item.created_at,
          read_at: item.read_at,
          is_me: item.sender_id === currentUserId,
        }))

        if (mounted) {
          setMessages(transformedData)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          console.error('Error fetching messages:', err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchMessages()

    // Clean up existing subscription if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // Create new subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!mounted) return

          const newMessage = payload.new as any

          // Ignore messages sent by the current user (they're already in the list)
          if (newMessage.sender_id === currentUserId) return

          const transformedMessage: Message = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            body: newMessage.body,
            created_at: newMessage.created_at,
            read_at: newMessage.read_at,
            is_me: newMessage.sender_id === currentUserId,
          }

          // Add new message to the list if it doesn't already exist
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === transformedMessage.id)
            if (exists) return prev
            return [...prev, transformedMessage]
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, currentUserId])

  const refetch = async () => {
    if (!conversationId || !currentUserId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const transformedData: Message[] = (data || []).map((item: any) => ({
        id: item.id,
        conversation_id: item.conversation_id,
        sender_id: item.sender_id,
        body: item.body,
        created_at: item.created_at,
        read_at: item.read_at,
        is_me: item.sender_id === currentUserId,
      }))

      setMessages(transformedData)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  return { messages, loading, error, refetch }
}
