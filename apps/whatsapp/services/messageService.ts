import { supabase } from '../utils/supabase';
import { Message } from '@/types/Message';
import { useSetAtom } from 'jotai';
import { messagesAtom, latestMessageAtom } from '@/data/atom/messageAtom';
import { useEffect } from 'react';
import { getOrCreateChat } from './chatService';
import { getUserByPhone } from './userService';

export const sendMessage = async (
  senderId: string,
  chatId: string,
  content: string,
  type: 'text' | 'image',
) => {
  // Get or create chat ID
  const sender_id = await getUserByPhone(senderId);

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        chat_id: chatId,
        sender_id: sender_id?.id,
        content,
        type,
        status: 'sent',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
  }

  return data;
};

export const updateMessageStatus = async (
  messageId: string,
  status: 'delivered' | 'seen',
) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    console.error('Error updating message status:', error);
  }

  return data;
};

export const useMessages = (chatId: string) => {
  const setMessages = useSetAtom(messagesAtom);
  const setLatestMessage = useSetAtom(latestMessageAtom);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        const nonNullMessages = (data as Message[]).filter(
          (msg) => msg !== null,
        );
        setMessages(nonNullMessages);

        // Mark received messages as delivered
        const undeliveredMessages = nonNullMessages.filter(
          (msg) => msg.status === 'sent',
        );

        for (const msg of undeliveredMessages) {
          await updateMessageStatus(msg.id, 'delivered');
        }
      }
    };

    fetchMessages();

    // Listen for new messages and status updates
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message;

          if (payload.eventType === 'INSERT') {
            setMessages((messages) =>
              [...messages, newMessage].filter((msg) => msg !== null),
            );
            setLatestMessage(newMessage);
            // If we're the receiver, mark as delivered
            if (newMessage.status === 'sent') {
              updateMessageStatus(newMessage.id, 'delivered');
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages((messages) =>
              messages
                .map((msg) => (msg.id === newMessage.id ? newMessage : msg))
                .filter((msg) => msg !== null),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, setMessages, setLatestMessage]);
};
